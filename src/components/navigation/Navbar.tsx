"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Sample trips", href: "#samples" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "bg-cream-100/95 backdrop-blur-md shadow-card" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span
            className={cn(
              "font-serif text-heading-lg tracking-tight transition-colors duration-300",
              scrolled ? "text-charcoal-900" : "text-charcoal-900"
            )}
          >
            Daytrip
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-8">
          {/* Links */}
          <div className="hidden items-center gap-6 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "font-sans text-body-sm font-medium transition-colors duration-300",
                  scrolled
                    ? "text-charcoal-800/70 hover:text-charcoal-900"
                    : "text-charcoal-800/70 hover:text-charcoal-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              if (window.location.pathname === "/") {
                // Already on homepage — scroll to search section
                const el = document.getElementById("plan");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              } else {
                // Navigate to homepage
                window.location.href = "/#plan";
              }
            }}
            className="rounded-full bg-terracotta-500 px-5 py-2 font-sans text-body-sm font-medium text-white transition-colors hover:bg-terracotta-600"
          >
            Plan a trip
          </button>
        </div>
      </nav>
    </motion.header>
  );
}
