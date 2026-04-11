import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Daytrip AI Travel Planner",
  description:
    "Simple pricing for Daytrip's AI travel itinerary generator. Free to start, affordable trip credits, and unlimited yearly plans for frequent travelers.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — Daytrip",
    description:
      "Flexible pricing for AI-generated travel itineraries. Start free and upgrade when you're ready.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
