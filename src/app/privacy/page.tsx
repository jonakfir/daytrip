import Link from "next/link";

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
        <p className="text-body text-charcoal-800/60 mb-12">Last updated: January 2024</p>

        <div className="font-sans text-body-lg text-charcoal-800 space-y-6">
          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Information We Collect
          </h2>
          <p>
            When you use Daytrip, we collect the destination, travel dates, and preferences you
            provide to generate your itinerary. If you create an account, we store your email
            address and saved trips.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            How We Use Your Information
          </h2>
          <p>
            Your travel preferences are used solely to generate personalized itineraries. We do
            not sell your personal information to third parties. Anonymized, aggregated data may
            be used to improve our recommendation engine.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Third-Party Services
          </h2>
          <p>
            When you click booking links, you are directed to third-party services (such as
            Booking.com, Viator, or airline websites). These services have their own privacy
            policies that govern your interaction with them.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Cookies
          </h2>
          <p>
            We use essential cookies to maintain your session and preferences. We do not use
            tracking cookies or share data with advertising networks.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Data Retention
          </h2>
          <p>
            Generated itineraries are stored to enable sharing via public links. You may request
            deletion of your data at any time by contacting us.
          </p>

          <h2 className="font-serif text-heading-xl text-charcoal-900 mt-8 mb-4">
            Contact
          </h2>
          <p>
            For privacy-related inquiries, please reach out to privacy@daytrip.travel.
          </p>
        </div>
      </article>
    </main>
  );
}
