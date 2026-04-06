"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Itinerary {
  destination: string;
  country: string;
  days: number;
  tags: string[];
  highlights: string[];
  gradient: string;
  slug: string;
}

const itineraries: Itinerary[] = [
  {
    destination: "Tokyo",
    country: "Japan",
    days: 5,
    tags: ["Cultural", "Foodie"],
    highlights: [
      "Sunrise at Senso-ji Temple",
      "Private sushi omakase in Ginza",
      "Day trip to Mount Fuji",
      "Shibuya nightlife & izakaya crawl",
    ],
    gradient: "from-red-600 via-rose-400 to-white",
    slug: "tokyo-japan",
  },
  {
    destination: "Amalfi Coast",
    country: "Italy",
    days: 7,
    tags: ["Relaxation", "Luxury"],
    highlights: [
      "Private yacht along the coastline",
      "Limoncello tasting in Ravello",
      "Cliffside dinner in Positano",
      "Hidden beach exploration by boat",
    ],
    gradient: "from-blue-500 via-sky-300 to-amber-200",
    slug: "amalfi-coast-italy",
  },
  {
    destination: "Marrakech",
    country: "Morocco",
    days: 4,
    tags: ["Adventure", "Cultural"],
    highlights: [
      "Sunrise hot air balloon over the desert",
      "Medina guided walking tour",
      "Traditional riad cooking class",
      "Atlas Mountains day excursion",
    ],
    gradient: "from-orange-600 via-amber-500 to-red-700",
    slug: "marrakech-morocco",
  },
];

function ItineraryCard({
  itinerary,
  index,
}: {
  itinerary: Itinerary;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-shadow duration-500"
    >
      {/* Image placeholder */}
      <div
        className={cn(
          "relative h-64 w-full overflow-hidden bg-gradient-to-br",
          itinerary.gradient
        )}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-500" />

        {/* Duration badge */}
        <span className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-body-sm font-sans font-medium text-charcoal-900">
          {itinerary.days} days
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-heading-lg text-charcoal-900">
          {itinerary.destination}
        </h3>
        <p className="mt-1 font-sans text-body-sm text-charcoal-800/60">
          {itinerary.country}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {itinerary.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-sage-400/30 bg-sage-300/10 px-3 py-0.5 text-caption font-sans text-sage-600"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Highlights */}
        <ul className="mt-5 flex-1 space-y-2">
          {itinerary.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2 text-body-sm font-sans text-charcoal-800/80"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta-500" />
              {highlight}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href="/trip/demo"
          className="mt-6 inline-flex items-center gap-1.5 font-sans text-body-sm font-medium text-terracotta-500 transition-colors hover:text-terracotta-600"
        >
          View itinerary
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </motion.div>
  );
}

export default function SampleItineraries() {
  return (
    <section id="samples" className="bg-cream-100 py-24 px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-serif text-display text-charcoal-900 md:text-display-lg">
          Explore Sample Itineraries
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-body-lg text-charcoal-800/60">
          Get inspired by handcrafted journeys designed for the discerning
          traveler.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((itinerary, i) => (
            <ItineraryCard
              key={itinerary.slug}
              itinerary={itinerary}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
