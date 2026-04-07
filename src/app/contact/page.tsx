"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API endpoint
    setSubmitted(true);
  };

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

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="font-serif text-display text-charcoal-900 mb-4">Get in Touch</h1>
          <p className="text-body-lg text-charcoal-800/60 max-w-xl mx-auto">
            Have a question, feedback, or partnership inquiry? We would love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Contact info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-terracotta-500/10 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-terracotta-500" />
              </div>
              <div>
                <h3 className="font-serif text-heading text-charcoal-900 mb-1">Email</h3>
                <p className="text-body text-charcoal-800/60">hello@daytrip.travel</p>
                <p className="text-body-sm text-charcoal-800/40 mt-1">We respond within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sage-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-sage-600" />
              </div>
              <div>
                <h3 className="font-serif text-heading text-charcoal-900 mb-1">Partnerships</h3>
                <p className="text-body text-charcoal-800/60">partners@daytrip.travel</p>
                <p className="text-body-sm text-charcoal-800/40 mt-1">For affiliate and business inquiries</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-cream-200/50 rounded-2xl">
              <h3 className="font-serif text-heading text-charcoal-900 mb-2">FAQ</h3>
              <div className="space-y-4 text-body-sm text-charcoal-800/70 font-sans">
                <div>
                  <p className="font-medium text-charcoal-900 mb-1">Is Daytrip really AI-powered?</p>
                  <p>Yes! We use advanced AI to research real destinations, restaurants, and attractions to create personalized itineraries.</p>
                </div>
                <div>
                  <p className="font-medium text-charcoal-900 mb-1">Can I modify my itinerary?</p>
                  <p>Absolutely. Each activity has a &quot;Change&quot; button that swaps it for an alternative suggestion.</p>
                </div>
                <div>
                  <p className="font-medium text-charcoal-900 mb-1">Are the booking links real?</p>
                  <p>Yes. We partner with Booking.com, Viator, and airline booking platforms so you can book directly.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {submitted ? (
              <div className="bg-white rounded-3xl shadow-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-sage-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-sage-600" />
                </div>
                <h2 className="font-serif text-heading-xl text-charcoal-900 mb-3">Message Sent!</h2>
                <p className="text-body text-charcoal-800/60 mb-6">
                  Thank you for reaching out. We will get back to you soon.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); }}
                  className="text-body-sm text-terracotta-500 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-card p-8 space-y-5">
                <div>
                  <label htmlFor="name" className="block text-body-sm font-medium text-charcoal-900 mb-2 font-sans">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-cream-50 rounded-xl px-4 py-3 text-body text-charcoal-900
                      placeholder:text-charcoal-800/30 focus:outline-none focus:ring-2
                      focus:ring-terracotta-500/40 focus:bg-white transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-body-sm font-medium text-charcoal-900 mb-2 font-sans">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-cream-50 rounded-xl px-4 py-3 text-body text-charcoal-900
                      placeholder:text-charcoal-800/30 focus:outline-none focus:ring-2
                      focus:ring-terracotta-500/40 focus:bg-white transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-body-sm font-medium text-charcoal-900 mb-2 font-sans">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="w-full bg-cream-50 rounded-xl px-4 py-3 text-body text-charcoal-900
                      placeholder:text-charcoal-800/30 focus:outline-none focus:ring-2
                      focus:ring-terracotta-500/40 focus:bg-white transition-all resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-terracotta-500 text-white rounded-xl font-sans font-medium hover:bg-terracotta-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
