import { NextRequest, NextResponse } from "next/server";
import { getRepo } from "@/lib/trip-job-repo";

export const runtime = "nodejs";
export const maxDuration = 10;

interface Params {
  params: { jobId: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { jobId } = params;
  const job = await getRepo().get(jobId);
  if (!job) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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
    updatedAt: job.updatedAt,
    partial: {
      heroImage: job.heroImage,
      cityPlan: job.cityPlan,
      booking: job.booking,
      dayChunks: job.dayChunks,
    },
  });
}
