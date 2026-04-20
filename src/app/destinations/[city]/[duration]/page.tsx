import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DESTINATIONS,
  TRIP_LENGTHS,
  getDestinationBySlug,
  isValidTripLength,
  type Destination,
} from "@/lib/destinations";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  breadcrumbSchema,
  faqSchema,
  jsonLdString,
  touristTripSchema,
} from "@/lib/schema";

interface Props {
  params: { city: string; duration: string };
}

// ============================================================
// Static params: every city × every supported trip length
// ============================================================
export async function generateStaticParams() {
  const out: { city: string; duration: string }[] = [];
  for (const d of DESTINATIONS) {
    for (const days of TRIP_LENGTHS) {
      out.push({ city: d.slug, duration: `${days}-day-itinerary` });
    }
  }
  return out;
}

// ============================================================
// Parse the URL slug ("3-day-itinerary") into a number, or null
// ============================================================
function parseDuration(slug: string): number | null {
  const m = slug.match(/^(\d+)-day-itinerary$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return isValidTripLength(n) ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dest = getDestinationBySlug(params.city);
  const days = parseDuration(params.duration);
  if (!dest || !days) return {};

  const title = `${days} Days in ${dest.name}: The Perfect ${days}-Day Itinerary`;
  const description = `The ideal ${days}-day ${dest.name} itinerary. Day-by-day plan covering the best things to do, eat, and see — plus tips on where to stay, budget, and best time to visit.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/destinations/${dest.slug}/${days}-day-itinerary`,
    },
    openGraph: {
      title,
      description,
      url: `/destinations/${dest.slug}/${days}-day-itinerary`,
      type: "article",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      `${days} days in ${dest.name}`,
      `${dest.name} ${days} day itinerary`,
      `${days} day ${dest.name} trip`,
      `${dest.name} itinerary ${days} days`,
      `what to do in ${dest.name} for ${days} days`,
      `${dest.name} trip planner`,
    ],
  };
}

// ============================================================
// Day plan builder
// Deterministic distribution of a destination's experiences
// across N days, each with morning / afternoon / evening blocks.
// ============================================================
type DayBlock = {
  slot: "Morning" | "Afternoon" | "Evening";
  experience: Destination["experiences"][number];
};

type DayPlan = {
  day: number;
  theme: string;
  intro: string;
  blocks: DayBlock[];
  neighborhood?: string;
};

// Per-duration intro so each /destinations/{city}/{N}-day-itinerary
// variant leads with unique framing rather than repeating dest.longDescription.
function durationIntro(name: string, days: number): string {
  if (days <= 2) {
    return `Two days in ${name} is a highlight reel — you won't see everything, and that's fine. This plan skips the wishful-thinking itineraries and focuses on the five or six experiences that actually define the city, with enough breathing room between them that you leave feeling like you visited rather than raced.`;
  }
  if (days === 3) {
    return `Three days in ${name} hits the sweet spot — enough time to cover the headline sights, a full day of wandering, and one night where you can afford to stay out late. This itinerary paces the must-sees across the first two days and reserves day three for the places you'd never find without a local tip.`;
  }
  if (days === 4) {
    return `Four days is when ${name} starts to feel less like a checklist and more like a place. You'll cover the essentials, bank a day for a neighborhood you fall in love with, and still have a pocket of time for the trip's inevitable surprise discovery. This plan builds in that slack on purpose.`;
  }
  if (days === 5) {
    return `Five days in ${name} is the classic first-time length — enough to feel unhurried, short enough that every day still feels like an event. The plan below front-loads the big sights on rested legs and saves the looser, more local-flavored days for when the city has started to make sense to you.`;
  }
  if (days === 7) {
    return `A week in ${name} turns a holiday into something closer to a short residency. You can afford a day trip, a slow morning or two, a meal you linger over for three hours. This itinerary paces the week so the famous things never feel like a race and the quiet things have room to land.`;
  }
  if (days === 10) {
    return `Ten days in ${name} is a genuinely generous trip — the kind where you can try a neighborhood, decide it's not for you, and swap it out for a different one the next morning. The plan below covers the city's essentials in the first half and leaves the back half loose enough that you can follow the thread of whatever you've actually fallen for.`;
  }
  return `A ${days}-day ${name} itinerary balanced across the city's headline experiences and the slower, more rewarding moments.`;
}

function buildItinerary(dest: Destination, days: number): DayPlan[] {
  // Sort experiences so the major landmarks come first, food/nightlife later
  const order = ["landmark", "culture", "nature", "neighborhood", "shopping", "food", "nightlife"];
  const sorted = [...dest.experiences].sort(
    (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
  );

  // Make sure we always have at least 3*days items by recycling if needed
  const pool: typeof sorted = [];
  let i = 0;
  while (pool.length < days * 3) {
    pool.push(sorted[i % sorted.length]);
    i++;
  }

  const themes = [
    "Iconic sights & old town",
    "Museums, food & local life",
    "Hidden gems & neighborhoods",
    "Day trip & nature",
    "Markets, culture & nightlife",
    "Slow morning, big sights",
    "A locals' day",
  ];

  const intros = [
    `Hit the headline sights early before the crowds, then ease into ${dest.name}'s café culture for the afternoon.`,
    `Pair a major museum with a long lunch and an evening wander through one of ${dest.name}'s most charming neighborhoods.`,
    `Step away from the obvious tourist trail and explore the corners of ${dest.name} most visitors miss.`,
    `A change of scenery — get out of the city center and breathe.`,
    `${dest.name} after dark is when the city really comes alive.`,
    `Sleep in, take it slow, and fill the day with the experiences you came for.`,
    `Eat where the locals eat, walk where the locals walk.`,
  ];

  const plans: DayPlan[] = [];
  for (let d = 0; d < days; d++) {
    const slots: DayBlock["slot"][] = ["Morning", "Afternoon", "Evening"];
    const blocks: DayBlock[] = slots.map((slot, idx) => ({
      slot,
      experience: pool[d * 3 + idx],
    }));

    plans.push({
      day: d + 1,
      theme: themes[d % themes.length],
      intro: intros[d % intros.length],
      blocks,
      neighborhood: dest.neighborhoods[d % dest.neighborhoods.length]?.name,
    });
  }
  return plans;
}

// ============================================================
// Page component
// ============================================================
export default function ItineraryPage({ params }: Props) {
  const dest = getDestinationBySlug(params.city);
  const days = parseDuration(params.duration);
  if (!dest || !days) notFound();

  const plan = buildItinerary(dest, days);
  const url = absoluteUrl(`/destinations/${dest.slug}/${days}-day-itinerary`);

  // Specific FAQs for this length, plus a couple from the destination
  const lengthFaqs = [
    {
      question: `Is ${days} days enough for ${dest.name}?`,
      answer:
        days <= 2
          ? `${days} days in ${dest.name} is enough for a focused first taste — you'll see the headline sights and eat well, but you'll likely leave wanting more. Ideal for a long weekend or a stopover.`
          : days <= 3
            ? `Yes — ${days} days is the most popular trip length for ${dest.name} and lets you cover the major sights, eat at a few great restaurants, and explore one or two neighborhoods at a relaxed pace.`
            : days <= 5
              ? `${days} days in ${dest.name} is the sweet spot for a first-time visit. You'll hit all the headline experiences, plus have time for a day trip and slower mornings.`
              : `${days} days lets you really live in ${dest.name} — see everything most travelers miss, take multiple day trips, and find the version of the city you'll keep coming back to.`,
    },
    {
      question: `What's the best time of year for a ${days}-day ${dest.name} trip?`,
      answer: dest.bestTimeBlurb,
    },
    {
      question: `How much should I budget for ${days} days in ${dest.name}?`,
      answer: `For a comfortable mid-range trip, plan around $${dest.avgDailyBudgetUSD.mid * days} per person for ${days} days, covering a 3-star hotel, two restaurant meals a day, attractions, and local transit. Budget travelers can do it for around $${dest.avgDailyBudgetUSD.budget * days}, while a luxury experience runs $${dest.avgDailyBudgetUSD.luxury * days}+.`,
    },
    ...dest.faqs.slice(0, 2),
  ];

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Destinations", url: "/destinations" },
      { name: dest.name, url: `/destinations/${dest.slug}` },
      {
        name: `${days} Day Itinerary`,
        url: `/destinations/${dest.slug}/${days}-day-itinerary`,
      },
    ]),
    touristTripSchema({
      name: `${days} Days in ${dest.name}`,
      description: `A ${days}-day itinerary for ${dest.name}, ${dest.country}`,
      url,
      destinationName: dest.name,
      country: dest.country,
      durationDays: days,
    }),
    faqSchema(lengthFaqs),
  ];

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
              href={`/destinations/${dest.slug}`}
              className="hidden sm:block text-body-sm text-charcoal-800/70 hover:text-charcoal-900 transition-colors"
            >
              {dest.name} guide
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
        <div className="max-w-4xl mx-auto">
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
            <Link
              href={`/destinations/${dest.slug}`}
              className="hover:text-white"
            >
              {dest.name}
            </Link>
            {" / "}
            <span className="text-white">{days}-day itinerary</span>
          </nav>
          <p className="font-sans text-caption uppercase tracking-[0.2em] text-white/80 mb-4">
            {dest.country} · {days}-day trip
          </p>
          <h1 className="font-serif text-display-lg md:text-display-xl text-white mb-6">
            {days} Days in {dest.name}
          </h1>
          <p className="font-sans text-body-lg text-white/90 max-w-2xl">
            The perfect {days}-day {dest.name} itinerary — a complete day-by-day plan covering the best things to do, where to eat, and where to stay.
          </p>
        </div>
      </section>

      {/* Intro — framed by trip length so variants don't duplicate copy */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-8">
        <p className="font-sans text-body-lg text-charcoal-800 leading-relaxed">
          {durationIntro(dest.name, days)}
        </p>
        <p className="font-sans text-body-lg text-charcoal-800/90 leading-relaxed mt-4">
          {dest.longDescription}
        </p>
      </section>

      {/* Quick facts */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="rounded-2xl bg-white shadow-card p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Trip length" value={`${days} days`} />
          <Stat
            label="Daily budget"
            value={`$${dest.avgDailyBudgetUSD.mid}`}
          />
          <Stat label="Total budget" value={`$${dest.avgDailyBudgetUSD.mid * days}`} />
          <Stat
            label="Best months"
            value={dest.bestMonths.slice(0, 2).join(", ")}
          />
        </div>
      </section>

      {/* Day-by-day */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-2">
          Your day-by-day {dest.name} plan
        </h2>
        <p className="font-sans text-body text-charcoal-800/70 mb-10">
          Each day is built around three flexible blocks. Adjust to your taste — generate a fully personalized version below.
        </p>

        <div className="space-y-8">
          {plan.map((day) => (
            <article
              key={day.day}
              className="rounded-2xl bg-white shadow-card overflow-hidden"
            >
              <div
                className="px-6 py-5 border-b border-cream-200"
                style={{
                  background: `linear-gradient(90deg, ${dest.gradient[0]}15 0%, ${dest.gradient[1]}05 100%)`,
                }}
              >
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-sans text-caption uppercase tracking-[0.15em] text-terracotta-500">
                      Day {day.day}
                    </p>
                    <h3 className="font-serif text-heading text-charcoal-900 mt-1">
                      {day.theme}
                    </h3>
                  </div>
                  {day.neighborhood && (
                    <span className="font-sans text-body-sm text-charcoal-800/60">
                      Based in {day.neighborhood}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-6 py-6">
                <p className="font-sans text-body text-charcoal-800/80 mb-6 italic">
                  {day.intro}
                </p>
                <div className="space-y-5">
                  {day.blocks.map((block, idx) => (
                    <div key={idx} className="flex gap-5">
                      <div className="flex-shrink-0 w-24">
                        <p className="font-sans text-caption uppercase tracking-[0.15em] text-charcoal-800/50">
                          {block.slot}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-body-lg text-charcoal-900 mb-1">
                          {block.experience.name}
                        </p>
                        <p className="font-sans text-body-sm text-charcoal-800/70 leading-relaxed">
                          {block.experience.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Where to stay */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-6">
          Where to stay for a {days}-day trip
        </h2>
        <p className="font-sans text-body text-charcoal-800/70 mb-6">
          For a {days}-day visit, base yourself in one neighborhood — you'll waste hours in transit if you split your stay. These are the best {dest.name} bases.
        </p>
        <div className="space-y-4">
          {dest.neighborhoods.slice(0, 3).map((n) => (
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

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-8">
          {days} days in {dest.name}: FAQ
        </h2>
        <div className="space-y-4">
          {lengthFaqs.map((faq) => (
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

      {/* Other lengths */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-heading-xl text-charcoal-900 mb-6">
          Other {dest.name} trip lengths
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRIP_LENGTHS.filter((d) => d !== days).map((d) => (
            <Link
              key={d}
              href={`/destinations/${dest.slug}/${d}-day-itinerary`}
              className="rounded-xl bg-white p-4 text-center shadow-card hover:shadow-card-hover transition-all"
            >
              <p className="font-serif text-heading text-terracotta-500">
                {d}
              </p>
              <p className="font-sans text-caption text-charcoal-800/70">
                days
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal-900 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-sans text-caption uppercase tracking-[0.2em] text-cream-200/50 mb-4">
            Personalize this trip
          </p>
          <h2 className="font-serif text-display text-white mb-6">
            Make this {days}-day {dest.name} plan your own
          </h2>
          <p className="font-sans text-body-lg text-cream-200/70 mb-8">
            Tell us your dates, budget, and travel style. We'll generate a fully personalized {days}-day itinerary with real restaurants, hotels, and bookable activities — built specifically around how you like to travel.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-terracotta-500 px-8 py-4 font-sans text-body font-medium text-white hover:bg-terracotta-600 transition-colors"
          >
            Generate my personalized itinerary
          </Link>
        </div>
      </section>

      <footer className="bg-charcoal-900 text-cream-200/60 py-10 font-sans text-body-sm">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} {SITE_NAME}.{" "}
            <Link href="/destinations" className="hover:text-cream-100">
              Browse all destinations
            </Link>
          </p>
          <nav className="flex gap-6">
            <Link href="/about" className="hover:text-cream-100">About</Link>
            <Link href="/contact" className="hover:text-cream-100">Contact</Link>
            <Link href="/privacy" className="hover:text-cream-100">Privacy</Link>
            <Link href="/terms" className="hover:text-cream-100">Terms</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-caption uppercase tracking-[0.15em] text-charcoal-800/50 mb-1">
        {label}
      </p>
      <p className="font-serif text-heading text-charcoal-900">{value}</p>
    </div>
  );
}
