import { ImageResponse } from "next/og";
import { getDestinationBySlug } from "@/lib/destinations";

export const runtime = "edge";
export const alt = "Daytrip — AI Travel Itinerary Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { city: string };
}) {
  const dest = getDestinationBySlug(params.city);
  if (!dest) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FDF6EC",
            color: "#1A1A1A",
            fontSize: 64,
          }}
        >
          Daytrip
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: `linear-gradient(135deg, ${dest.gradient[0]} 0%, ${dest.gradient[1]} 100%)`,
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: 0.85,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "white",
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: -0.5,
            }}
          >
            Daytrip
          </span>
        </div>

        {/* Middle: city name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: 4,
              opacity: 0.8,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {dest.country} · {dest.region}
          </span>
          <span
            style={{
              fontSize: 140,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            {dest.name}
          </span>
        </div>

        {/* Bottom: tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
          }}
        >
          <span
            style={{
              fontSize: 28,
              opacity: 0.9,
              maxWidth: 800,
              lineHeight: 1.3,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            AI travel guide & itinerary
          </span>
          <span
            style={{
              fontSize: 22,
              opacity: 0.7,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            daytrip.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
