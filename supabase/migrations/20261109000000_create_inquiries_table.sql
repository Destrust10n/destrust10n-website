-- DESTRUST10N — Supabase PostgreSQL Production Migration
-- Table: public.inquiries
-- Secure persistent storage for client project inquiries

CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(100) NOT NULL,
  project_type VARCHAR(60) NOT NULL,
  budget VARCHAR(60),
  description VARCHAR(1500) NOT NULL,
  ip_hash VARCHAR(45),
  user_agent VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'new'
);

-- Index frequently filtered fields
CREATE INDEX IF NOT EXISTS idx_inquiries_timestamp ON public.inquiries (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service Role Full Access (Serverless functions use service-role key)
DROP POLICY IF EXISTS "Service Role Full Access" ON public.inquiries;
CREATE POLICY "Service Role Full Access" ON public.inquiries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Prevent all public read/select access (Zero data leakage to visitors)
-- (By not creating a SELECT policy for anon/authenticated roles, public visitors cannot read any records)

-- Policy 3: Allow anonymous insert via API if configured
DROP POLICY IF EXISTS "Anon Insert Only" ON public.inquiries;
CREATE POLICY "Anon Insert Only" ON public.inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);
