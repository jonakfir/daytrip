"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface Itinerary {
  destination: string;
  country: string;
  days: number;
  tags: string[];
  highlights: string[];
  image: string;
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
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&q=80",
    slug: "marrakech-morocco",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function ItineraryCard({ itinerary, index }: { itinerary: Itinerary; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1"
    >
      {/* Real destination photo */}
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={itinerary.image}
          alt={`${itinerary.destination}, ${itinerary.country}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Duration badge */}
        <span className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-body-sm font-sans font-medium text-charcoal-900 shadow-sm">
          {itinerary.days} days
        </span>

        {/* Destination name overlay */}
        <div className="absolute bottom-4 left-4">
          <h3 className="font-serif text-heading-lg text-white drop-shadow-lg">
            {itinerary.destination}
          </h3>
          <p className="font-sans text-body-sm text-white/80">
            {itinerary.country}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {itinerary.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-sage-400/30 bg-sage-300/10 px-3 py-0.5 text-caption font-sans text-sage-600 transition-colors duration-300 group-hover:border-sage-400/50"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Highlights */}
        <ul className="mt-4 flex-1 space-y-2">
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
          className="mt-6 inline-flex items-center gap-1.5 font-sans text-body-sm font-medium text-terracotta-500 transition-colors hover:text-terracotta-600 group/link"
        >
          View itinerary
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover/link:translate-x-0.5">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-center font-serif text-display text-charcoal-900 md:text-display-lg">
            Explore Sample Itineraries
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-body-lg text-charcoal-800/60">
            Get inspired by handcrafted journeys designed for the discerning traveler.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((itinerary, i) => (
            <ItineraryCard key={itinerary.slug} itinerary={itinerary} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
