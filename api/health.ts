import type { ApiRequest, ApiResponse } from './types';

/**
 * Vercel Serverless Function: GET /api/health
 * Public health check and storage status endpoint.
 */
export default function handler(req: ApiRequest, res: ApiResponse): void {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json({
    status: 'ok',
    brand: 'DESTRUST10N',
    tagline: 'Building Beyond Limits',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
    services: {
      supabasePostgreSQL: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)),
      upstashDistributedRateLimiter: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      resendMailer: {
        configured: Boolean(process.env.RESEND_API_KEY),
        fromSender: (process.env.RESEND_FROM_EMAIL || 'DESTRUST10N Studio <onboarding@resend.dev>').trim(),
        targetRecipient: (process.env.STUDIO_ALERT_EMAIL || 'destrust100n@gmail.com').trim(),
      },
    },
  });
}
