import { ImageResponse } from "next/og";
import { getGuideBySlug } from "@/lib/guides";

export const runtime = "edge";
export const alt = "Daytrip Travel Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) {
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
          background: `linear-gradient(135deg, ${guide.gradient[0]} 0%, ${guide.gradient[1]} 100%)`,
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 16, opacity: 0.85 }}
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
              style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}
            >
              Daytrip
            </span>
          </div>
          <span
            style={{
              fontSize: 20,
              textTransform: "uppercase",
              letterSpacing: 3,
              opacity: 0.75,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {guide.category} · {guide.readMinutes} min read
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: 1040,
          }}
        >
          <span
            style={{
              fontSize: guide.title.length > 60 ? 64 : 78,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            {guide.title}
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
              fontSize: 26,
              opacity: 0.9,
              maxWidth: 800,
              lineHeight: 1.3,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {guide.excerpt.length > 120
              ? guide.excerpt.slice(0, 117) + "…"
              : guide.excerpt}
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
