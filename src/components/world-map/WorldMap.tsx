"use client";

import { motion } from "framer-motion";
import Globe3D from "@/components/globe/Globe3D";

export default function WorldMap() {
  return (
    <section className="bg-white py-24 px-6 md:px-12 lg:px-20 overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-terracotta-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-sage-400/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-center font-serif text-display text-charcoal-900 md:text-display-lg">
            Where Will You Go Next?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-body-lg text-charcoal-800/60">
            Discover destinations loved by our travelers worldwide.
          </p>
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <Globe3D />
        </motion.div>
      </div>
    </section>
  );
}
