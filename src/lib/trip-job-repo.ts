/**
 * Persistence layer for trip_jobs. All reads/writes go through here
 * so the API routes and tests can swap a real Supabase client for an
 * in-memory one via setRepoBackend().
 */

import { getSupabaseAdminClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  return supabaseRepo;
}

// ── In-memory repo (used by tests) ──────────────────────────────────

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
      const merged: TripJob = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, merged);
      return merged;
    },
  };
}

// ── Supabase-backed repo ────────────────────────────────────────────

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

function jobToRow(job: Partial<TripJob>): Partial<Row> {
  const r: Partial<Row> = {};
  if (job.id !== undefined) r.id = job.id;
  if (job.userId !== undefined) r.user_id = job.userId;
  if (job.anonToken !== undefined) r.anon_token = job.anonToken;
  if (job.status !== undefined) r.status = job.status;
  if (job.request !== undefined) r.request_json = job.request;
  if (job.shareId !== undefined) r.share_id = job.shareId;
  if (job.totalSteps !== undefined) r.total_steps = job.totalSteps;
  if (job.currentStep !== undefined) r.current_step = job.currentStep;
  if (job.stepLabel !== undefined) r.step_label = job.stepLabel;
  if (job.error !== undefined) r.error = job.error;
  if (job.heroImage !== undefined) r.hero_image = job.heroImage;
  if (job.cityPlan !== undefined) r.city_plan = job.cityPlan;
  if (job.dayChunks !== undefined) r.day_chunks = job.dayChunks;
  if (job.booking !== undefined) r.booking = job.booking;
  if (job.flightsReal !== undefined) r.flights_real = job.flightsReal;
  if (job.finalItinerary !== undefined) r.final_itinerary = job.finalItinerary;
  if (job.steps !== undefined) r.steps = job.steps;
  return r;
}

function requireClient(): SupabaseClient {
  const c = getSupabaseAdminClient();
  if (!c) {
    throw new Error(
      "Supabase admin client not configured. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return c;
}

export const supabaseRepo: TripJobRepo = {
  async create(job) {
    const client = requireClient();
    const row = jobToRow(job) as Partial<Row>;
    const { data, error } = await client
      .from("trip_jobs")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(`trip_jobs insert failed: ${error.message}`);
    return rowToJob(data as Row);
  },
  async get(id) {
    const client = requireClient();
    const { data, error } = await client
      .from("trip_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`trip_jobs get failed: ${error.message}`);
    return data ? rowToJob(data as Row) : null;
  },
  async update(id, patch) {
    const client = requireClient();
    const row = jobToRow(patch);
    const { data, error } = await client
      .from("trip_jobs")
      .update(row)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`trip_jobs update failed: ${error.message}`);
    return rowToJob(data as Row);
  },
};
