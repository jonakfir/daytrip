"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Send, CheckCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't send your message. Please try again or email hello@daytrip.travel."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setSubmitted(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-cream-50 px-6 md:px-12 lg:px-20 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <Link
          href="/"
          className="font-serif text-heading-lg text-charcoal-900 inline-block mb-12 hover:text-terracotta-500 transition-colors"
        >
          Daytrip
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-serif text-display-lg text-charcoal-900 mb-4">
            Get in Touch
          </h1>
          <p className="font-sans text-body-lg text-charcoal-800/60 max-w-xl mx-auto">
            Have a question, feedback, or partnership idea? We&apos;d love to hear
            from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Contact form */}
          <div className="bg-white rounded-3xl shadow-card p-8">
            <h2 className="font-serif text-heading-lg text-charcoal-900 mb-6">
              Send us a message
            </h2>
            {submitted ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-300/20 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-sage-600" />
                </div>
                <h3 className="font-serif text-heading text-charcoal-900 mb-2">
                  Message received
                </h3>
                <p className="font-sans text-body-sm text-charcoal-800/60 mb-6">
                  We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={handleReset}
                  className="font-sans text-body-sm text-terracotta-500 hover:text-terracotta-600 font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-caption font-sans font-medium text-charcoal-800 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-caption font-sans font-medium text-charcoal-800 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-caption font-sans font-medium text-charcoal-800 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={5}
                    className="w-full px-4 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 resize-none"
                    required
                  />
                </div>
                {error && (
                  <p
                    role="alert"
                    className="text-body-sm font-sans text-terracotta-600 bg-terracotta-500/10 border border-terracotta-500/20 rounded-xl px-4 py-3"
                  >
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-terracotta-500/60 disabled:cursor-not-allowed text-white font-sans font-medium py-3 rounded-xl transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-terracotta-500/10 rounded-xl">
                  <Mail className="w-5 h-5 text-terracotta-500" />
                </div>
                <div>
                  <h3 className="font-serif text-heading text-charcoal-900 mb-1">
                    Email
                  </h3>
                  <p className="font-sans text-body-sm text-charcoal-800/60 mb-2">
                    For general questions and support.
                  </p>
                  <a
                    href="mailto:hello@daytrip.travel"
                    className="font-sans text-body-sm font-medium text-terracotta-500 hover:text-terracotta-600"
                  >
                    hello@daytrip.travel
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sage-300/20 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-serif text-heading text-charcoal-900 mb-1">
                    Partnerships
                  </h3>
                  <p className="font-sans text-body-sm text-charcoal-800/60 mb-2">
                    Hotel, tour, or travel brand? Let&apos;s collaborate.
                  </p>
                  <a
                    href="mailto:partners@daytrip.travel"
                    className="font-sans text-body-sm font-medium text-terracotta-500 hover:text-terracotta-600"
                  >
                    partners@daytrip.travel
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl shadow-card p-8 md:p-10">
          <h2 className="font-serif text-heading-lg text-charcoal-900 mb-6 text-center">
            Frequently Asked
          </h2>
          <div className="space-y-5 max-w-2xl mx-auto">
            <FAQItem
              q="Is Daytrip really AI-powered?"
              a="Yes. Our itineraries are generated by Claude (Anthropic's advanced AI) using real data from Foursquare, Yelp, Amadeus, and Viator."
            />
            <FAQItem
              q="Can I modify my itinerary?"
              a="Every activity has a 'Change' button so you can swap it for an alternative recommendation. More advanced editing is coming soon."
            />
            <FAQItem
              q="Are the booking links real?"
              a="Yes. Flights, hotels, and activities link to real partners (Booking.com, Viator, airlines) where you can complete your reservation."
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-cream-200 pb-5 last:border-b-0 last:pb-0">
      <h4 className="font-serif text-heading text-charcoal-900 mb-2">{q}</h4>
      <p className="font-sans text-body-sm text-charcoal-800/70">{a}</p>
    </div>
  );
}
