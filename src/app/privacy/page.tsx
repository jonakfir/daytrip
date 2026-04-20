import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Daytrip collects, uses, and protects your personal information when you plan trips with our AI travel itinerary generator.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
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
        <h1 className="font-serif text-display text-charcoal-900 mb-4">Privacy Policy</h1>
        <p className="text-body text-charcoal-800/60 mb-12">Last updated: April 2026</p>

        <div className="font-sans text-body-lg text-charcoal-800 space-y-6">
          <p>
            This Privacy Policy explains how Daytrip (&quot;Daytrip&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses,
            shares, and protects information when you use daytrip-ai.com and related services
            (the &quot;Service&quot;). By using the Service, you agree to the practices described here.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Information We Collect
          </h2>
          <p>
            <strong>Information you provide.</strong> When you plan a trip, you submit a
            destination, travel dates, number of travelers, travel style, budget range, and
            (optionally) your departure city. When you create an account, we collect your email
            address, a hashed password, and your full name. When you contact us, we collect the
            name, email, and message content you submit.
          </p>
          <p>
            <strong>Information we collect automatically.</strong> We log basic request metadata
            (IP address, user agent, timestamps, request path, response status) for security,
            fraud prevention, abuse mitigation, and service debugging. We also store session
            cookies to keep you signed in.
          </p>
          <p>
            <strong>Payment information.</strong> If you purchase credits or a subscription,
            payment details are collected and processed by Stripe. Daytrip never stores your full
            card number; we store a Stripe customer ID and the metadata Stripe returns about your
            subscription status.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            How We Use Your Information
          </h2>
          <p>
            We use your travel preferences to generate personalized itineraries using third-party
            large language models (currently Anthropic&apos;s Claude). We use your email to
            authenticate you, send transactional messages (receipts, password resets), and — only
            if you opt in — occasional product updates. We use aggregated, de-identified data to
            improve our recommendations and detect abuse. We do not sell your personal
            information.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Third-Party Services
          </h2>
          <p>
            We share the minimum data necessary with the following processors: Anthropic (trip
            inputs sent to Claude for generation), Stripe (payment processing), Supabase and
            Vercel Postgres (data storage and hosting), and travel partners such as Booking.com,
            Skyscanner, and Viator (only when you click outbound booking links). Each of these
            services is bound by its own privacy policy.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Cookies and Tracking
          </h2>
          <p>
            We use first-party session cookies to keep you authenticated and to remember your
            workspace preferences. We do not use third-party advertising cookies and do not track
            you across other websites. You can clear cookies at any time; doing so will sign you
            out of the Service.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Data Retention and Deletion
          </h2>
          <p>
            Generated itineraries are stored indefinitely so that shared links remain accessible.
            Account data is retained while your account is active. You can delete your account
            and all associated data from your account settings page, or by emailing{" "}
            <a
              className="text-terracotta-500 hover:text-terracotta-600"
              href="mailto:privacy@daytrip-ai.com"
            >
              privacy@daytrip-ai.com
            </a>
            . We will complete deletion within 30 days, except where we are required to retain
            information for legal or accounting reasons (e.g., payment records).
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Your Rights
          </h2>
          <p>
            Depending on where you live, you may have the right to access, correct, port, or
            delete the personal information we hold about you, and to object to or restrict
            certain processing. To exercise these rights, email{" "}
            <a
              className="text-terracotta-500 hover:text-terracotta-600"
              href="mailto:privacy@daytrip-ai.com"
            >
              privacy@daytrip-ai.com
            </a>
            . We may request information to verify your identity before fulfilling the request.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Children
          </h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect
            personal information from children under 13. If you believe a child has provided us
            with personal information, contact us and we will delete it.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Security
          </h2>
          <p>
            We use industry-standard safeguards: TLS for data in transit, bcrypt-hashed
            passwords, role-based access controls, and periodic access review. No system is
            perfectly secure, but we work to maintain appropriate protections and will notify
            affected users of any breach involving personal information as required by law.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy as the Service evolves. Material changes will be
            announced via the Service or email. The &quot;Last updated&quot; date at the top of this page
            reflects the most recent revision.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Contact
          </h2>
          <p>
            For privacy-related questions or requests, contact{" "}
            <a
              className="text-terracotta-500 hover:text-terracotta-600"
              href="mailto:privacy@daytrip-ai.com"
            >
              privacy@daytrip-ai.com
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
