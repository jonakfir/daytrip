import { NextRequest, NextResponse } from "next/server";
import { runOneStep } from "@/lib/trip-job-runner";
import { getRepo } from "@/lib/trip-job-repo";
import { fetchHeroImageForStep, fetchBestFlightsForStep, finalizeItinerary } from "@/lib/trip-external";
import type { Itinerary } from "@/types/itinerary";

export const runtime = "nodejs";
// Per-step budget: 90s for the Vercel function. Inner Claude calls
// cap at 80s so any timeout error fires cleanly and the step runner
// can mark the step failed + retry, instead of Vercel killing the
// function with a generic 504 (which leaves the step in "running"
// state forever and blocks progress).
export const maxDuration = 90;

interface Params {
  params: { jobId: string };
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { jobId } = params;
  try {
    const job = await runOneStep(jobId, {
      callClaude: (await import("@/lib/claude-client")).callClaudeWithUsage,
      addUsage: async (userId, cents) => {
        const { addClaudeUsage } = await import("@/lib/db");
        addClaudeUsage(userId, cents).catch(() => undefined);
      },
      fetchHero: fetchHeroImageForStep,
      fetchFlights: fetchBestFlightsForStep,
    });

    // If this call just completed the assemble step, persist the final
    // itinerary to the itineraries table so /trip/[shareId] works.
    if (job.status === "complete" && job.finalItinerary) {
      await finalizeItinerary(job.finalItinerary as Itinerary).catch(() => undefined);
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      currentStep: job.currentStep,
      totalSteps: job.totalSteps,
      stepLabel: job.stepLabel,
      steps: job.steps,
      error: job.error,
      shareId: job.shareId,
      partial: {
        heroImage: job.heroImage,
        cityPlan: job.cityPlan,
        booking: job.booking,
        dayChunks: job.dayChunks,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Look up the job state even on hard error so the client still sees progress
    const job = await getRepo().get(jobId).catch(() => null);
    return NextResponse.json(
      {
        jobId,
        status: job?.status ?? "failed",
        error: message,
        steps: job?.steps ?? [],
      },
      { status: 500 }
    );
  }
}
