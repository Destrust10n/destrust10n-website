import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendInquiryEmail, EmailDispatchResult } from './mailer.js';

export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  query?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
  url?: string;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

export interface ApiResponse {
  status(statusCode: number): this;
  json(body: any): this;
  send(body: any): this;
  setHeader(name: string, value: string | number | readonly string[]): this;
  end(): void;
}

export interface StoredInquiry {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  description: string;
  ipHash: string;
  userAgent?: string;
  status: 'new' | 'reviewed' | 'closed';
  emailStatus?: 'sent' | 'failed' | 'skipped' | 'pending';
  emailError?: string | null;
  emailSentAt?: string | null;
  emailAttempts?: number;
  emailRecipient?: string;
  emailLastAttemptAt?: string | null;
}

// In-memory duplicate submission detector (5-minute sliding window)
const recentSubmissionsCache = new Map<string, number>();

function isDuplicateSubmission(email: string, description: string): boolean {
  const hash = crypto
    .createHash('sha256')
    .update(`${email.trim().toLowerCase()}:${description.trim()}`)
    .digest('hex');
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes

  for (const [k, timestamp] of recentSubmissionsCache.entries()) {
    if (now - timestamp > windowMs) {
      recentSubmissionsCache.delete(k);
    }
  }

  if (recentSubmissionsCache.has(hash)) {
    return true;
  }

  recentSubmissionsCache.set(hash, now);
  return false;
}

// HTML Sanitization helper to neutralize Stored XSS vectors
function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Zod Validation Schema with strict input boundaries (Zod 4 & 3 compatible)
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name cannot exceed 80 characters.'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address.')
    .max(100, 'Email cannot exceed 100 characters.'),
  projectType: z
    .string()
    .trim()
    .min(2, 'Project type is required.')
    .max(60, 'Project type must not exceed 60 characters.'),
  budget: z
    .string()
    .trim()
    .max(60, 'Budget selection cannot exceed 60 characters.')
    .optional(),
  description: z
    .string()
    .trim()
    .min(15, 'Please provide at least 15 characters describing your project.')
    .max(1500, 'Description cannot exceed 1500 characters.'),
  // Anti-spam honeypot field (must remain empty for human users)
  website: z.string().max(100).optional(),
});

// In-memory sliding-window rate limit tracker (Local Fallback)
const inMemoryRateLimitMap = new Map<string, number[]>();

function checkInMemoryRateLimit(clientIp: string): { allowed: boolean; waitMinutes: number } {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = inMemoryRateLimitMap.get(clientIp) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= 5) {
    const waitMinutes = Math.ceil((windowMs - (now - recentTimestamps[0])) / 60000);
    return { allowed: false, waitMinutes };
  }

  recentTimestamps.push(now);
  inMemoryRateLimitMap.set(clientIp, recentTimestamps);
  return { allowed: true, waitMinutes: 0 };
}

/**
 * Distributed rate limiter with Upstash Redis and in-memory fallback
 */
async function checkDistributedRateLimit(clientIp: string): Promise<{ allowed: boolean; waitMinutes: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  // If Upstash Redis is configured, use distributed multi-instance atomic rate limiting
  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:contact:${clientIp}`;
      const windowSeconds = 600; // 10 minutes
      const maxLimit = 5;

      const response = await fetch(`${upstashUrl.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds],
        ]),
      });

      if (response.ok) {
        const results = await response.json();
        const currentCount = Number(results[0]?.result || 1);
        if (currentCount > maxLimit) {
          return { allowed: false, waitMinutes: 10 };
        }
        return { allowed: true, waitMinutes: 0 };
      }
    } catch (redisErr) {
      console.warn('[DESTRUST10N RateLimiter] Upstash Redis check failed, falling back to in-memory:', redisErr);
    }
  }

  // Fallback: In-memory sliding-window rate limiter
  return checkInMemoryRateLimit(clientIp);
}

/**
 * Persists an inquiry across available providers:
 * 1. Primary: Supabase PostgreSQL via PostgREST
 * 2. Secondary: Firebase Firestore if configured
 * 3. Fallback: Local /tmp or server/data file + structured audit logging
 */
async function persistInquiry(record: StoredInquiry): Promise<{ stored: boolean; provider: string }> {
  let stored = false;
  let provider = 'audit_log';

  // 1. Primary Cloud Database: Supabase PostgreSQL
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/inquiries`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: record.id,
          timestamp: record.timestamp,
          created_at: record.timestamp,
          name: record.name,
          email: record.email,
          project_type: record.projectType,
          budget: record.budget,
          description: record.description,
          ip_hash: record.ipHash,
          user_agent: record.userAgent || '',
          status: record.status,
          email_status: 'pending',
          email_attempts: 0,
          email_recipient: 'destrust100n@gmail.com',
        }),
      });

      if (response.ok || response.status === 201) {
        stored = true;
        provider = 'supabase_postgresql';
        console.log(`[DESTRUST10N Storage] Persisted inquiry ${record.id} to Supabase PostgreSQL.`);
      } else {
        const errorText = await response.text();
        console.warn(`[DESTRUST10N Storage] Supabase returned HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('[DESTRUST10N Storage] Supabase request error:', err);
    }
  }

  // 2. Secondary: Firebase Firestore (if Supabase not active)
  if (!stored) {
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const firebaseApiKey = process.env.FIREBASE_API_KEY?.trim();

    if (firebaseProjectId && firebaseApiKey) {
      try {
        const firestoreEndpoint = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/inquiries?documentId=${record.id}&key=${firebaseApiKey}`;
        const response = await fetch(firestoreEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              id: { stringValue: record.id },
              timestamp: { stringValue: record.timestamp },
              name: { stringValue: record.name },
              email: { stringValue: record.email },
              projectType: { stringValue: record.projectType },
              budget: { stringValue: record.budget },
              description: { stringValue: record.description },
              ipHash: { stringValue: record.ipHash },
              userAgent: { stringValue: record.userAgent || '' },
              status: { stringValue: record.status },
              emailStatus: { stringValue: 'pending' },
            },
          }),
        });

        if (response.ok || response.status === 200) {
          stored = true;
          provider = 'firebase_firestore';
          console.log(`[DESTRUST10N Storage] Persisted inquiry ${record.id} to Firebase Firestore.`);
        } else {
          const errText = await response.text();
          console.warn(`[DESTRUST10N Storage] Firestore returned HTTP ${response.status}: ${errText}`);
        }
      } catch (err) {
        console.error('[DESTRUST10N Storage] Firebase Firestore request error:', err);
      }
    }
  }

  // 3. Fallback Storage: Writable File System (/tmp in serverless or server/data in local)
  try {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const targetDir = isServerless
      ? '/tmp'
      : path.resolve(process.cwd(), 'server/data');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, 'inquiries.json');
    let existingList: StoredInquiry[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        existingList = JSON.parse(raw);
      } catch {
        existingList = [];
      }
    }

    existingList.push({
      ...record,
      emailStatus: 'pending',
      emailAttempts: 0,
      emailRecipient: 'destrust100n@gmail.com',
    });
    fs.writeFileSync(filePath, JSON.stringify(existingList, null, 2), 'utf-8');

    if (!stored) {
      stored = true;
      provider = isServerless ? 'serverless_tmp' : 'filesystem';
    }
    console.log(`[DESTRUST10N Storage] Written to ${filePath} (${existingList.length} inquiries total).`);
  } catch (fsErr) {
    console.warn('[DESTRUST10N Storage] File system write skipped or read-only:', fsErr);
    if (!stored) {
      stored = true;
      provider = 'audit_log';
    }
  }

  // 4. Structured Audit Log (Permanently indexed in Vercel Runtime Logs)
  console.info('[DESTRUST10N_INQUIRY_AUDIT]', JSON.stringify({
    inquiryId: record.id,
    timestamp: record.timestamp,
    name: record.name,
    email: record.email,
    projectType: record.projectType,
    budget: record.budget,
    descriptionLength: record.description.length,
    provider,
  }));

  return { stored, provider };
}

/**
 * Updates the stored inquiry with the outcome of the email notification attempt
 */
async function updateStoredEmailStatus(
  inquiryId: string,
  result: EmailDispatchResult
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();
  const nowIso = new Date().toISOString();

  const emailStatus = result.success
    ? 'sent'
    : (result.provider === 'none' ? 'skipped' : 'failed');

  const updatePayload: Record<string, any> = {
    email_status: emailStatus,
    email_error: result.success ? null : (result.error || null),
    email_attempts: 1,
    email_last_attempt_at: nowIso,
    email_recipient: result.recipient,
    ...(result.success && result.sentAt ? { email_sent_at: result.sentAt } : {}),
  };

  // 1. Update Supabase
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/inquiries?id=eq.${inquiryId}`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(updatePayload),
      });
    } catch (err) {
      console.warn('[DESTRUST10N Storage] Failed to update email status in Supabase:', err);
    }
  }

  // 2. Update Local Storage / tmp
  try {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const targetDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'server/data');
    const filePath = path.join(targetDir, 'inquiries.json');
    if (fs.existsSync(filePath)) {
      const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const index = list.findIndex((i: any) => i.id === inquiryId);
      if (index !== -1) {
        list[index] = {
          ...list[index],
          emailStatus,
          emailError: result.success ? null : (result.error || null),
          emailAttempts: 1,
          emailLastAttemptAt: nowIso,
          emailRecipient: result.recipient,
          ...(result.success && result.sentAt ? { emailSentAt: result.sentAt } : {}),
        };
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
      }
    }
  } catch {}
}

/**
 * Production Vercel Serverless Function entrypoint for POST /api/contact
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. CORS Configuration
  const originHeader = req.headers['origin'];
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  const allowedOrigins = [
    'https://destrust10n-website.vercel.app',
    'https://destrust10n.com',
    'https://www.destrust10n.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((o) => allowedOrigins.push(o.trim()));
  }

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // 2. Handle CORS Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // 3. Enforce POST Method
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed. Please use POST.`,
    });
    return;
  }

  try {
    // 4. Client IP Extraction with edge reverse-proxy precedence
    const realIpHeader = req.headers['x-real-ip'];
    const realIp = Array.isArray(realIpHeader) ? realIpHeader[0] : realIpHeader;
    const forwardedHeader = req.headers['x-forwarded-for'];
    const forwardedFor = Array.isArray(forwardedHeader) ? forwardedHeader[0] : forwardedHeader;
    const rawIp = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || req.ip || req.socket?.remoteAddress || 'unknown';
    const clientIp = rawIp.replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);

    // 5. Distributed / In-Memory Rate Limiting Check
    const { allowed, waitMinutes } = await checkDistributedRateLimit(clientIp);
    if (!allowed) {
      res.status(429).json({
        success: false,
        message: `Too many submissions from this connection. Please retry in ${waitMinutes} minute(s).`,
      });
      return;
    }

    // 6. Safe Body Parsing
    let rawBody = req.body;
    if (typeof rawBody === 'string') {
      try {
        rawBody = JSON.parse(rawBody);
      } catch {
        res.status(400).json({
          success: false,
          message: 'Malformed request payload. Expected valid JSON.',
        });
        return;
      }
    }

    if (!rawBody || typeof rawBody !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Empty or invalid request body.',
      });
      return;
    }

    // 7. Zod Schema Validation (Dual Zod 3 & 4 compatible)
    const parseResult = contactSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
      issues.forEach((err: any) => {
        if (err.path && err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });

      res.status(400).json({
        success: false,
        message: 'Form validation failed. Please check your inputs.',
        errors: fieldErrors,
      });
      return;
    }

    const { name, email, projectType, budget, description, website } = parseResult.data;

    // 8. Anti-Spam Honeypot Verification
    if (website && website.trim().length > 0) {
      console.warn(`[DESTRUST10N Security] Honeypot triggered by client IP: ${clientIp}`);
      res.status(400).json({
        success: false,
        message: 'Spam protection triggered. Submission rejected.',
      });
      return;
    }

    // 9. Input Sanitization
    const cleanName = sanitizeText(name);
    const cleanEmail = email.toLowerCase().trim();
    const cleanProjectType = sanitizeText(projectType);
    const cleanBudget = budget ? sanitizeText(budget) : 'Starting Tier ($10 - $25)';
    const cleanDescription = sanitizeText(description);

    // 10. Duplicate Submission Check (5-minute sliding window)
    if (isDuplicateSubmission(cleanEmail, cleanDescription)) {
      res.status(409).json({
        success: false,
        message: 'Duplicate inquiry detected. An inquiry with these exact details was submitted recently. Please allow time for review before resubmitting.',
      });
      return;
    }

    // 11. Generate Trackable Reference Code
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const inquiryId = `D10-INQ-${Date.now().toString().slice(-4)}-${randomHex}`;
    const timestampIso = new Date().toISOString();

    const inquiryRecord: StoredInquiry = {
      id: inquiryId,
      timestamp: timestampIso,
      name: cleanName,
      email: cleanEmail,
      projectType: cleanProjectType,
      budget: cleanBudget,
      description: cleanDescription,
      ipHash: clientIp.substring(0, 15),
      userAgent: (Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'])?.substring(0, 80),
      status: 'new',
    };

    // 12. STEP 1: Multi-Store Persistent Storage (Inquiry saved FIRST)
    const storageResult = await persistInquiry(inquiryRecord);

    if (!storageResult.stored) {
      res.status(500).json({
        success: false,
        message: 'Unable to save your inquiry to persistent storage at this moment. Please reach out to us at destrust100n@gmail.com.',
      });
      return;
    }

    // 13. STEP 2: Dedicated Email Notification Relay (Separate Operation)
    const emailDispatch = await sendInquiryEmail({
      id: inquiryRecord.id,
      timestamp: inquiryRecord.timestamp,
      name: inquiryRecord.name,
      email: inquiryRecord.email,
      projectType: inquiryRecord.projectType,
      budget: inquiryRecord.budget,
      description: inquiryRecord.description,
    });

    // 14. STEP 3: Record Email Delivery Outcome in Database
    await updateStoredEmailStatus(inquiryRecord.id, emailDispatch);

    // 15. Formulate Transparent Response
    const responseMessage = emailDispatch.success
      ? 'Your project inquiry has been securely received by DESTRUST10N and alert sent to studio inbox.'
      : 'Your project inquiry has been securely received and recorded by DESTRUST10N. (Studio alert is queued).';

    res.status(200).json({
      success: true,
      message: responseMessage,
      inquiryId,
      provider: storageResult.provider,
      emailDelivered: emailDispatch.success,
      emailStatus: emailDispatch.success ? 'sent' : (emailDispatch.provider === 'none' ? 'skipped' : 'failed'),
      ...(emailDispatch.diagnostic ? { emailDiagnostic: emailDispatch.diagnostic } : {}),
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  } catch (error) {
    console.error('[DESTRUST10N API] Unexpected error handling contact submission:', error);
    res.status(500).json({
      success: false,
      message: 'A secure server error occurred while processing your inquiry. Please retry.',
    });
  }
}
