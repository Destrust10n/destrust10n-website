-- DESTRUST10N — Supabase PostgreSQL Production Migration
-- Tables: public.inquiries & public.availability_settings
-- System: Inquiry Management & "One Day, One Work" Availability

-- 1. Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(100) NOT NULL,
  project_type VARCHAR(60) NOT NULL,
  budget VARCHAR(60),
  description VARCHAR(1500) NOT NULL,
  ip_hash VARCHAR(45),
  user_agent VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'new', -- 'new' | 'reviewed' | 'closed'
  reviewed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_date_kolkata VARCHAR(10), -- Format 'YYYY-MM-DD' calculated in Asia/Kolkata
  -- Delivery tracking fields
  email_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'sent' | 'failed' | 'skipped' | 'pending'
  email_error TEXT,
  email_sent_at TIMESTAMPTZ,
  email_attempts INT NOT NULL DEFAULT 0,
  email_recipient VARCHAR(100) DEFAULT 'destrust100n@gmail.com',
  email_last_attempt_at TIMESTAMPTZ
);

-- Backward-compatible column additions (if table already exists in Supabase)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'email_status') THEN
    ALTER TABLE public.inquiries ADD COLUMN email_status VARCHAR(20) NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'email_error') THEN
    ALTER TABLE public.inquiries ADD COLUMN email_error TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'email_sent_at') THEN
    ALTER TABLE public.inquiries ADD COLUMN email_sent_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'email_attempts') THEN
    ALTER TABLE public.inquiries ADD COLUMN email_attempts INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'email_recipient') THEN
    ALTER TABLE public.inquiries ADD COLUMN email_recipient VARCHAR(100) DEFAULT 'destrust100n@gmail.com';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'email_last_attempt_at') THEN
    ALTER TABLE public.inquiries ADD COLUMN email_last_attempt_at TIMESTAMPTZ;
  END IF;
END $$;

-- Index frequently filtered fields
CREATE INDEX IF NOT EXISTS idx_inquiries_timestamp ON public.inquiries (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_closed_date ON public.inquiries (closed_date_kolkata);
CREATE INDEX IF NOT EXISTS idx_inquiries_email_status ON public.inquiries (email_status);

-- Enable Row Level Security (RLS) on inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service Role Full Access (Serverless functions use service-role key)
DROP POLICY IF EXISTS "Service Role Full Access" ON public.inquiries;
CREATE POLICY "Service Role Full Access" ON public.inquiries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Allow anonymous insert via API if configured
DROP POLICY IF EXISTS "Anon Insert Only" ON public.inquiries;
CREATE POLICY "Anon Insert Only" ON public.inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- (Notice: No public SELECT policy exists on public.inquiries, ensuring public visitors cannot read inquiries)


-- 2. Availability Settings Table (Manual overrides & state)
CREATE TABLE IF NOT EXISTS public.availability_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  override_mode VARCHAR(20) NOT NULL DEFAULT 'auto', -- 'auto' | 'force_available' | 'force_unavailable'
  override_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO public.availability_settings (id, override_mode, updated_at)
VALUES ('current', 'auto', NOW())
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on availability_settings
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to availability settings so client can check availability
DROP POLICY IF EXISTS "Public Read Availability" ON public.availability_settings;
CREATE POLICY "Public Read Availability" ON public.availability_settings
  FOR SELECT
  TO public
  USING (true);

-- Service role full access for updates
DROP POLICY IF EXISTS "Service Role Settings Access" ON public.availability_settings;
CREATE POLICY "Service Role Settings Access" ON public.availability_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
