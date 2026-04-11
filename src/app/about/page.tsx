import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Daytrip — AI-Powered Travel Itineraries",
  description:
    "Daytrip uses AI to create personalized, day-by-day travel itineraries that read like luxury travel magazines. Learn our mission, how it works, and why we exist.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-cream-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/90 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl text-terracotta-500 font-semibold">
            Daytrip
          </Link>
          <Link href="/" className="text-body-sm text-charcoal-800 hover:text-terracotta-500 transition-colors">
            Back to home
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <h1 className="font-serif text-display text-charcoal-900 mb-8">About Daytrip</h1>

        <div className="prose font-sans text-body-lg text-charcoal-800 space-y-6">
          <p>
            Daytrip was born from a simple frustration: planning a trip should feel like the
            beginning of an adventure, not a chore. We believe that every journey deserves a
            beautifully crafted plan — one that captures the spirit of a destination and guides
            you through its hidden gems.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-12 mb-4">
            Our Mission
          </h2>
          <p>
            We use artificial intelligence to create personalized, day-by-day travel itineraries
            that read like pages from a luxury travel magazine. Each plan is tailored to your
            style, whether you crave adventure, culture, relaxation, or culinary exploration.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-12 mb-4">
            How It Works
          </h2>
          <p>
            Tell us where you want to go, when, and how you like to travel. Our AI researches
            real destinations, restaurants, attractions, and experiences — then weaves them into
            a coherent, beautiful itinerary. We partner with trusted booking platforms so you
            can reserve flights, hotels, and activities directly from your plan.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-12 mb-4">
            Simple Pricing
          </h2>
          <p>
            Daytrip offers flexible plans to fit every traveler. From single-trip passes to
            unlimited yearly access, there is an option for everyone. We also earn a small
            commission when you book through our affiliate partners — at no extra cost to you.
            This means our incentives are aligned: we succeed when your trip is unforgettable.
          </p>
        </div>
      </article>
    </main>
  );
}
