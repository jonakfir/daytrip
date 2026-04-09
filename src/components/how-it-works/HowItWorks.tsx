"use client";

import { Compass, Sparkles, PlaneTakeoff } from "lucide-react";
import { motion } from "framer-motion";

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

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24 px-6 md:px-12 lg:px-20 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-sage-400/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-5xl relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-center font-serif text-display text-charcoal-900 md:text-display-lg">
            How Daytrip Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-body-lg text-charcoal-800/60">
            Three simple steps to your next unforgettable journey.
          </p>
        </motion.div>

        <div className="relative mt-20">
          {/* Connecting line — animated */}
          <motion.div
            className="absolute left-1/2 top-12 hidden h-0.5 w-[calc(100%-12rem)] -translate-x-1/2 origin-left md:block"
            variants={lineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="h-full w-full bg-gradient-to-r from-sage-300 via-sage-400 to-sage-300" />
          </motion.div>

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  custom={i}
                  variants={stepVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-sans text-caption font-medium text-terracotta-400">
                    Step {i + 1}
                  </span>

                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-cream-100 ring-4 ring-white shadow-card transition-all duration-500 group-hover:shadow-card-hover group-hover:scale-105">
                    <Icon size={32} strokeWidth={1.5} className="text-terracotta-500 transition-transform duration-300 group-hover:scale-110" />
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
