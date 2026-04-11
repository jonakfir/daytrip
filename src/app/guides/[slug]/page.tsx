import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuideBySlug } from "@/lib/guides";
import { getDestinationBySlug } from "@/lib/destinations";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import {
  articleSchema,
  breadcrumbSchema,
  jsonLdString,
} from "@/lib/schema";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = getGuideBySlug(params.slug);
  if (!g) return {};
  return {
    title: g.metaTitle,
    description: g.metaDescription,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: {
      title: g.metaTitle,
      description: g.metaDescription,
      url: `/guides/${g.slug}`,
      type: "article",
      siteName: SITE_NAME,
      publishedTime: g.publishedDate,
    },
    twitter: {
      card: "summary_large_image",
      title: g.metaTitle,
      description: g.metaDescription,
    },
  };
}

export default function GuidePage({ params }: Props) {
  const g = getGuideBySlug(params.slug);
  if (!g) notFound();

  const url = absoluteUrl(`/guides/${g.slug}`);

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
      { name: g.title, url: `/guides/${g.slug}` },
    ]),
    articleSchema({
      headline: g.title,
      description: g.metaDescription,
      url,
      datePublished: g.publishedDate,
    }),
  ];

  const related = (g.relatedDestinations || [])
    .map((slug) => getDestinationBySlug(slug))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <main className="min-h-screen bg-cream-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(schemas) }}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/90 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl text-terracotta-500 font-semibold"
          >
            Daytrip
          </Link>
          <Link
            href="/guides"
            className="text-body-sm text-charcoal-800/70 hover:text-charcoal-900 transition-colors"
          >
            All guides
          </Link>
        </div>
      </nav>

      <section
        className="pt-32 pb-16 px-6"
        style={{
          background: `linear-gradient(135deg, ${g.gradient[0]} 0%, ${g.gradient[1]} 100%)`,
        }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="font-sans text-caption uppercase tracking-[0.2em] text-white/80 mb-4">
            {g.category} · {g.readMinutes} min read
          </p>
          <h1 className="font-serif text-display-lg text-white mb-6">
            {g.title}
          </h1>
          <p className="font-sans text-body-lg text-white/90">{g.excerpt}</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <p className="font-sans text-body-lg text-charcoal-800 leading-relaxed mb-12">
          {g.intro}
        </p>

        {g.sections.map((section) => (
          <section key={section.heading} className="mb-12">
            <h2 className="font-serif text-heading-xl text-charcoal-900 mb-4">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p
                key={i}
                className="font-sans text-body-lg text-charcoal-800 leading-relaxed mb-4"
              >
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="font-sans text-body text-charcoal-800 space-y-2 mt-4 list-disc pl-6">
                {section.bullets.map((b, i) => (
                  <li key={i} className="leading-relaxed">
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="mt-16 pt-12 border-t border-cream-200">
          <p className="font-sans text-body-lg text-charcoal-800 leading-relaxed italic">
            {g.conclusion}
          </p>
        </div>
      </article>

      {related.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-16">
          <h2 className="font-serif text-heading-xl text-charcoal-900 mb-6">
            Destinations mentioned
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {related.map((d) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group block rounded-xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all"
              >
                <div
                  className="h-20 p-4 flex items-end"
                  style={{
                    background: `linear-gradient(135deg, ${d.gradient[0]} 0%, ${d.gradient[1]} 100%)`,
                  }}
                >
                  <h3 className="font-serif text-body-lg text-white">
                    {d.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-charcoal-900 px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-display text-white mb-4">
            Plan your next trip
          </h2>
          <p className="font-sans text-body-lg text-cream-200/70 mb-8">
            Tell us where you want to go and we'll generate a personalized day-by-day itinerary in seconds.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-terracotta-500 px-8 py-4 font-sans text-body font-medium text-white hover:bg-terracotta-600 transition-colors"
          >
            Start planning
          </Link>
        </div>
      </section>

      <footer className="bg-charcoal-900 text-cream-200/60 py-10 text-center font-sans text-body-sm">
        <p>&copy; {new Date().getFullYear()} {SITE_NAME}.</p>
      </footer>
    </main>
  );
}
