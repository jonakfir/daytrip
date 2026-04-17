/**
 * Persistence layer for trip_jobs.
 *
 * Production Daytrip runs on Vercel Postgres (Neon) — same pattern as
 * db.ts. Schema is auto-created lazily on first write so no manual
 * migration is ever needed. Tests swap in an in-memory repo via
 * setRepoBackend().
 */

import { sql } from "@vercel/postgres";
import type {
  TripJob,
  StepRecord,
  CityPlanEntry,
  DayChunkRecord,
} from "@/lib/trip-job";
import type { GenerateRequest, Flight, Hotel, ViatorTour } from "@/types/itinerary";

// ── Backend abstraction ─────────────────────────────────────────────

export interface TripJobRepo {
  create(job: Omit<TripJob, "createdAt" | "updatedAt">): Promise<TripJob>;
  get(id: string): Promise<TripJob | null>;
  update(id: string, patch: Partial<TripJob>): Promise<TripJob>;
}

let activeRepo: TripJobRepo | null = null;

export function setRepoBackend(repo: TripJobRepo | null): void {
  activeRepo = repo;
}

export function getRepo(): TripJobRepo {
  if (activeRepo) return activeRepo;
  return postgresRepo;
}

// ── In-memory repo (tests) ──────────────────────────────────────────

export function createInMemoryRepo(): TripJobRepo {
  const store = new Map<string, TripJob>();
  return {
    async create(job) {
      const now = new Date().toISOString();
      const full: TripJob = { ...job, createdAt: now, updatedAt: now };
      store.set(job.id, full);
      return full;
    },
    async get(id) {
      return store.get(id) ?? null;
    },
    async update(id, patch) {
      const existing = store.get(id);
      if (!existing) throw new Error(`Job not found: ${id}`);
      const merged: TripJob = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      store.set(id, merged);
      return merged;
    },
  };
}

// ── Vercel Postgres repo ────────────────────────────────────────────

interface Row {
  id: string;
  user_id: string | null;
  anon_token: string | null;
  status: TripJob["status"];
  request_json: GenerateRequest;
  share_id: string | null;
  total_steps: number;
  current_step: number;
  step_label: string | null;
  error: string | null;
  hero_image: string | null;
  city_plan: CityPlanEntry[] | null;
  day_chunks: DayChunkRecord[];
  booking: {
    hotels: Hotel[];
    flights: Flight[];
    tours: ViatorTour[];
    tips: string[];
  } | null;
  flights_real: Flight[] | null;
  final_itinerary: unknown | null;
  steps: StepRecord[];
  created_at: string;
  updated_at: string;
}

function rowToJob(r: Row): TripJob {
  return {
    id: r.id,
    userId: r.user_id,
    anonToken: r.anon_token,
    status: r.status,
    request: r.request_json,
    shareId: r.share_id,
    totalSteps: r.total_steps,
    currentStep: r.current_step,
    stepLabel: r.step_label,
    error: r.error,
    heroImage: r.hero_image,
    cityPlan: r.city_plan,
    dayChunks: r.day_chunks ?? [],
    booking: r.booking,
    flightsReal: r.flights_real,
    finalItinerary: r.final_itinerary,
    steps: r.steps ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

let schemaEnsured = false;

function isDbConfigured(): boolean {
  return !!(
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL
  );
}

async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return;
  if (!isDbConfigured()) {
    throw new Error(
      "Vercel Postgres not configured. Set POSTGRES_URL / DATABASE_URL."
    );
  }

  await sql`
    CREATE TABLE IF NOT EXISTS trip_jobs (
      id uuid PRIMARY KEY,
      user_id uuid,
      anon_token text,
      status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','running','complete','failed')),
      request_json jsonb NOT NULL,
      share_id text UNIQUE,
      total_steps int NOT NULL DEFAULT 0,
      current_step int NOT NULL DEFAULT 0,
      step_label text,
      error text,
      hero_image text,
      city_plan jsonb,
      day_chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
      booking jsonb,
      flights_real jsonb,
      final_itinerary jsonb,
      steps jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS trip_jobs_user_id_idx    ON trip_jobs(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS trip_jobs_anon_token_idx ON trip_jobs(anon_token);`;
  await sql`CREATE INDEX IF NOT EXISTS trip_jobs_status_idx     ON trip_jobs(status);`;
  await sql`CREATE INDEX IF NOT EXISTS trip_jobs_created_at_idx ON trip_jobs(created_at DESC);`;

  schemaEnsured = true;
}

/**
 * For completeness in auto-migration: the /api/generate shim and the
 * new /api/trip/step route both write to a legacy `itineraries` table
 * when a job finishes. Make sure it exists.
 */
export async function ensureItinerariesTable(): Promise<void> {
  if (!isDbConfigured()) return;
  await sql`
    CREATE TABLE IF NOT EXISTS itineraries (
      id uuid PRIMARY KEY,
      share_id text UNIQUE NOT NULL,
      destination text NOT NULL,
      start_date date NOT NULL,
      end_date date NOT NULL,
      travelers int NOT NULL,
      travel_style text,
      budget text,
      itinerary_data jsonb NOT NULL,
      view_count int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS itineraries_share_id_idx ON itineraries(share_id);`;
}

export const postgresRepo: TripJobRepo = {
  async create(job) {
    await ensureSchema();
    const result = await sql`
      INSERT INTO trip_jobs (
        id, user_id, anon_token, status, request_json, share_id,
        total_steps, current_step, step_label, error,
        hero_image, city_plan, day_chunks, booking, flights_real,
        final_itinerary, steps
      ) VALUES (
        ${job.id},
        ${job.userId},
        ${job.anonToken},
        ${job.status},
        ${JSON.stringify(job.request)}::jsonb,
        ${job.shareId},
        ${job.totalSteps},
        ${job.currentStep},
        ${job.stepLabel},
        ${job.error},
        ${job.heroImage},
        ${job.cityPlan ? JSON.stringify(job.cityPlan) : null}::jsonb,
        ${JSON.stringify(job.dayChunks ?? [])}::jsonb,
        ${job.booking ? JSON.stringify(job.booking) : null}::jsonb,
        ${job.flightsReal ? JSON.stringify(job.flightsReal) : null}::jsonb,
        ${job.finalItinerary ? JSON.stringify(job.finalItinerary) : null}::jsonb,
        ${JSON.stringify(job.steps ?? [])}::jsonb
      )
      RETURNING *;
    `;
    return rowToJob(result.rows[0] as Row);
  },

  async get(id) {
    await ensureSchema();
    const result = await sql`SELECT * FROM trip_jobs WHERE id = ${id}::uuid;`;
    if (result.rows.length === 0) return null;
    return rowToJob(result.rows[0] as Row);
  },

  async update(id, patch) {
    await ensureSchema();
    // Fetch-merge-write. We could write a fancier partial-update SQL
    // but this is correct, clearable-to-null, and one row per request.
    // Contention is low (each job is driven by a single client).
    const existing = await this.get(id);
    if (!existing) throw new Error(`Job not found: ${id}`);
    const merged: TripJob = { ...existing, ...patch };

    const result = await sql`
      UPDATE trip_jobs SET
        status = ${merged.status},
        share_id = ${merged.shareId},
        total_steps = ${merged.totalSteps},
        current_step = ${merged.currentStep},
        step_label = ${merged.stepLabel},
        error = ${merged.error},
        hero_image = ${merged.heroImage},
        city_plan = ${merged.cityPlan ? JSON.stringify(merged.cityPlan) : null}::jsonb,
        day_chunks = ${JSON.stringify(merged.dayChunks ?? [])}::jsonb,
        booking = ${merged.booking ? JSON.stringify(merged.booking) : null}::jsonb,
        flights_real = ${merged.flightsReal ? JSON.stringify(merged.flightsReal) : null}::jsonb,
        final_itinerary = ${merged.finalItinerary ? JSON.stringify(merged.finalItinerary) : null}::jsonb,
        steps = ${JSON.stringify(merged.steps ?? [])}::jsonb,
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING *;
    `;
    if (result.rows.length === 0) throw new Error(`Job not found: ${id}`);
    return rowToJob(result.rows[0] as Row);
  },
};
