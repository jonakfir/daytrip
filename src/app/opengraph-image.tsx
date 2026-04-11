import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Daytrip — AI Travel Itinerary Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          background: "linear-gradient(135deg, #D4734A 0%, #7D3218 100%)",
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
            opacity: 0.9,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "white",
            }}
          />
          <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>
            Daytrip
          </span>
        </div>

        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span
            style={{
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: 4,
              opacity: 0.8,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            AI Travel Itinerary Generator
          </span>
          <span
            style={{
              fontSize: 116,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: -3,
              maxWidth: 1040,
            }}
          >
            Plan your perfect trip
          </span>
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
              maxWidth: 880,
              lineHeight: 1.3,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            Personalized day-by-day itineraries for 40+ destinations worldwide
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
