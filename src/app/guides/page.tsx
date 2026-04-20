import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { SITE_NAME } from "@/lib/seo";
import { breadcrumbSchema, jsonLdString } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Travel Guides — Tips, Comparisons & Planning",
  description:
    "Honest, evergreen travel guides — how to plan a trip, the best time to visit Europe, first-time Japan tips, and more.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: `Travel Guides | ${SITE_NAME}`,
    description:
      "Honest travel guides for planning, destinations, and trip tips.",
    url: "/guides",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Travel guides, tips, and planning advice`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Travel Guides | ${SITE_NAME}`,
    description:
      "Honest travel guides for planning, destinations, and trip tips.",
    images: ["/opengraph-image"],
  },
};

export default function GuidesIndexPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
  ]);

  const categories: { [k: string]: typeof GUIDES } = {};
  for (const g of GUIDES) {
    if (!categories[g.category]) categories[g.category] = [];
    categories[g.category].push(g);
  }

  return (
    <main className="min-h-screen bg-cream-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/90 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl text-terracotta-500 font-semibold"
          >
            Daytrip
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/destinations"
              className="hidden sm:block text-body-sm text-charcoal-800/70 hover:text-charcoal-900 transition-colors"
            >
              Destinations
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

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-12">
        <p className="font-sans text-caption uppercase tracking-[0.2em] text-terracotta-500 mb-4">
          Travel guides
        </p>
        <h1 className="font-serif text-display-lg text-charcoal-900 mb-6">
          The honest travel library
        </h1>
        <p className="font-sans text-body-lg text-charcoal-800/70 max-w-2xl">
          Evergreen, no-fluff guides for planning your next trip. Built to be useful, not to win SEO contests — though we hope they do both.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        {Object.entries(categories).map(([category, guides]) => (
          <div key={category}>
            <h2 className="font-serif text-heading-xl text-charcoal-900 mb-6 border-b border-cream-200 pb-3">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <div
                    className="h-32"
                    style={{
                      background: `linear-gradient(135deg, ${g.gradient[0]} 0%, ${g.gradient[1]} 100%)`,
                    }}
                  />
                  <div className="p-6">
                    <p className="font-sans text-caption uppercase tracking-[0.15em] text-terracotta-500 mb-2">
                      {g.readMinutes} min read
                    </p>
                    <h3 className="font-serif text-heading text-charcoal-900 mb-3 group-hover:text-terracotta-600 transition-colors">
                      {g.title}
                    </h3>
                    <p className="font-sans text-body-sm text-charcoal-800/70 line-clamp-3">
                      {g.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="bg-charcoal-900 text-cream-200/60 py-10 text-center font-sans text-body-sm">
        <p>&copy; {new Date().getFullYear()} {SITE_NAME}.</p>
      </footer>
    </main>
  );
}
