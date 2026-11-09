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
    storageProviders: {
      supabase: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)),
      firestore: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY),
      resendMailer: Boolean(process.env.RESEND_API_KEY),
    },
  });
}
