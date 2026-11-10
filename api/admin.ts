import type { ApiRequest, ApiResponse } from './types';
import { getKolkataDateString, resolveAvailability } from './availability';
import { sendInquiryEmail, InquiryEmailData } from './mailer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Admin access stays disabled unless a strong server-side secret is configured.
const ADMIN_SECRET = (process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD)?.trim();
const ADMIN_SECRET_CONFIGURED = Boolean(ADMIN_SECRET && ADMIN_SECRET.length >= 32);

/**
 * Creates a signed cryptographic token with a 24-hour expiration
 */
function createAdminToken(): { token: string; expiresAt: string } {
  if (!ADMIN_SECRET_CONFIGURED || !ADMIN_SECRET) {
    throw new Error('Admin secret is not configured.');
  }
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const payload = Buffer.from(JSON.stringify({ role: 'admin', expiresAt })).toString('base64');
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  const token = `${payload}.${signature}`;
  return { token, expiresAt };
}

/**
 * Verifies the validity and expiration of an incoming admin token
 */
function verifyAdminToken(authHeader: string | string[] | undefined): boolean {
  if (!ADMIN_SECRET_CONFIGURED || !ADMIN_SECRET || !authHeader) return false;
  const tokenString = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token = tokenString.startsWith('Bearer ') ? tokenString.slice(7).trim() : tokenString.trim();

  if (!token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');

  const expectedSignature = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  if (signature !== expectedSignature) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (!data.expiresAt || new Date(data.expiresAt).getTime() < Date.now()) {
      return false;
    }
    return data.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Production Vercel Serverless Function: /api/admin
 * Handles Admin Authentication, Inquiry Review/Closure, and Daily Availability Overrides
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // CORS Configuration
  const origin = (Array.isArray(req.headers['origin']) ? req.headers['origin'][0] : req.headers['origin']) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!ADMIN_SECRET_CONFIGURED) {
    res.status(503).json({
      success: false,
      message: 'Administrative access is unavailable until a strong ADMIN_SECRET_KEY is configured.',
    });
    return;
  }

  // Determine requested action
  const action = (req.query?.action as string) || (typeof req.body === 'object' && req.body?.action) || '';

  // 1. ACTION: LOGIN (Public with password verification)
  if (action === 'login' && req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const password = body?.password?.trim();
    if (!password || password !== ADMIN_SECRET) {
      res.status(401).json({
        success: false,
        message: 'Invalid administrative password or secret key.',
      });
      return;
    }

    const { token, expiresAt } = createAdminToken();
    res.status(200).json({
      success: true,
      message: 'Administrative session established.',
      token,
      expiresAt,
    });
    return;
  }

  // Case-insensitive header lookup helper
  const getHeader = (name: string): string | string[] | undefined => {
    const lower = name.toLowerCase();
    for (const key of Object.keys(req.headers || {})) {
      if (key.toLowerCase() === lower) return req.headers[key];
    }
    return undefined;
  };

  // All subsequent actions require verified authorization
  const authHeader = getHeader('authorization') || getHeader('x-admin-token');
  if (!verifyAdminToken(authHeader)) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Valid administrative authentication token required.',
    });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

  // 2. ACTION: GET INQUIRIES
  if (action === 'inquiries' || (req.method === 'GET' && !action)) {
    let inquiries: any[] = [];

    // Query Supabase if active
    if (supabaseUrl && supabaseKey) {
      try {
        const queryRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/inquiries?order=timestamp.desc`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (queryRes.ok) {
          inquiries = await queryRes.json();
        }
      } catch (err) {
        console.warn('[DESTRUST10N Admin] Supabase query failed, falling back:', err);
      }
    }

    // Local / Serverless /tmp Fallback
    if (inquiries.length === 0) {
      try {
        const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
        const targetDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'server/data');
        const filePath = path.join(targetDir, 'inquiries.json');
        if (fs.existsSync(filePath)) {
          inquiries = JSON.parse(fs.readFileSync(filePath, 'utf-8')).reverse();
        }
      } catch {}
    }

    const availability = await resolveAvailability();
    res.status(200).json({
      success: true,
      inquiries,
      availability,
    });
    return;
  }

  // 3. ACTION: UPDATE INQUIRY STATUS (e.g. Mark Reviewed or Closed)
  if (action === 'update_status' && req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const { inquiryId, status } = body || {};
    if (!inquiryId || !['new', 'reviewed', 'closed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid inquiryId or status.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const dateKolkata = getKolkataDateString();

    const updatePayload: Record<string, any> = {
      status,
      ...(status === 'reviewed' ? { reviewed_at: nowIso } : {}),
      ...(status === 'closed' ? { closed_at: nowIso, closed_date_kolkata: dateKolkata } : {}),
    };

    // Update in Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/inquiries?id=eq.${inquiryId}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(updatePayload),
        });
      } catch (err) {
        console.warn('[DESTRUST10N Admin] Supabase update failed:', err);
      }
    }

    // Update in Local / tmp
    try {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const targetDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'server/data');
      const filePath = path.join(targetDir, 'inquiries.json');
      if (fs.existsSync(filePath)) {
        const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const index = list.findIndex((inq: any) => inq.id === inquiryId);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            status,
            ...(status === 'reviewed' ? { reviewedAt: nowIso } : {}),
            ...(status === 'closed' ? { closedAt: nowIso, closedDateKolkata: dateKolkata } : {}),
          };
          fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
        }
      }
    } catch {}

    const updatedAvailability = await resolveAvailability();
    res.status(200).json({
      success: true,
      message: `Inquiry ${inquiryId} updated to ${status}.`,
      status,
      availability: updatedAvailability,
    });
    return;
  }

  // 4. ACTION: OVERRIDE AVAILABILITY
  if (action === 'override_availability' && req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const { overrideMode, reason } = body || {};
    if (!['auto', 'force_available', 'force_unavailable'].includes(overrideMode)) {
      res.status(400).json({ success: false, message: 'Invalid overrideMode.' });
      return;
    }

    // Update Supabase availability_settings
    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/availability_settings?id=eq.current`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            override_mode: overrideMode,
            override_reason: reason || 'Set by studio owner',
            updated_at: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.warn('[DESTRUST10N Admin] Supabase settings update failed:', err);
      }
    }

    // Update Local Settings
    try {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const targetDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'server/data');
      const settingsFile = path.join(targetDir, 'availability_settings.json');
      fs.writeFileSync(
        settingsFile,
        JSON.stringify({ overrideMode, reason, updatedAt: new Date().toISOString() }, null, 2),
        'utf-8'
      );
    } catch {}

    const updatedAvailability = await resolveAvailability();
    res.status(200).json({
      success: true,
      message: `Availability mode set to ${overrideMode}.`,
      availability: updatedAvailability,
    });
    return;
  }

  // 5. ACTION: RETRY EMAIL NOTIFICATION (Safe retry mechanism, prevents duplicate alerts)
  if (action === 'retry_email' && req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const { inquiryId, force } = body || {};
    if (!inquiryId) {
      res.status(400).json({ success: false, message: 'inquiryId is required.' });
      return;
    }

    // Retrieve inquiry record
    let targetInquiry: any = null;
    if (supabaseUrl && supabaseKey) {
      try {
        const queryRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/inquiries?id=eq.${inquiryId}&select=*`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (queryRes.ok) {
          const list = await queryRes.json();
          if (Array.isArray(list) && list.length > 0) {
            targetInquiry = list[0];
          }
        }
      } catch (err) {
        console.warn('[DESTRUST10N Admin] Supabase fetch for retry failed:', err);
      }
    }

    if (!targetInquiry) {
      try {
        const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
        const targetDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'server/data');
        const filePath = path.join(targetDir, 'inquiries.json');
        if (fs.existsSync(filePath)) {
          const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          targetInquiry = list.find((i: any) => i.id === inquiryId);
        }
      } catch {}
    }

    if (!targetInquiry) {
      res.status(404).json({ success: false, message: `Inquiry ${inquiryId} not found.` });
      return;
    }

    // Duplicate alert protection: If already delivered successfully and not explicitly forced, reject resend
    if (targetInquiry.email_status === 'sent' && !force) {
      res.status(409).json({
        success: false,
        message: 'Notification email was already delivered successfully to destrust100n@gmail.com. Pass force=true to bypass.',
        emailStatus: 'sent',
        sentAt: targetInquiry.email_sent_at,
      });
      return;
    }

    const emailData: InquiryEmailData = {
      id: targetInquiry.id,
      timestamp: targetInquiry.timestamp,
      name: targetInquiry.name,
      email: targetInquiry.email,
      projectType: targetInquiry.project_type || targetInquiry.projectType,
      budget: targetInquiry.budget,
      description: targetInquiry.description,
    };

    const dispatchResult = await sendInquiryEmail(emailData);
    const nowIso = new Date().toISOString();
    const attempts = (targetInquiry.email_attempts || 0) + 1;

    const emailUpdates: Record<string, any> = {
      email_status: dispatchResult.success ? 'sent' : 'failed',
      email_error: dispatchResult.success ? null : (dispatchResult.error || 'Unknown delivery failure'),
      email_attempts: attempts,
      email_last_attempt_at: nowIso,
      ...(dispatchResult.success ? { email_sent_at: nowIso } : {}),
    };

    // Update in Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/inquiries?id=eq.${inquiryId}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailUpdates),
        });
      } catch (err) {
        console.warn('[DESTRUST10N Admin] Supabase update after retry failed:', err);
      }
    }

    // Update in Local / tmp
    try {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const targetDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'server/data');
      const filePath = path.join(targetDir, 'inquiries.json');
      if (fs.existsSync(filePath)) {
        const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const index = list.findIndex((inq: any) => inq.id === inquiryId);
        if (index !== -1) {
          list[index] = { ...list[index], ...emailUpdates };
          fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
        }
      }
    } catch {}

    if (dispatchResult.success) {
      res.status(200).json({
        success: true,
        message: `Notification email successfully dispatched to ${dispatchResult.recipient}.`,
        messageId: dispatchResult.messageId,
        emailStatus: 'sent',
      });
    } else {
      res.status(502).json({
        success: false,
        message: `Email delivery attempt failed: ${dispatchResult.error}`,
        diagnostic: dispatchResult.diagnostic,
        emailStatus: 'failed',
        attempts,
      });
    }
    return;
  }

  res.status(400).json({ success: false, message: 'Unrecognized action or method.' });
}
