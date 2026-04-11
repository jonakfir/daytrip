import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Trips — Daytrip",
  description:
    "Every itinerary you've planned with Daytrip, in one place. Sign in to view your trip library.",
  alternates: { canonical: "/trips" },
  // Private — should never appear in search results.
  robots: { index: false, follow: false },
};

export default function TripsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
