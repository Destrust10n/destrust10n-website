import type { ApiRequest, ApiResponse } from './types';
import fs from 'fs';
import path from 'path';

export interface AvailabilityState {
  available: boolean;
  statusText: string;
  supportingText: string;
  dateKolkata: string;
  timezone: string;
  closedCountToday: number;
  overrideMode: 'auto' | 'force_available' | 'force_unavailable';
  lastUpdated?: string;
}

/**
 * Returns YYYY-MM-DD formatted date in Asia/Kolkata (IST: UTC+5:30)
 */
export function getKolkataDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Resolves availability status based on Supabase PostgreSQL data or local fallback.
 * Accepts optional currentDateKolkata for testing date rollovers (defaults to current date in Asia/Kolkata).
 */
export async function resolveAvailability(currentDateKolkata?: string): Promise<AvailabilityState> {
  const dateKolkata = currentDateKolkata || getKolkataDateString();
  let overrideMode: 'auto' | 'force_available' | 'force_unavailable' = 'auto';
  let closedCountToday = 0;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

  // 1. Query Supabase PostgreSQL if available
  if (supabaseUrl && supabaseKey) {
    try {
      // Check availability_settings for manual override
      const settingsRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/availability_settings?id=eq.current&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings && settings[0]?.override_mode) {
          overrideMode = settings[0].override_mode;
        }
      }

      // If in auto mode, check count of inquiries closed today in Asia/Kolkata
      if (overrideMode === 'auto') {
        const closedRes = await fetch(
          `${supabaseUrl.replace(/\/$/, '')}/rest/v1/inquiries?status=eq.closed&closed_date_kolkata=eq.${dateKolkata}&select=id`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              Prefer: 'count=exact',
            },
          }
        );

        if (closedRes.ok) {
          const contentRange = closedRes.headers.get('content-range');
          if (contentRange) {
            const total = contentRange.split('/')[1];
            closedCountToday = total ? parseInt(total, 10) : 0;
          } else {
            const list = await closedRes.json();
            closedCountToday = Array.isArray(list) ? list.length : 0;
          }
        }
      }
    } catch (dbErr) {
      console.warn('[DESTRUST10N Availability] Supabase check error, falling back to local storage:', dbErr);
    }
  }

  // 2. Fallback to Local Storage / Serverless /tmp if Supabase was not used or failed
  if (!supabaseUrl || !supabaseKey) {
    try {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const targetDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'server/data');

      // Check local settings file
      const settingsFile = path.join(targetDir, 'availability_settings.json');
      if (fs.existsSync(settingsFile)) {
        try {
          const raw = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
          if (raw.overrideMode) overrideMode = raw.overrideMode;
        } catch {}
      }

      // Check local inquiries file
      const inquiriesFile = path.join(targetDir, 'inquiries.json');
      if (fs.existsSync(inquiriesFile)) {
        try {
          const raw = JSON.parse(fs.readFileSync(inquiriesFile, 'utf-8'));
          if (Array.isArray(raw)) {
            closedCountToday = raw.filter(
              (inq: any) => inq.status === 'closed' && inq.closedDateKolkata === dateKolkata
            ).length;
          }
        } catch {}
      }
    } catch (fsErr) {
      console.warn('[DESTRUST10N Availability] Local storage read error:', fsErr);
    }
  }

  // 3. Apply Availability Rules
  let available = true;
  let statusText = 'Available for Work';
  let supportingText = 'Currently accepting one project today.';

  if (overrideMode === 'force_unavailable') {
    available = false;
    statusText = 'Currently Unavailable';
    supportingText = "Today's project availability has been filled. Check back tomorrow.";
  } else if (overrideMode === 'force_available') {
    available = true;
    statusText = 'Available for Work';
    supportingText = 'Currently accepting one project today.';
  } else {
    // Mode: Auto (One Day, One Work: max 1 closed project per calendar day in Asia/Kolkata)
    if (closedCountToday >= 1) {
      available = false;
      statusText = 'Currently Unavailable';
      supportingText = "Today's project availability has been filled. Check back tomorrow.";
    } else {
      available = true;
      statusText = 'Available for Work';
      supportingText = 'Currently accepting one project today.';
    }
  }

  return {
    available,
    statusText,
    supportingText,
    dateKolkata,
    timezone: 'Asia/Kolkata',
    closedCountToday,
    overrideMode,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Public Vercel Serverless Function: GET /api/availability
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  try {
    const data = await resolveAvailability();
    res.status(200).json(data);
  } catch (error) {
    console.error('[DESTRUST10N API] Error fetching availability:', error);
    res.status(500).json({
      available: true,
      statusText: 'Available for Work',
      supportingText: 'Currently accepting one project today.',
      dateKolkata: getKolkataDateString(),
      timezone: 'Asia/Kolkata',
      closedCountToday: 0,
      overrideMode: 'auto',
    });
  }
}
