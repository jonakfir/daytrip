-- 002_trip_jobs.sql
-- Persisted trip-generation jobs. Enables the client-driven step flow
-- where a single generation is split across many short Vercel calls
-- (each <30s) and resumes after any single-step failure.

CREATE TABLE IF NOT EXISTS trip_jobs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_token     text,                                   -- fallback key for anon users
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','running','complete','failed')),
  request_json   jsonb NOT NULL,                          -- original GenerateRequest
  share_id       text UNIQUE,                              -- set when final itinerary is stored
  total_steps    int NOT NULL DEFAULT 0,
  current_step   int NOT NULL DEFAULT 0,
  step_label     text,                                    -- human-readable current step
  error          text,                                    -- last terminal error, if any

  -- Partial results accumulated across steps:
  hero_image         text,
  city_plan          jsonb,                               -- [{ city, country, startDay, endDay }]
  day_chunks         jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{ chunkIndex, days: DayPlan[] }]
  booking            jsonb,                               -- { hotels, flights, tours, tips }
  flights_real       jsonb,                               -- picked flights from SerpAPI/etc
  final_itinerary    jsonb,

  -- Step-level telemetry so the UI can show a live ledger:
  steps              jsonb NOT NULL DEFAULT '[]'::jsonb,
                     -- [{ index, key, label, status, startedAt, finishedAt, attempts, error }]

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_jobs_user_id_idx    ON trip_jobs(user_id);
CREATE INDEX IF NOT EXISTS trip_jobs_anon_token_idx ON trip_jobs(anon_token);
CREATE INDEX IF NOT EXISTS trip_jobs_status_idx     ON trip_jobs(status);
CREATE INDEX IF NOT EXISTS trip_jobs_created_at_idx ON trip_jobs(created_at DESC);

-- Keep updated_at current on every write
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trip_jobs_updated_at ON trip_jobs;
CREATE TRIGGER trg_trip_jobs_updated_at
BEFORE UPDATE ON trip_jobs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: owners + anon-token holders can read their own jobs. Writes go
-- through the service role (server-side API routes only).
ALTER TABLE trip_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_jobs_owner_select"
  ON trip_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Anon-token access is validated server-side; no direct client read of
-- anon-owned rows. Service role bypasses RLS for step/status endpoints.
