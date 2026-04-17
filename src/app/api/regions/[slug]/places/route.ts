import { NextRequest, NextResponse } from "next/server";
import { getRegionBySlug } from "@/lib/region-catalog";

export const runtime = "nodejs";

interface Params {
  params: { slug: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const region = getRegionBySlug(params.slug);
  if (!region) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    slug: region.slug,
    label: region.label,
    blurb: region.blurb,
    countries: region.countries,
  });
}
