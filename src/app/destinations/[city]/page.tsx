import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DESTINATIONS,
  TRIP_LENGTHS,
  getDestinationBySlug,
} from "@/lib/destinations";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  breadcrumbSchema,
  faqSchema,
  jsonLdString,
  touristDestinationSchema,
} from "@/lib/schema";

interface Props {
  params: { city: string };
}

export async function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ city: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dest = getDestinationBySlug(params.city);
  if (!dest) return {};

  const title = `${dest.name} Travel Guide — Best Things to Do, See & Eat`;
  const description = `Plan the perfect trip to ${dest.name}, ${dest.country}. ${dest.heroBlurb} Includes top neighborhoods, must-do experiences, and AI-generated day-by-day itineraries.`;

  return {
    title,
    description,
    alternates: { canonical: `/destinations/${dest.slug}` },
    openGraph: {
      title,
      description,
      url: `/destinations/${dest.slug}`,
      type: "article",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      `${dest.name} travel guide`,
      `things to do in ${dest.name}`,
      `${dest.name} itinerary`,
      `${dest.name} trip planner`,
      `best time to visit ${dest.name}`,
      `${dest.name} ${dest.country}`,
    ],
  };
}

export default function CityPage({ params }: Props) {
  const dest = getDestinationBySlug(params.city);
  if (!dest) notFound();

  const url = absoluteUrl(`/destinations/${dest.slug}`);

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Destinations", url: "/destinations" },
      { name: dest.name, url: `/destinations/${dest.slug}` },
    ]),
    touristDestinationSchema({
      name: dest.name,
      description: dest.heroBlurb,
      url,
      country: dest.country,
      latitude: dest.latitude,
      longitude: dest.longitude,
      touristType: dest.themes,
    }),
    faqSchema(dest.faqs),
  ];

  // Group experiences by type for nicer rendering
  const experiencesByType = dest.experiences.reduce(
    (acc, exp) => {
      if (!acc[exp.type]) acc[exp.type] = [];
      acc[exp.type].push(exp);
      return acc;
    },
    {} as Record<string, typeof dest.experiences>
  );

  // Suggest 3 related destinations from the same region
  const related = DESTINATIONS.filter(
    (d) => d.region === dest.region && d.slug !== dest.slug
  ).slice(0, 3);

  return (
    <main className="min-h-screen bg-cream-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(schemas) }}
      />

      {/* Top nav */}
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

      {/* Hero */}
      <section
        className="relative pt-32 pb-20 px-6"
        style={{
          background: `linear-gradient(135deg, ${dest.gradient[0]} 0%, ${dest.gradient[1]} 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <nav
            aria-label="Breadcrumb"
            className="font-sans text-body-sm text-white/70 mb-6"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            {" / "}
            <Link href="/destinations" className="hover:text-white">
              Destinations
            </Link>
            {" / "}
            <span className="text-white">{dest.name}</span>
          </nav>
          <p className="font-sans text-caption uppercase tracking-[0.2em] text-white/80 mb-4">
            {dest.country} · {dest.region}
          </p>
          <h1 className="font-serif text-display-lg md:text-display-xl text-white mb-6">
            {dest.name}
          </h1>
          <p className="font-sans text-body-lg text-white/90 max-w-2xl">
            {dest.heroBlurb}
          </p>
        </div>
      </section>

      {/* Quick facts strip */}
      <section className="bg-white border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Fact label="Best months" value={dest.bestMonths.slice(0, 3).join(", ")} />
          <Fact label="Currency" value={dest.currency} />
          <Fact label="Language" value={dest.language} />
          <Fact label="Mid-range / day" value={`$${dest.avgDailyBudgetUSD.mid}`} />
        </div>
      </section>

      {/* Long description */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12">
        <p className="font-sans text-body-lg text-charcoal-800 leading-relaxed">
          {dest.longDescription}
        </p>
      </section>

      {/* Trip length CTAs */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-2">
          Ready-made itinerary lengths
        </h2>
        <p className="font-sans text-body text-charcoal-800/70 mb-8">
          Pick a trip length to see a sample day-by-day plan, or generate your own personalized itinerary.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRIP_LENGTHS.map((days) => (
            <Link
              key={days}
              href={`/destinations/${dest.slug}/${days}-day-itinerary`}
              className="group block rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <p className="font-serif text-display text-terracotta-500 group-hover:text-terracotta-600">
                {days}
              </p>
              <p className="font-sans text-body-sm text-charcoal-800/70 mt-1">
                days in {dest.name}
              </p>
              <p className="font-sans text-caption text-terracotta-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                See itinerary →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Best time to visit */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-4">
          Best time to visit {dest.name}
        </h2>
        <p className="font-sans text-body-lg text-charcoal-800 leading-relaxed">
          {dest.bestTimeBlurb}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {dest.bestMonths.map((m) => (
            <span
              key={m}
              className="font-sans text-body-sm px-4 py-2 rounded-full bg-sage-300/20 text-sage-700 border border-sage-300/40"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-8">
          Where to stay in {dest.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dest.neighborhoods.map((n) => (
            <div
              key={n.name}
              className="rounded-2xl bg-white p-6 shadow-card"
            >
              <h3 className="font-serif text-heading text-charcoal-900 mb-2">
                {n.name}
              </h3>
              <p className="font-sans text-body text-charcoal-800/70 leading-relaxed">
                {n.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Experiences */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-2">
          Best things to do in {dest.name}
        </h2>
        <p className="font-sans text-body text-charcoal-800/70 mb-8">
          The experiences locals and seasoned travelers actually recommend.
        </p>
        <div className="space-y-4">
          {dest.experiences.map((exp) => (
            <div
              key={exp.name}
              className="rounded-2xl bg-white p-6 shadow-card flex gap-6"
            >
              <div className="flex-shrink-0">
                <span className="inline-block font-sans text-caption uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-cream-200 text-charcoal-800/70">
                  {exp.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-heading text-charcoal-900 mb-1">
                  {exp.name}
                </h3>
                <p className="font-sans text-body text-charcoal-800/70 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Budget */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-8">
          How much does a trip to {dest.name} cost?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BudgetCard
            label="Budget"
            amount={dest.avgDailyBudgetUSD.budget}
            note="Hostels, street food, public transit"
          />
          <BudgetCard
            label="Mid-range"
            amount={dest.avgDailyBudgetUSD.mid}
            note="3-star hotel, two meals out, taxis"
            featured
          />
          <BudgetCard
            label="Luxury"
            amount={dest.avgDailyBudgetUSD.luxury}
            note="4-5 star hotel, fine dining, private transfers"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-8">
          {dest.name} travel FAQ
        </h2>
        <div className="space-y-4">
          {dest.faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl bg-white p-6 shadow-card"
            >
              <summary className="font-serif text-heading text-charcoal-900 cursor-pointer list-none flex items-center justify-between">
                <span>{faq.question}</span>
                <span className="ml-4 text-terracotta-500 group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="font-sans text-body text-charcoal-800/70 leading-relaxed mt-4">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Generate CTA */}
      <section className="bg-charcoal-900 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-display text-white mb-6">
            Plan your {dest.name} trip in seconds
          </h2>
          <p className="font-sans text-body-lg text-cream-200/70 mb-8">
            Tell us your dates, budget, and travel style. We'll generate a personalized day-by-day itinerary with real restaurants, hotels, and bookable activities.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-terracotta-500 px-8 py-4 font-sans text-body font-medium text-white hover:bg-terracotta-600 transition-colors"
          >
            Generate my {dest.name} itinerary
          </Link>
        </div>
      </section>

      {/* Related destinations */}
      {related.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="font-serif text-heading-xl text-charcoal-900 mb-8">
            More in {dest.region}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/destinations/${r.slug}`}
                className="group block rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div
                  className="h-32 p-5 flex items-end"
                  style={{
                    background: `linear-gradient(135deg, ${r.gradient[0]} 0%, ${r.gradient[1]} 100%)`,
                  }}
                >
                  <h3 className="font-serif text-heading text-white">
                    {r.name}
                  </h3>
                </div>
                <div className="p-5">
                  <p className="font-sans text-body-sm text-charcoal-800/70 line-clamp-2">
                    {r.heroBlurb}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="bg-charcoal-900 text-cream-200/60 py-10 text-center font-sans text-body-sm">
        <p>
          &copy; {new Date().getFullYear()} {SITE_NAME}. Plan your next adventure with AI.
        </p>
      </footer>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-caption uppercase tracking-[0.15em] text-charcoal-800/50 mb-1">
        {label}
      </p>
      <p className="font-serif text-heading text-charcoal-900">{value}</p>
    </div>
  );
}

function BudgetCard({
  label,
  amount,
  note,
  featured,
}: {
  label: string;
  amount: number;
  note: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-card ${
        featured
          ? "bg-terracotta-500 text-white"
          : "bg-white text-charcoal-900"
      }`}
    >
      <p
        className={`font-sans text-caption uppercase tracking-[0.15em] mb-2 ${
          featured ? "text-white/70" : "text-charcoal-800/50"
        }`}
      >
        {label}
      </p>
      <p className="font-serif text-display mb-2">${amount}</p>
      <p
        className={`font-sans text-body-sm ${
          featured ? "text-white/80" : "text-charcoal-800/70"
        }`}
      >
        per day · {note}
      </p>
    </div>
  );
}
