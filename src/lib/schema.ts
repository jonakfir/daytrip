/**
 * JSON-LD schema.org builders.
 *
 * Each function returns a plain object that should be serialized into a
 * <script type="application/ld+json"> tag. Use the <JsonLd> helper component
 * defined alongside this module's consumers, or render directly with
 * dangerouslySetInnerHTML.
 */

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "./seo";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    description: SITE_DESCRIPTION,
    sameAs: [
      "https://www.instagram.com/daytripapp",
      "https://www.tiktok.com/@daytripapp",
      "https://twitter.com/daytripapp",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/destinations?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : absoluteUrl(item.url),
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function touristDestinationSchema(opts: {
  name: string;
  description: string;
  url: string;
  image?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  touristType?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: opts.name,
    description: opts.description,
    url: opts.url.startsWith("http") ? opts.url : absoluteUrl(opts.url),
    image: opts.image,
    touristType: opts.touristType,
    address: {
      "@type": "PostalAddress",
      addressCountry: opts.country,
    },
    ...(opts.latitude && opts.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: opts.latitude,
            longitude: opts.longitude,
          },
        }
      : {}),
  };
}

export function touristTripSchema(opts: {
  name: string;
  description: string;
  url: string;
  destinationName: string;
  country: string;
  durationDays: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: opts.name,
    description: opts.description,
    url: opts.url.startsWith("http") ? opts.url : absoluteUrl(opts.url),
    itinerary: {
      "@type": "ItemList",
      numberOfItems: opts.durationDays,
    },
    touristType: ["Leisure", "Independent traveler"],
    subjectOf: {
      "@type": "Place",
      name: opts.destinationName,
      address: {
        "@type": "PostalAddress",
        addressCountry: opts.country,
      },
    },
  };
}

export function articleSchema(opts: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: opts.url.startsWith("http") ? opts.url : absoluteUrl(opts.url),
    image: opts.image,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.svg"),
      },
    },
  };
}

/**
 * Render JSON-LD as a string suitable for dangerouslySetInnerHTML.
 * Multiple schemas can be combined into a single @graph.
 */
export function jsonLdString(schema: object | object[]): string {
  if (Array.isArray(schema)) {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": schema.map(({ ["@context"]: _ctx, ...rest }: any) => rest),
    });
  }
  return JSON.stringify(schema);
}
