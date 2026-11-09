import { z } from 'zod';
import fs from 'fs';
import path from 'path';

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
  status: 'new' | 'reviewed' | 'contacted';
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

// Zod Validation Schema with strict input boundaries
const contactSchema = z.object({
  name: z
    .string({ required_error: 'Please provide your name or organization.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name cannot exceed 80 characters.'),
  email: z
    .string({ required_error: 'Please provide an email address.' })
    .trim()
    .email('Please provide a valid email address.')
    .max(100, 'Email must not exceed 100 characters.'),
  projectType: z
    .string({ required_error: 'Please select a project type.' })
    .trim()
    .min(2, 'Project type is required.')
    .max(60, 'Project type must not exceed 60 characters.'),
  budget: z
    .string()
    .trim()
    .max(60, 'Budget selection cannot exceed 60 characters.')
    .optional(),
  description: z
    .string({ required_error: 'Please describe your project requirements.' })
    .trim()
    .min(15, 'Please provide at least 15 characters describing your project.')
    .max(1500, 'Description cannot exceed 1500 characters.'),
  // Anti-spam honeypot field (must remain empty for human users)
  website: z.string().max(100).optional(),
});

// In-memory sliding-window rate limit tracker
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(clientIp: string): { allowed: boolean; waitMinutes: number } {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = rateLimitMap.get(clientIp) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= 5) {
    const waitMinutes = Math.ceil((windowMs - (now - recentTimestamps[0])) / 60000);
    return { allowed: false, waitMinutes };
  }

  recentTimestamps.push(now);
  rateLimitMap.set(clientIp, recentTimestamps);
  return { allowed: true, waitMinutes: 0 };
}

/**
 * Persists an inquiry across available providers:
 * 1. Supabase (PostgreSQL) if SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY are set
 * 2. Firebase Firestore if FIREBASE_PROJECT_ID is set
 * 3. File system persistence (local server/data or serverless /tmp)
 * 4. Email notification via Resend to destrust100n@gmail.com if RESEND_API_KEY is set
 */
async function persistInquiry(record: StoredInquiry): Promise<void> {
  let stored = false;
  let provider = 'audit_log';

  // 1. Check Supabase PostgreSQL Integration
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
          name: record.name,
          email: record.email,
          project_type: record.projectType,
          budget: record.budget,
          description: record.description,
          ip_hash: record.ipHash,
          user_agent: record.userAgent || '',
          status: record.status,
        }),
      });

      if (response.ok || response.status === 201) {
        stored = true;
        provider = 'supabase';
        console.log(`[DESTRUST10N Storage] Persisted inquiry ${record.id} to Supabase PostgreSQL.`);
      } else {
        const errorText = await response.text();
        console.warn(`[DESTRUST10N Storage] Supabase returned HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('[DESTRUST10N Storage] Supabase request error:', err);
    }
  }

  // 2. Check Firebase Firestore Integration (if Supabase not active)
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
            },
          }),
        });

        if (response.ok || response.status === 200) {
          stored = true;
          provider = 'firestore';
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

    existingList.push(record);
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

  // 4. Structured Audit Log (Indexed in Vercel Runtime Logs)
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

  // 5. Optional Email Alert Dispatch via Resend (never blocks successful inquiry response)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const alertRecipient = process.env.STUDIO_ALERT_EMAIL || 'destrust100n@gmail.com';

  if (resendApiKey) {
    try {
      const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050608; color: #F5F7FA; padding: 32px 16px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #101318; border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 12px; padding: 24px;">
    <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
      <span style="font-family: monospace; font-size: 11px; color: #00E5FF; text-transform: uppercase;">DESTRUST10N // NEW INQUIRY</span>
      <h2 style="margin: 8px 0 0; color: #F5F7FA; font-size: 20px;">Project Inquiry: ${record.projectType}</h2>
      <p style="margin: 4px 0 0; color: #929AA5; font-size: 13px;">Ref: <strong>${record.id}</strong> | ${record.timestamp}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #929AA5; width: 120px;">Client Name:</td>
        <td style="padding: 8px 0; color: #F5F7FA; font-weight: 600;">${record.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #929AA5;">Client Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${record.email}" style="color: #00E5FF; text-decoration: none;">${record.email}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #929AA5;">Project Type:</td>
        <td style="padding: 8px 0; color: #F5F7FA;">${record.projectType}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #929AA5;">Budget:</td>
        <td style="padding: 8px 0; color: #00E5FF; font-weight: 600;">${record.budget}</td>
      </tr>
    </table>
    <div style="background-color: rgba(0, 229, 255, 0.04); border-left: 3px solid #00E5FF; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; color: #929AA5; font-size: 12px; text-transform: uppercase;">Project Requirements:</p>
      <p style="margin: 0; color: #F5F7FA; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${record.description}</p>
    </div>
    <div style="text-align: center; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
      <a href="mailto:${record.email}?subject=Re:%20DESTRUST10N%20Project%20Inquiry%20[${record.id}]"
         style="display: inline-block; background-color: #00E5FF; color: #050608; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px;">
        Reply Directly to Client
      </a>
    </div>
  </div>
</body>
</html>`;

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DESTRUST10N Studio <onboarding@resend.dev>',
          to: [alertRecipient],
          reply_to: record.email,
          subject: `[DESTRUST10N Inquiry] ${record.name} — ${record.projectType} (${record.budget})`,
          html: emailHtml,
        }),
      });

      if (emailResponse.ok) {
        console.log(`[DESTRUST10N Mailer] Notification email dispatched to ${alertRecipient} via Resend.`);
      } else {
        const emailErr = await emailResponse.text();
        console.warn(`[DESTRUST10N Mailer] Resend returned HTTP ${emailResponse.status}: ${emailErr}`);
      }
    } catch (mailError) {
      console.error('[DESTRUST10N Mailer] Email dispatch failed, but inquiry is safely stored:', mailError);
    }
  }
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
    // 4. Client IP Extraction
    const forwardedHeader = req.headers['x-forwarded-for'];
    const forwardedFor = Array.isArray(forwardedHeader) ? forwardedHeader[0] : forwardedHeader;
    const realIpHeader = req.headers['x-real-ip'];
    const realIp = Array.isArray(realIpHeader) ? realIpHeader[0] : realIpHeader;
    // Prioritize x-real-ip from edge proxy to prevent X-Forwarded-For spoofing
    const rawIp = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || req.ip || req.socket?.remoteAddress || 'unknown';
    const clientIp = rawIp.replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);

    // 5. Rate Limiting Check
    const { allowed, waitMinutes } = checkRateLimit(clientIp);
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

    // 7. Zod Schema Validation
    const parseResult = contactSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        if (err.path[0]) {
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

    // 10. Generate Trackable Reference Code
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

    // 11. Multi-Store Persistent Storage
    await persistInquiry(inquiryRecord);

    // 12. Safe Success Response
    res.status(200).json({
      success: true,
      message: 'Your project inquiry has been securely received by DESTRUST10N.',
      inquiryId,
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
