import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <Link
          href="/"
          className="inline-block font-serif text-display text-charcoal-900"
        >
          Daytrip
        </Link>

        <p className="mt-10 font-sans text-caption tracking-widest uppercase text-terracotta-500">
          404
        </p>
        <h1 className="mt-3 font-serif text-heading-xl text-charcoal-900">
          This page wandered off the map.
        </h1>
        <p className="mt-4 font-sans text-body text-charcoal-800/70">
          The page you are looking for was moved, renamed, or never existed.
          Let&apos;s get you back to planning.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white font-sans font-medium px-6 py-3 transition-colors"
          >
            Plan a new trip
          </Link>
          <Link
            href="/destinations"
            className="rounded-full border border-charcoal-900/10 hover:border-terracotta-500 hover:text-terracotta-500 text-charcoal-800 font-sans font-medium px-6 py-3 transition-colors"
          >
            Browse destinations
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-caption font-sans">
          {[
            { href: "/destinations/paris", label: "Paris" },
            { href: "/destinations/tokyo", label: "Tokyo" },
            { href: "/destinations/rome", label: "Rome" },
            { href: "/trip/demo", label: "Sample trip" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg bg-cream-200/60 hover:bg-cream-200 text-charcoal-800/80 hover:text-charcoal-900 py-2 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
