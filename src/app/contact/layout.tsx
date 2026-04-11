import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Daytrip",
  description:
    "Get in touch with the Daytrip team. Questions about AI trip planning, feedback, partnerships, or press — we'd love to hear from you.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Daytrip",
    description: "Reach out to the Daytrip team.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
