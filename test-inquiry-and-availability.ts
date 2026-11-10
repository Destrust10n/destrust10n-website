import contactHandler from './api/contact';
import availabilityHandler, { getKolkataDateString, resolveAvailability } from './api/availability';
import adminHandler from './api/admin';
import { buildInquiryEmailHtml, sendInquiryEmail } from './api/mailer';
import fs from 'fs';
import path from 'path';

// Mock helper to create synthetic ApiRequest and ApiResponse
function createMockHttp(method: string, body: any = {}, headers: Record<string, string> = {}, query: Record<string, string> = {}) {
  let statusCode = 200;
  let responseData: any = null;
  const resHeaders: Record<string, any> = {};

  const req = {
    method,
    body,
    headers: {
      'x-real-ip': '127.0.0.1',
      'user-agent': 'DESTRUST10N-TestRunner/1.0',
      ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
    },
    query,
  };

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
    send(data: any) {
      responseData = data;
      return this;
    },
    setHeader(key: string, val: any) {
      resHeaders[key] = val;
      return this;
    },
    end() {
      return this;
    },
  };

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getResponse: () => responseData,
    getHeaders: () => resHeaders,
  };
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 DESTRUST10N: INQUIRY FLOW & "ONE DAY, ONE WORK" TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      if (details) console.error(`     Details: ${details}`);
      failed++;
    }
  }

  // Clean local test data files before starting
  const testDataDir = path.resolve(process.cwd(), 'server/data');
  if (fs.existsSync(testDataDir)) {
    try {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch {}
  }

  // -----------------------------------------------------------------
  // 1. Initial Availability Check
  // -----------------------------------------------------------------
  console.log('--- TEST GROUP 1: Initial Public Availability ---');
  {
    const mock = createMockHttp('GET');
    await availabilityHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('GET /api/availability returns HTTP 200', mock.getStatusCode() === 200);
    assert('Initial availability is TRUE', body.available === true);
    assert('Initial status text is "Available for Work"', body.statusText === 'Available for Work');
    assert('Initial closed count today is 0', body.closedCountToday === 0);
    assert('Timezone is "Asia/Kolkata"', body.timezone === 'Asia/Kolkata');
    assert('dateKolkata format is YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(body.dateKolkata));
  }

  // -----------------------------------------------------------------
  // 2. Contact Form Submissions & Validations
  // -----------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Contact Form Submissions & Spam Protection ---');
  let firstInquiryId = '';

  // 2.1 Valid Inquiry
  {
    const mock = createMockHttp('POST', {
      name: 'Elena Rostova',
      email: 'elena.rostova@techstudio.io',
      projectType: 'Business Websites',
      budget: '$25 (Business Website)',
      description: 'We need a spatial high-performance landing page for our next-generation digital studio.',
    });

    await contactHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Valid inquiry returns HTTP 200', mock.getStatusCode() === 200);
    assert('Response success flag is true', body?.success === true);
    assert('Valid inquiryId format returned', /^D10-INQ-/.test(body?.inquiryId));
    firstInquiryId = body?.inquiryId;
  }

  // 2.2 Duplicate Submission Rejection
  {
    const mock = createMockHttp('POST', {
      name: 'Elena Rostova',
      email: 'elena.rostova@techstudio.io',
      projectType: 'Business Websites',
      budget: '$25 (Business Website)',
      description: 'We need a spatial high-performance landing page for our next-generation digital studio.',
    });

    await contactHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Duplicate submission within 5min returns HTTP 409', mock.getStatusCode() === 409);
    assert('Rejection message mentions duplicate detection', body?.message?.includes('Duplicate inquiry detected'));
  }

  // 2.3 Anti-Spam Honeypot Trap
  {
    const mock = createMockHttp('POST', {
      name: 'Bot Spammer',
      email: 'bot@spam.com',
      projectType: 'Website Development',
      description: 'Cheap SEO backlinks service for your brand.',
      website: 'https://spam-bot-trap.com', // Honeypot filled by bot
    });

    await contactHandler(mock.req as any, mock.res as any);
    assert('Honeypot trigger returns HTTP 400', mock.getStatusCode() === 400);
  }

  // 2.4 Invalid Email
  {
    const mock = createMockHttp('POST', {
      name: 'Invalid Email User',
      email: 'not-an-email',
      projectType: 'Website Development',
      description: 'Valid description text with more than 15 characters.',
    });

    await contactHandler(mock.req as any, mock.res as any);
    assert('Invalid email returns HTTP 400', mock.getStatusCode() === 400);
  }

  // 2.5 Too Short Description
  {
    const mock = createMockHttp('POST', {
      name: 'Short Scope User',
      email: 'valid@example.com',
      projectType: 'Website Development',
      description: 'Short', // Less than 15 characters
    });

    await contactHandler(mock.req as any, mock.res as any);
    assert('Too short description returns HTTP 400', mock.getStatusCode() === 400);
  }

  // -----------------------------------------------------------------
  // 3. Admin Authentication & Inquiry Review
  // -----------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Admin Authentication & Review Workflow ---');
  let adminToken = '';

  // 3.1 Bad Password
  {
    const mock = createMockHttp('POST', { password: 'wrong_password_123' }, {}, { action: 'login' });
    await adminHandler(mock.req as any, mock.res as any);
    assert('Bad admin password returns HTTP 401', mock.getStatusCode() === 401);
  }

  // 3.2 Correct Password
  {
    const adminSecret = process.env.ADMIN_SECRET_KEY || 'destrust10n_studio_secret_2026';
    const mock = createMockHttp('POST', { password: adminSecret }, {}, { action: 'login' });
    await adminHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Correct admin password returns HTTP 200', mock.getStatusCode() === 200);
    assert('Signed cryptographic token returned', typeof body?.token === 'string' && body.token.includes('.'));
    adminToken = body?.token;
  }

  // 3.3 Access Inquiries Without Token
  {
    const mock = createMockHttp('GET', {}, {}, { action: 'inquiries' });
    await adminHandler(mock.req as any, mock.res as any);
    assert('Inquiries access without token returns HTTP 401', mock.getStatusCode() === 401);
  }

  // 3.4 Access Inquiries With Valid Token
  {
    const mock = createMockHttp('GET', {}, { Authorization: `Bearer ${adminToken}` }, { action: 'inquiries' });
    await adminHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Inquiries access with token returns HTTP 200', mock.getStatusCode() === 200);
    assert('Inquiries array contains saved inquiry', Array.isArray(body?.inquiries) && body.inquiries.length >= 1);
    assert('Saved inquiry has status "new"', body?.inquiries?.some((i: any) => i.id === firstInquiryId && i.status === 'new'));
  }

  // 3.5 Mark Inquiry as 'reviewed'
  {
    const mock = createMockHttp(
      'POST',
      { inquiryId: firstInquiryId, status: 'reviewed' },
      { Authorization: `Bearer ${adminToken}` },
      { action: 'update_status' }
    );
    await adminHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Mark inquiry reviewed returns HTTP 200', mock.getStatusCode() === 200);
    assert('Inquiry status updated to "reviewed"', body?.status === 'reviewed');
    assert('Public availability is still Available after review', body?.availability?.available === true);
  }

  // -----------------------------------------------------------------
  // 4. "ONE DAY, ONE WORK" System: Mark Closed & Availability Trigger
  // -----------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: "ONE DAY, ONE WORK" System Behavior ---');

  // 4.1 Mark Inquiry as 'closed' (Today's project accepted)
  {
    const mock = createMockHttp(
      'POST',
      { inquiryId: firstInquiryId, status: 'closed' },
      { Authorization: `Bearer ${adminToken}` },
      { action: 'update_status' }
    );
    await adminHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Mark inquiry closed returns HTTP 200', mock.getStatusCode() === 200);
    assert('Inquiry status updated to "closed"', body?.status === 'closed');
    assert('Availability automatically flipped to UNAVAILABLE (available === false)', body?.availability?.available === false);
    assert('Availability status text is "Currently Unavailable"', body?.availability?.statusText === 'Currently Unavailable');
    assert('Today closed count is 1', body?.availability?.closedCountToday === 1);
  }

  // 4.2 Verify Public GET /api/availability reflects the closed project
  {
    const mock = createMockHttp('GET');
    await availabilityHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Public GET /api/availability confirms studio is Currently Unavailable', body.available === false);
    assert('Supporting text indicates slot filled', body.supportingText.includes("Today's project availability has been filled"));
  }

  // 4.3 Manual Overrides
  console.log('\n--- TEST GROUP 5: Manual Availability Overrides ---');

  // Force Available
  {
    const mock = createMockHttp(
      'POST',
      { overrideMode: 'force_available' },
      { Authorization: `Bearer ${adminToken}` },
      { action: 'override_availability' }
    );
    await adminHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Force Available override returns HTTP 200', mock.getStatusCode() === 200);
    assert('Force Available makes studio AVAILABLE again', body?.availability?.available === true);
    assert('Override mode is force_available', body?.availability?.overrideMode === 'force_available');
  }

  // Force Unavailable
  {
    const mock = createMockHttp(
      'POST',
      { overrideMode: 'force_unavailable' },
      { Authorization: `Bearer ${adminToken}` },
      { action: 'override_availability' }
    );
    await adminHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Force Unavailable override returns HTTP 200', mock.getStatusCode() === 200);
    assert('Force Unavailable makes studio UNAVAILABLE', body?.availability?.available === false);
  }

  // Return to Auto
  {
    const mock = createMockHttp(
      'POST',
      { overrideMode: 'auto' },
      { Authorization: `Bearer ${adminToken}` },
      { action: 'override_availability' }
    );
    await adminHandler(mock.req as any, mock.res as any);
    const body = mock.getResponse();

    assert('Auto mode reset returns HTTP 200', mock.getStatusCode() === 200);
    assert('Auto mode restores UNAVAILABLE because 1 inquiry is closed today', body?.availability?.available === false);
    assert('Override mode is auto', body?.availability?.overrideMode === 'auto');
  }

  // -----------------------------------------------------------------
  // 5. Asia/Kolkata Calendar Day Rollover Verification
  // -----------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Asia/Kolkata Midnight Rollover Simulation ---');
  {
    // Simulate tomorrow's date in Asia/Kolkata (where no project has been accepted yet)
    // Closed inquiries from previous days should not count towards tomorrow's slot.
    const tomorrowKolkata = '2099-01-01';
    const nextDayAvailability = await resolveAvailability(tomorrowKolkata);

    assert(
      'Next calendar day in Asia/Kolkata automatically resets availability to TRUE',
      nextDayAvailability.available === true
    );
    assert(
      'Closed count for today in Asia/Kolkata resets to 0',
      nextDayAvailability.closedCountToday === 0
    );
    assert(
      'Status text resets to "Available for Work"',
      nextDayAvailability.statusText === 'Available for Work'
    );
  }

  // -----------------------------------------------------------------
  // 6. Email System, Notification Content & Safe Retry Mechanism
  // -----------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Email Delivery Flow, Diagnostics & Safe Retries ---');
  {
    // 7.1 Verify Email HTML Template Content
    const sampleInquiry = {
      id: 'D10-INQ-TEST-999',
      timestamp: new Date().toISOString(),
      name: 'Alexander Vance',
      email: 'alex@vance.io',
      projectType: 'Website Redesign',
      budget: '$50 (Premium Starter Build)',
      description: 'Full redesign with high-performance WebGL aesthetics and zero template code.',
    };

    const html = buildInquiryEmailHtml(sampleInquiry);
    assert('Email HTML contains client name', html.includes('Alexander Vance'));
    assert('Email HTML contains client email', html.includes('alex@vance.io'));
    assert('Email HTML contains project type', html.includes('Website Redesign'));
    assert('Email HTML contains budget selection', html.includes('$50 (Premium Starter Build)'));
    assert('Email HTML contains project requirements', html.includes('Full redesign with high-performance WebGL aesthetics'));
    assert('Email HTML contains unique inquiry ID', html.includes('D10-INQ-TEST-999'));
    assert('Email HTML includes direct mailto link to client', html.includes('mailto:alex@vance.io'));

    // 7.2 sendInquiryEmail diagnostic when API key is missing
    delete process.env.RESEND_API_KEY;
    const dispatchResult = await sendInquiryEmail(sampleInquiry);
    assert('Email dispatch fails gracefully without API key (zero 500 crashes)', dispatchResult.success === false);
    assert('Diagnostic guides user to configure RESEND_API_KEY', dispatchResult.diagnostic?.includes('Configure RESEND_API_KEY') === true);
    assert('Recipient defaults to destrust100n@gmail.com', dispatchResult.recipient === 'destrust100n@gmail.com');

    // 7.3 Retry Email Endpoint Authorization Check
    const unauthMock = createMockHttp('POST', { inquiryId: 'D10-INQ-TEST-999' }, {}, { action: 'retry_email' });
    await adminHandler(unauthMock.req as any, unauthMock.res as any);
    assert('retry_email requires administrative authentication (HTTP 401)', unauthMock.getStatusCode() === 401);

    // 7.4 Retry Email Missing inquiryId
    const missingIdMock = createMockHttp('POST', {}, { Authorization: `Bearer ${adminToken}` }, { action: 'retry_email' });
    await adminHandler(missingIdMock.req as any, missingIdMock.res as any);
    assert('retry_email rejects missing inquiryId (HTTP 400)', missingIdMock.getStatusCode() === 400);

    // 7.5 Retry Email Non-existent inquiryId
    const notFoundMock = createMockHttp('POST', { inquiryId: 'D10-INQ-DOESNT-EXIST' }, { Authorization: `Bearer ${adminToken}` }, { action: 'retry_email' });
    await adminHandler(notFoundMock.req as any, notFoundMock.res as any);
    assert('retry_email returns HTTP 404 for unknown inquiry', notFoundMock.getStatusCode() === 404);

    // 7.6 Retry Email for Existing Inquiry
    // Use firstInquiryId created in TEST GROUP 2
    const retryMock = createMockHttp('POST', { inquiryId: firstInquiryId }, { Authorization: `Bearer ${adminToken}` }, { action: 'retry_email' });
    await adminHandler(retryMock.req as any, retryMock.res as any);
    const retryRes = retryMock.getResponse();
    // Since RESEND_API_KEY is not configured locally, it should return 502 with diagnostic details without losing the inquiry
    assert('retry_email records failure and attempts count without losing inquiry', retryMock.getStatusCode() === 502 && retryRes.attempts >= 1);
    assert('retry_email provides actionable diagnostic guidance', retryRes.diagnostic?.includes('RESEND_API_KEY') === true);

    // 7.7 Verify inquiry still exists safely in storage
    const fetchMock = createMockHttp('GET', {}, { Authorization: `Bearer ${adminToken}` }, { action: 'inquiries' });
    await adminHandler(fetchMock.req as any, fetchMock.res as any);
    const inquiriesList = fetchMock.getResponse()?.inquiries;
    const targetInq = inquiriesList?.find((i: any) => i.id === firstInquiryId);
    assert('Inquiry is securely preserved in storage after failed email attempt', Boolean(targetInq));
    assert('Inquiry records email_status as failed/pending', targetInq?.email_status === 'failed' || targetInq?.emailStatus === 'failed');
    assert('Inquiry records email attempts count', (targetInq?.email_attempts || targetInq?.emailAttempts) >= 1);
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
