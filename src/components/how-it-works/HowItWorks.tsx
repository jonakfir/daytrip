"use client";

import { motion } from "framer-motion";
import { Compass, Sparkles, PlaneTakeoff } from "lucide-react";

const steps = [
  {
    icon: Compass,
    title: "Tell us your dream",
    description:
      "Enter your destination, dates, and travel style. Our AI understands your preferences.",
  },
  {
    icon: Sparkles,
    title: "We craft your journey",
    description:
      "Our AI researches real places, restaurants, and experiences to build your perfect itinerary.",
  },
  {
    icon: PlaneTakeoff,
    title: "Book and go",
    description:
      "Review your personalized plan, book flights and hotels through our partners, and start your adventure.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-white py-24 px-6 md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-serif text-display text-charcoal-900 md:text-display-lg">
          How Daytrip Works
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-body-lg text-charcoal-800/60">
          Three simple steps to your next unforgettable journey.
        </p>

        <div className="relative mt-20">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-12 hidden h-0.5 w-[calc(100%-12rem)] -translate-x-1/2 md:block">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
              className="h-full w-full origin-left bg-gradient-to-r from-sage-300 via-sage-400 to-sage-300"
            />
          </div>

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.6,
                    delay: 0.2 + i * 0.2,
                    ease: "easeOut",
                  }}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Step number */}
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-sans text-caption font-medium text-terracotta-400">
                    Step {i + 1}
                  </span>

                  {/* Icon circle */}
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-cream-100 ring-4 ring-white shadow-card">
                    <Icon
                      size={32}
                      strokeWidth={1.5}
                      className="text-terracotta-500"
                    />
                  </div>

                  <h3 className="mt-6 font-serif text-heading text-charcoal-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xs font-sans text-body text-charcoal-800/60">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
