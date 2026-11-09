import fs from 'fs';
import path from 'path';

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

export interface PersistenceResult {
  stored: boolean;
  provider: 'supabase' | 'firestore' | 'filesystem' | 'serverless_tmp' | 'audit_log';
  emailDispatched: boolean;
  inquiryId: string;
  details?: string;
}

/**
 * Persists an inquiry across available providers:
 * 1. Supabase (PostgreSQL) if SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY are set
 * 2. Firebase Firestore if FIREBASE_PROJECT_ID is set
 * 3. File system persistence (local server/data or serverless /tmp)
 * 4. Email notification via Resend to destrust100n@gmail.com if RESEND_API_KEY is set
 */
export async function persistInquiry(record: StoredInquiry): Promise<PersistenceResult> {
  let stored = false;
  let provider: PersistenceResult['provider'] = 'audit_log';
  let emailDispatched = false;

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

  // 2. Check Firebase Firestore Integration (if Supabase is not active/failed)
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

  // 3. Fallback Storage (Local File System or Serverless /tmp)
  // Always attempted so local dev has full inspection and serverless instances cache data
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
      // Fallback: structured console audit log (Indexed in Vercel Runtime Logs)
      stored = true;
      provider = 'audit_log';
    }
  }

  // Permanent structured audit logging (available in Vercel logs)
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

  // 4. Email Notification Relay (Resend)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const alertRecipient = process.env.STUDIO_ALERT_EMAIL || 'destrust100n@gmail.com';

  if (resendApiKey) {
    try {
      const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050608; color: #F5F7FA; padding: 32px 16px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #101318; border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 12px; padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
    <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
      <span style="font-family: monospace; font-size: 11px; color: #00E5FF; text-transform: uppercase; letter-spacing: 1px;">DESTRUST10N // NEW INQUIRY</span>
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
      <p style="margin: 0 0 8px; color: #929AA5; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Project Requirements:</p>
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
</html>
      `;

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
        emailDispatched = true;
        console.log(`[DESTRUST10N Mailer] Notification email dispatched to ${alertRecipient} via Resend.`);
      } else {
        const emailErr = await emailResponse.text();
        console.warn(`[DESTRUST10N Mailer] Resend returned HTTP ${emailResponse.status}: ${emailErr}`);
      }
    } catch (mailError) {
      console.error('[DESTRUST10N Mailer] Email dispatch failed, but inquiry is safely stored:', mailError);
    }
  }

  return {
    stored,
    provider,
    emailDispatched,
    inquiryId: record.id,
  };
}
