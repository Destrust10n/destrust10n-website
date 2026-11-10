/**
 * DESTRUST10N — Studio Inquiry Email Notification Engine
 * Handles authenticated notification dispatch to destrust100n@gmail.com via Resend
 * with rich error diagnostics, flexible sender resolution, and zero credential leakage.
 */

export interface InquiryEmailData {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  description: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider: 'resend' | 'none';
  messageId?: string;
  error?: string;
  diagnostic?: string;
  recipient: string;
  sentAt?: string;
}

/**
 * Generates the responsive HTML email template for DESTRUST10N studio alerts
 */
export function buildInquiryEmailHtml(inquiry: InquiryEmailData): string {
  const formattedIst = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(inquiry.timestamp));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DESTRUST10N Studio Inquiry</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #050608; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F7FA;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #101318; border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.85);">

    <!-- Top Branding Bar -->
    <div style="padding: 24px 28px; background: linear-gradient(135deg, rgba(0,229,255,0.12) 0%, rgba(16,19,24,0.6) 100%); border-bottom: 1px solid rgba(0,229,255,0.2);">
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #00E5FF; text-transform: uppercase; margin-bottom: 6px;">
        DESTRUST10N // INQUIRY NOTIFICATION DISPATCH
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #F5F7FA; letter-spacing: -0.5px;">
        New Project Inquiry: <span style="color: #00E5FF;">${inquiry.projectType}</span>
      </h1>
      <p style="margin: 6px 0 0; font-size: 12px; color: #929AA5; font-family: monospace;">
        Reference: <strong style="color: #F5F7FA;">${inquiry.id}</strong> &bull; ${formattedIst} (IST)
      </p>
    </div>

    <!-- Inquiry Metadata Table -->
    <div style="padding: 28px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 10px 0; color: #929AA5; width: 130px; font-weight: 500;">Client / Lead:</td>
          <td style="padding: 10px 0; color: #F5F7FA; font-weight: 700; font-size: 15px;">${inquiry.name}</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 10px 0; color: #929AA5; font-weight: 500;">Client Email:</td>
          <td style="padding: 10px 0;">
            <a href="mailto:${inquiry.email}" style="color: #00E5FF; text-decoration: none; font-weight: 600; font-family: monospace;">
              ${inquiry.email}
            </a>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 10px 0; color: #929AA5; font-weight: 500;">Project Scope:</td>
          <td style="padding: 10px 0; color: #F5F7FA;">${inquiry.projectType}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #929AA5; font-weight: 500;">Target Budget:</td>
          <td style="padding: 10px 0; color: #00E5FF; font-weight: 700; font-family: monospace;">${inquiry.budget}</td>
        </tr>
      </table>

      <!-- Project Requirements Block -->
      <div style="background-color: rgba(0, 229, 255, 0.04); border-left: 3px solid #00E5FF; border-radius: 6px; padding: 18px; margin-bottom: 28px;">
        <div style="font-family: monospace; font-size: 11px; color: #00E5FF; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Project Requirements & Scope:
        </div>
        <div style="color: #F5F7FA; font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word;">
${inquiry.description}
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; padding-top: 8px;">
        <a href="mailto:${inquiry.email}?subject=Re:%20DESTRUST10N%20Project%20Inquiry%20[${inquiry.id}]"
           style="display: inline-block; background-color: #00E5FF; color: #050608; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 0 20px rgba(0,229,255,0.4);">
          Reply Directly to Client
        </a>
      </div>
    </div>

    <!-- Footer Note -->
    <div style="padding: 16px 28px; background-color: #050608; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 11px; font-family: monospace; color: #929AA5;">
      <span>DESTRUST10N Studio &bull; Automated Inquiry Protocol &bull; Sent to destrust100n@gmail.com</span>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Dispatches an email notification for a newly stored inquiry using Resend API.
 * Accurately parses response status codes, detects authorization and domain issues,
 * and guarantees zero secret leakage to clients.
 */
export async function sendInquiryEmail(inquiry: InquiryEmailData): Promise<EmailDispatchResult> {
  const recipient = (process.env.STUDIO_ALERT_EMAIL || 'destrust100n@gmail.com').trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // If no API key configured
  if (!resendApiKey) {
    const errorMsg = 'RESEND_API_KEY is not configured in environment variables.';
    const diagnostic = 'Configure RESEND_API_KEY in Vercel Project Settings -> Environment Variables.';
    console.warn(`[DESTRUST10N Mailer] Email dispatch skipped: ${errorMsg}`);
    return {
      success: false,
      provider: 'none',
      error: errorMsg,
      diagnostic,
      recipient,
    };
  }

  // Resolve sender address:
  // If user configured a verified custom sender in RESEND_FROM_EMAIL, use it.
  // Otherwise, fallback to Resend's default onboarding testing identity.
  const fromAddress = (process.env.RESEND_FROM_EMAIL || 'DESTRUST10N Studio <onboarding@resend.dev>').trim();

  try {
    const emailHtml = buildInquiryEmailHtml(inquiry);
    const subject = `[DESTRUST10N Inquiry] ${inquiry.name} — ${inquiry.projectType} (${inquiry.budget})`;

    console.log(`[DESTRUST10N Mailer] Attempting delivery via Resend API to: ${recipient} (From: ${fromAddress})`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipient],
        reply_to: inquiry.email,
        subject,
        html: emailHtml,
      }),
    });

    const responseText = await response.text();
    let responseJson: any = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    // 1. Success response (HTTP 200 or 201 with Resend ID)
    if (response.ok && responseJson?.id) {
      console.log(`[DESTRUST10N Mailer] Notification successfully accepted by Resend (Message ID: ${responseJson.id}) for ${recipient}.`);
      return {
        success: true,
        provider: 'resend',
        messageId: responseJson.id,
        recipient,
        sentAt: new Date().toISOString(),
      };
    }

    // 2. Specific Error Diagnoses based on HTTP status
    let parsedError = `Resend HTTP ${response.status}: ${responseJson?.message || responseText.slice(0, 200)}`;
    let diagnostic = '';

    if (response.status === 403) {
      diagnostic =
        'Resend Sandbox Policy Restriction: The default "onboarding@resend.dev" sender can only deliver to the email address registered on the Resend account. To send alerts to destrust100n@gmail.com, verify your custom domain (e.g. destrust10n.com) in Resend Dashboard -> Domains and set RESEND_FROM_EMAIL (e.g. inquiries@destrust10n.com), or ensure your Resend account email is destrust100n@gmail.com.';
      parsedError = `Resend 403: ${responseJson?.message || 'Forbidden - sender domain unverified or recipient mismatch.'}`;
    } else if (response.status === 401) {
      diagnostic = 'Resend Authentication Failure: The provided RESEND_API_KEY is invalid, revoked, or expired. Please generate a new API key in the Resend Dashboard.';
      parsedError = 'Resend 401: Unauthorized - Invalid API Key.';
    } else if (response.status === 422) {
      diagnostic = `Resend Validation Error: ${responseJson?.message || 'Invalid payload fields.'}`;
    }

    console.warn(`[DESTRUST10N Mailer] Email dispatch failed: ${parsedError}. Diagnostic: ${diagnostic}`);

    return {
      success: false,
      provider: 'resend',
      error: parsedError,
      diagnostic,
      recipient,
    };
  } catch (netErr: unknown) {
    const errMsg = netErr instanceof Error ? netErr.message : String(netErr);
    console.error(`[DESTRUST10N Mailer] Network exception contacting Resend API: ${errMsg}`);
    return {
      success: false,
      provider: 'resend',
      error: `Network error: ${errMsg}`,
      diagnostic: 'Failed to connect to https://api.resend.com. Check network connectivity or Vercel outbound policies.',
      recipient,
    };
  }
}
