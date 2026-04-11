import { ImageResponse } from "next/og";
import { getDestinationBySlug } from "@/lib/destinations";

export const runtime = "edge";
export const alt = "Daytrip — AI Travel Itinerary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function parseDuration(slug: string): number | null {
  const m = slug.match(/^(\d+)-day-itinerary$/);
  return m ? parseInt(m[1], 10) : null;
}

export default async function Image({
  params,
}: {
  params: { city: string; duration: string };
}) {
  const dest = getDestinationBySlug(params.city);
  const days = parseDuration(params.duration);

  if (!dest || !days) {
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
        {/* Brand */}
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
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>
            Daytrip
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: 4,
              opacity: 0.8,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {dest.country} · {days}-day trip
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 30,
              marginTop: 6,
            }}
          >
            <span
              style={{
                fontSize: 240,
                fontWeight: 700,
                lineHeight: 0.9,
                letterSpacing: -6,
              }}
            >
              {days}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: -1,
                }}
              >
                days in
              </span>
              <span
                style={{
                  fontSize: 96,
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: -2,
                }}
              >
                {dest.name}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
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
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            The perfect day-by-day itinerary
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
