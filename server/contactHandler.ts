import { z } from 'zod';
import { ApiRequest, ApiResponse } from '../api/types';
import { persistInquiry, StoredInquiry } from './inquiryStorage';

// HTML Sanitization helper to neutralize Stored XSS vectors
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Zod Validation Schema with strict input boundaries
export const contactSchema = z.object({
  name: z
    .string({ required_error: 'Please provide your name or organization.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name cannot exceed 80 characters.'),
  email: z
    .string({ required_error: 'Please provide an email address.' })
    .trim()
    .email('Please provide a valid email address.')
    .max(100, 'Email cannot exceed 100 characters.'),
  projectType: z
    .string({ required_error: 'Please select a project type.' })
    .trim()
    .min(2, 'Project type is required.')
    .max(60, 'Project type cannot exceed 60 characters.'),
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

// Prune expired rate limit entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}, 15 * 60 * 1000);

/**
 * Universal request handler compatible with both Express.js and Vercel Serverless Functions
 */
export async function handleContactRequest(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Configure CORS & Security Headers
  const originHeader = req.headers['origin'];
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  // Determine allowed origin
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
    // Non-browser or same-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Fallback same-origin default
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
    const rawIp = (forwardedFor ? forwardedFor.split(',')[0] : null) || realIp || req.ip || req.socket?.remoteAddress || 'unknown';
    const clientIp = rawIp.replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);

    // 5. IP Rate Limiting (5 requests per 10 minutes)
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const timestamps = rateLimitMap.get(clientIp) || [];
    const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (recentTimestamps.length >= 5) {
      const waitMinutes = Math.ceil((windowMs - (now - recentTimestamps[0])) / 60000);
      res.status(429).json({
        success: false,
        message: `Too many submissions from this connection. Please retry in ${waitMinutes} minute(s).`,
      });
      return;
    }

    recentTimestamps.push(now);
    rateLimitMap.set(clientIp, recentTimestamps);

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

    // 12. Safe, Non-Leaking Success Response
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
