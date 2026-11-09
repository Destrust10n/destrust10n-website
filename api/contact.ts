import type { ApiRequest, ApiResponse } from './types';
import { handleContactRequest } from '../server/contactHandler';

/**
 * Vercel Serverless Function: POST /api/contact
 * Handles contact form submissions with Zod validation, rate limiting,
 * anti-spam honeypot defense, and persistent storage.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  return handleContactRequest(req, res);
}
