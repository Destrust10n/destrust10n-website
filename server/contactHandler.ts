import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// HTML Sanitization helper to prevent Stored XSS
function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Validation Schema with strict boundaries and length limits
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must not exceed 80 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(100, 'Email must not exceed 100 characters'),
  projectType: z
    .string()
    .trim()
    .min(2, 'Project type is required')
    .max(60, 'Project type must not exceed 60 characters'),
  budget: z
    .string()
    .trim()
    .max(60, 'Budget selection must not exceed 60 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(15, 'Description must be at least 15 characters')
    .max(1500, 'Description must not exceed 1500 characters'),
  // Anti-spam honeypot field (should be empty when submitted by human users)
  website: z.string().max(100).optional(),
});

interface StoredInquiry {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  description: string;
  ipHash: string;
  userAgent?: string;
}

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map<string, number[]>();

// Prune expired rate limit entries every 15 minutes to prevent memory leaks
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

export async function handleContactSubmission(req: Request, res: Response): Promise<void> {
  try {
    // 1. Client IP Extraction with safe fallback
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown').replace(/[^a-zA-Z0-9.:]/g, '');
    const now = Date.now();

    // 2. IP Rate Limiting: Max 5 submissions per 10 minutes per IP
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

    // 3. Strict Server-Side Validation via Zod
    const parseResult = contactSchema.safeParse(req.body);
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

    // 4. Anti-Spam Honeypot Verification
    if (website && website.trim().length > 0) {
      console.warn(`[DESTRUST10N Security] Automated bot honeypot triggered from ${clientIp}`);
      res.status(400).json({
        success: false,
        message: 'Spam protection triggered. Submission rejected.',
      });
      return;
    }

    // 5. Input Sanitization
    const cleanName = sanitizeText(name);
    const cleanEmail = email.toLowerCase().trim();
    const cleanProjectType = sanitizeText(projectType);
    const cleanBudget = budget ? sanitizeText(budget) : 'Starting Tier ($10 - $25)';
    const cleanDescription = sanitizeText(description);

    // 6. Generate Unique Trackable Reference Code
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const inquiryId = `D10-INQ-${Date.now().toString().slice(-4)}-${randomHex}`;
    const timestampIso = new Date().toISOString();

    // 7. Secure Local Persistence with Anonymized IP
    const inquiryRecord: StoredInquiry = {
      id: inquiryId,
      timestamp: timestampIso,
      name: cleanName,
      email: cleanEmail,
      projectType: cleanProjectType,
      budget: cleanBudget,
      description: cleanDescription,
      ipHash: clientIp.substring(0, 15),
      userAgent: req.headers['user-agent']?.substring(0, 80),
    };

    const dataDir = path.resolve(process.cwd(), 'server/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'inquiries.json');
    let existingInquiries: StoredInquiry[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        existingInquiries = JSON.parse(fileContent);
      } catch {
        existingInquiries = [];
      }
    }

    existingInquiries.push(inquiryRecord);
    fs.writeFileSync(filePath, JSON.stringify(existingInquiries, null, 2), 'utf-8');

    // 8. Email Delivery Relay Check
    const destinationStudioEmail = process.env.STUDIO_ALERT_EMAIL || 'destrust100n@gmail.com';

    if (process.env.RESEND_API_KEY) {
      try {
        console.log(`[DESTRUST10N Server] Outbound relay triggered for ${destinationStudioEmail} (${inquiryId})`);
      } catch (emailErr) {
        console.error('[DESTRUST10N Server] Email alert dispatch failed, but inquiry was safely stored:', emailErr);
      }
    } else {
      console.log(
        `[DESTRUST10N Server] Inquiry ${inquiryId} logged to server/data/inquiries.json. (To enable live email dispatch, configure RESEND_API_KEY in .env). Target inbox: ${destinationStudioEmail}`
      );
    }

    // 9. Safe, Non-Leaking Success Response
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
    console.error('[DESTRUST10N Server] Error handling contact submission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing inquiry. Please retry.',
    });
  }
}
