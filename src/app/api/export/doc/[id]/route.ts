import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db-client";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { MOCK_TOKYO_ITINERARY } from "@/lib/mock-data";
import { ensureItinerariesTable } from "@/lib/trip-job-repo";
import type { Itinerary } from "@/types/itinerary";

export const runtime = "nodejs";
export const maxDuration = 30;

async function loadItinerary(shareId: string): Promise<Itinerary | null> {
  if (shareId === "demo" || shareId === "tokyo-demo-5d") {
    return MOCK_TOKYO_ITINERARY as Itinerary;
  }
  const dbConfigured =
    !!process.env.POSTGRES_URL ||
    !!process.env.POSTGRES_PRISMA_URL ||
    !!process.env.DATABASE_URL;
  if (!dbConfigured) return null;
  await ensureItinerariesTable();
  const result = await sql`
    SELECT itinerary_data FROM itineraries WHERE share_id = ${shareId} LIMIT 1;
  `;
  const row = result.rows[0] as { itinerary_data: Itinerary } | undefined;
  return row?.itinerary_data ?? null;
}

function h(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function p(text: string, bold = false, italic = false) {
  return new Paragraph({
    children: [new TextRun({ text, bold, italics: italic })],
  });
}

function blank() {
  return new Paragraph({ children: [new TextRun("")] });
}

function cityForDay(itinerary: Itinerary, dayNumber: number) {
  if (!itinerary.cityPlan) return null;
  for (const c of itinerary.cityPlan) {
    if (dayNumber >= c.startDay && dayNumber <= c.endDay) return c;
  }
  return null;
}

function buildDoc(itinerary: Itinerary): Document {
  const kids: Paragraph[] = [];

  // Title
  kids.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: itinerary.destination })],
    })
  );
  kids.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${itinerary.startDate} → ${itinerary.endDate}  ·  ${itinerary.travelers} traveler${
            itinerary.travelers > 1 ? "s" : ""
          }  ·  ${itinerary.travelStyle}`,
          italics: true,
        }),
      ],
    })
  );
  kids.push(blank());

  // Flights
  if (itinerary.flights && itinerary.flights.length > 0) {
    kids.push(h("Flights", HeadingLevel.HEADING_1));
    for (const f of itinerary.flights) {
      kids.push(
        p(
          `${f.airline}: ${f.originAirport ?? "—"} → ${f.destinationAirport ?? "—"} · ${
            f.price
          } · ${f.stops === 0 ? "direct" : `${f.stops} stop(s)`}`
        )
      );
    }
    kids.push(blank());
  }

  // Hotels
  kids.push(h("Hotels", HeadingLevel.HEADING_1));
  if (itinerary.hotelsByCity && Object.keys(itinerary.hotelsByCity).length > 0) {
    for (const [city, list] of Object.entries(itinerary.hotelsByCity)) {
      kids.push(h(city, HeadingLevel.HEADING_2));
      for (const hotel of list) {
        const tier = hotel.tier ? ` [${hotel.tier}]` : "";
        kids.push(p(`${hotel.name}${tier}`, true));
        kids.push(p(`  ${hotel.pricePerNight} / night · ${hotel.rating.toFixed(1)}★`));
      }
    }
  } else {
    for (const hotel of itinerary.hotels) {
      kids.push(p(hotel.name, true));
      kids.push(p(`  ${hotel.pricePerNight} / night · ${hotel.rating.toFixed(1)}★`));
    }
  }
  kids.push(blank());

  // Tips
  if (itinerary.tips && itinerary.tips.length > 0) {
    kids.push(h("Travel tips", HeadingLevel.HEADING_1));
    for (const t of itinerary.tips) {
      kids.push(p(`• ${t}`));
    }
    kids.push(blank());
  }

  // Day-by-day
  kids.push(h("Day by day", HeadingLevel.HEADING_1));
  for (const day of itinerary.days) {
    const dayHeader = `Day ${day.dayNumber}${day.title ? ` — ${day.title}` : ""}`;
    kids.push(h(dayHeader, HeadingLevel.HEADING_2));
    const cityEntry = cityForDay(itinerary, day.dayNumber);
    const dateLine = cityEntry
      ? `${day.date}  ·  ${cityEntry.city}, ${cityEntry.country}`
      : day.date;
    kids.push(p(dateLine, false, true));

    for (const block of [
      { label: "Morning", activities: day.morning },
      { label: "Afternoon", activities: day.afternoon },
      { label: "Evening", activities: day.evening },
    ]) {
      if (block.activities.length === 0) continue;
      kids.push(h(block.label, HeadingLevel.HEADING_3));
      for (const a of block.activities) {
        kids.push(p(`${a.time}  ${a.name}${a.duration ? ` · ${a.duration}` : ""}`, true));
        if (a.description) kids.push(p(`  ${a.description}`));
      }
    }
    if (day.tip) {
      kids.push(p(`Tip: ${day.tip}`, false, true));
    }
    kids.push(blank());
  }

  return new Document({
    sections: [{ properties: {}, children: kids }],
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    const itin = await loadItinerary(id);
    if (!itin) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const doc = buildDoc(itin);
    const buffer = await Packer.toBuffer(doc);
    // Next.js expects BodyInit — convert Node Buffer → Uint8Array so the
    // type system accepts it; wire ultimately sends the same bytes.
    const body = new Uint8Array(buffer);
    const filename = `${itin.destination.replace(/[^a-zA-Z0-9]+/g, "-")}-itinerary.docx`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export/doc] failed:", e);
    return NextResponse.json(
      {
        error: "export_failed",
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
