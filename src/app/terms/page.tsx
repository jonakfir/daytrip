import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions for using Daytrip's AI travel itinerary generator, including subscriptions, refunds, and acceptable use.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
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
        <h1 className="font-serif text-display text-charcoal-900 mb-4">Terms of Service</h1>
        <p className="text-body text-charcoal-800/60 mb-12">Last updated: April 2026</p>

        <div className="font-sans text-body-lg text-charcoal-800 space-y-6">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of daytrip-ai.com
            and all related services (the &quot;Service&quot;) provided by Daytrip. By using the Service
            you agree to these Terms. If you do not agree, do not use the Service.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            1. Eligibility and Accounts
          </h2>
          <p>
            You must be at least 13 years old to use the Service. You are responsible for
            maintaining the confidentiality of your account credentials and for all activity
            under your account. Notify us immediately at{" "}
            <a
              className="text-terracotta-500 hover:text-terracotta-600"
              href="mailto:hello@daytrip-ai.com"
            >
              hello@daytrip-ai.com
            </a>{" "}
            if you suspect unauthorized access.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            2. Service Description
          </h2>
          <p>
            Daytrip generates AI-assisted travel itineraries for informational and planning
            purposes. Itineraries are produced by large language models and may contain errors,
            omissions, or outdated information. You are solely responsible for verifying prices,
            availability, operating hours, visa and health requirements, and all other
            travel-critical facts before booking or travelling.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            3. Paid Plans, Credits, and Refunds
          </h2>
          <p>
            Some Service features require payment. Prices are shown before checkout and
            processed by Stripe. Credits are non-transferable and, unless otherwise stated, do
            not expire while your account remains in good standing. Subscriptions renew
            automatically at the selected cadence until cancelled from your account page.
          </p>
          <p>
            We offer a 7-day refund window for one-time credit purchases if you have not used
            the purchased credits. Subscription refunds are handled on a case-by-case basis.
            Email{" "}
            <a
              className="text-terracotta-500 hover:text-terracotta-600"
              href="mailto:hello@daytrip-ai.com"
            >
              hello@daytrip-ai.com
            </a>{" "}
            to request a refund.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            4. Bookings and Third Parties
          </h2>
          <p>
            The Service links to third-party booking providers (e.g., Booking.com, Skyscanner,
            Viator). Daytrip does not process those transactions and is not a party to any
            contract between you and a third-party provider. All bookings are subject to the
            terms, prices, and policies of the relevant provider. Daytrip is not responsible for
            cancellations, price changes, or service failures of third parties.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            5. Affiliate Disclosure
          </h2>
          <p>
            Some outbound links are affiliate links that may earn Daytrip a commission when you
            book. Commissions never increase the price you pay, and our ranking decisions are
            based on fit and quality rather than commission rate.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            6. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>use the Service for unlawful purposes or to infringe anyone&apos;s rights;</li>
            <li>attempt to reverse-engineer, scrape, or overload the Service;</li>
            <li>
              submit prompts designed to elicit harmful, illegal, or sexually explicit content
              involving minors;
            </li>
            <li>resell or relicense the Service without our written permission.</li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these Terms or put the Service at
            risk.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            7. User Content
          </h2>
          <p>
            You retain ownership of the trip preferences and messages you submit. By generating
            or sharing an itinerary you grant Daytrip a worldwide, royalty-free licence to host,
            display, and deliver that content via the Service. Shared itineraries can be deleted
            from your account at any time.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            8. Disclaimers and Limitation of Liability
          </h2>
          <p>
            The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum
            extent permitted by law, Daytrip disclaims all warranties, express or implied,
            including merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            To the fullest extent permitted by law, Daytrip&apos;s aggregate liability for any
            claim arising out of or relating to the Service is limited to the greater of (a) the
            amount you paid Daytrip in the 12 months preceding the claim or (b) USD 100. In no
            event are we liable for indirect, incidental, special, consequential, or punitive
            damages, including lost trips, missed connections, or booking losses.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            9. Indemnification
          </h2>
          <p>
            You agree to indemnify and hold Daytrip harmless from claims arising from your
            misuse of the Service, your violation of these Terms, or your violation of any
            third-party right.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            10. Governing Law and Disputes
          </h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard
            to its conflict-of-laws rules. You and Daytrip agree to resolve disputes in the
            state or federal courts located in Delaware, except where applicable consumer
            protection law gives you the right to sue in your home jurisdiction.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            11. Changes to These Terms
          </h2>
          <p>
            We may update these Terms as the Service evolves. We will post the updated version
            here and, for material changes, notify you by email or in-app notice. Continued use
            after the effective date of a change constitutes acceptance.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            12. Contact
          </h2>
          <p>
            Questions about these Terms? Email{" "}
            <a
              className="text-terracotta-500 hover:text-terracotta-600"
              href="mailto:hello@daytrip-ai.com"
            >
              hello@daytrip-ai.com
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
