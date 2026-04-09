"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const productLinks = [
  { label: "Plan a Trip", href: "/#plan" },
  { label: "Pricing", href: "/pricing" },
  { label: "Sample Trips", href: "/trip/demo" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {/* Logo */}
          <motion.div custom={0} variants={fadeIn} className="col-span-2 md:col-span-1">
            <span className="font-serif text-heading-lg text-cream-100 tracking-tight">
              Daytrip
            </span>
            <p className="mt-3 max-w-xs font-sans text-body-sm text-cream-200/50">
              AI-powered travel itineraries that read like a luxury magazine. Plan your perfect trip in seconds.
            </p>
          </motion.div>

          {/* Product */}
          <motion.div custom={1} variants={fadeIn}>
            <h4 className="font-sans text-caption uppercase tracking-[0.15em] text-cream-200/40 mb-4">
              Product
            </h4>
            <nav className="flex flex-col gap-3">
              {productLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-sans text-body-sm text-cream-200/60 transition-colors duration-300 hover:text-cream-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Company */}
          <motion.div custom={2} variants={fadeIn}>
            <h4 className="font-sans text-caption uppercase tracking-[0.15em] text-cream-200/40 mb-4">
              Company
            </h4>
            <nav className="flex flex-col gap-3">
              {companyLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-sans text-body-sm text-cream-200/60 transition-colors duration-300 hover:text-cream-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Legal */}
          <motion.div custom={3} variants={fadeIn}>
            <h4 className="font-sans text-caption uppercase tracking-[0.15em] text-cream-200/40 mb-4">
              Legal
            </h4>
            <nav className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-sans text-body-sm text-cream-200/60 transition-colors duration-300 hover:text-cream-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="mt-12 h-px w-full bg-cream-200/10"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "left" }}
        />

        {/* Copyright */}
        <motion.p
          className="mt-6 text-center font-sans text-caption text-cream-200/40"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          &copy; {new Date().getFullYear()} Daytrip. All rights reserved.
        </motion.p>
      </div>
    </footer>
  );
}
