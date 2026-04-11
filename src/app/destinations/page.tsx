import type { Metadata } from "next";
import Link from "next/link";
import { DESTINATIONS, getDestinationsByRegion } from "@/lib/destinations";
import { SITE_NAME } from "@/lib/seo";
import {
  breadcrumbSchema,
  jsonLdString,
} from "@/lib/schema";

export const metadata: Metadata = {
  title: "All Destinations — AI Travel Itineraries",
  description:
    "Explore AI-generated travel itineraries for the world's most loved cities. From Paris to Tokyo, Cape Town to Mexico City — get a personalized day-by-day plan in seconds.",
  alternates: { canonical: "/destinations" },
  openGraph: {
    title: `Destinations | ${SITE_NAME}`,
    description:
      "Browse the world's best cities and generate a personalized AI itinerary for any of them.",
    url: "/destinations",
    type: "website",
  },
};

export default function DestinationsIndexPage() {
  const grouped = getDestinationsByRegion();
  const regions: (keyof typeof grouped)[] = [
    "Europe",
    "Asia",
    "Americas",
    "Africa",
    "Middle East",
    "Oceania",
  ];

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Destinations", url: "/destinations" },
  ]);

  return (
    <main className="min-h-screen bg-cream-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/90 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl text-terracotta-500 font-semibold"
          >
            Daytrip
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/guides"
              className="hidden sm:block text-body-sm text-charcoal-800/70 hover:text-charcoal-900 transition-colors"
            >
              Guides
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:block text-body-sm text-charcoal-800/70 hover:text-charcoal-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/"
              className="rounded-full bg-terracotta-500 px-5 py-2 text-body-sm font-medium text-white transition-colors hover:bg-terracotta-600"
            >
              Plan a trip
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-32 pb-12">
        <p className="font-sans text-caption uppercase tracking-[0.2em] text-terracotta-500 mb-4">
          {DESTINATIONS.length} destinations
        </p>
        <h1 className="font-serif text-display-lg text-charcoal-900 mb-6">
          The world, planned beautifully
        </h1>
        <p className="font-sans text-body-lg text-charcoal-800/70 max-w-2xl">
          Browse hand-picked travel destinations across six continents. Pick a city, choose your trip length, and get a personalized day-by-day itinerary in under a minute.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 space-y-16">
        {regions.map((region) => {
          const list = grouped[region];
          if (!list || list.length === 0) return null;
          return (
            <div key={region}>
              <div className="flex items-baseline justify-between mb-8 border-b border-cream-200 pb-3">
                <h2 className="font-serif text-heading-xl text-charcoal-900">
                  {region}
                </h2>
                <span className="font-sans text-body-sm text-charcoal-800/50">
                  {list.length} {list.length === 1 ? "destination" : "destinations"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/destinations/${d.slug}`}
                    className="group block rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div
                      className="h-40 relative"
                      style={{
                        background: `linear-gradient(135deg, ${d.gradient[0]} 0%, ${d.gradient[1]} 100%)`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-end p-6">
                        <div>
                          <p className="font-sans text-caption uppercase tracking-[0.15em] text-white/70">
                            {d.country}
                          </p>
                          <h3 className="font-serif text-heading text-white">
                            {d.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="font-sans text-body-sm text-charcoal-800/70 line-clamp-3">
                        {d.heroBlurb}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {d.themes.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="font-sans text-caption px-2.5 py-1 rounded-full bg-cream-200 text-charcoal-800/70"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="bg-charcoal-900 text-cream-200/60 py-10 text-center font-sans text-body-sm">
        <p>
          &copy; {new Date().getFullYear()} Daytrip. AI travel itineraries for {DESTINATIONS.length}+ destinations worldwide.
        </p>
      </footer>
    </main>
  );
}
