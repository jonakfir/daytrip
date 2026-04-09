"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { Shield, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Sample trips", href: "#samples" },
  { label: "Pricing", href: "/pricing" },
];

interface AuthState {
  authenticated: boolean;
  isAdmin: boolean;
  email: string | null;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    isAdmin: false,
    email: null,
  });
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) =>
        setAuth({
          authenticated: !!j.authenticated,
          isAdmin: !!j.isAdmin,
          email: j.email || null,
        })
      )
      .catch(() => {});
  }, []);

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const id = href.slice(1);
    if (window.location.pathname !== "/") {
      window.location.href = `/${href}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-cream-100/95 backdrop-blur-md shadow-card"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        <Link href="/" className="flex items-center">
          <span className="font-serif text-heading-lg tracking-tight text-charcoal-900 transition-colors duration-300 hover:text-terracotta-500">
            Daytrip
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) =>
                  link.href.startsWith("#")
                    ? handleAnchorClick(e, link.href)
                    : undefined
                }
                className="font-sans text-body-sm font-medium text-charcoal-800/70 transition-colors duration-300 hover:text-charcoal-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          {auth.authenticated ? (
            <div className="flex items-center gap-3">
              {auth.isAdmin && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-terracotta-500/30 bg-terracotta-500/10 px-3 py-1.5 font-sans text-caption font-medium text-terracotta-600 transition-colors hover:bg-terracotta-500/20"
                >
                  <Shield className="w-3 h-3" />
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-cream-200/60 px-3 py-1.5 font-sans text-caption font-medium text-charcoal-800/80 transition-colors hover:bg-cream-200"
              >
                <UserIcon className="w-3 h-3" />
                {auth.email?.split("@")[0] || "Account"}
              </Link>
              <button
                onClick={() => {
                  const el = document.getElementById("plan");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  else window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-full bg-terracotta-500 px-5 py-2 font-sans text-body-sm font-medium text-white transition-colors hover:bg-terracotta-600"
              >
                Plan a trip
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block font-sans text-body-sm font-medium text-charcoal-800/70 transition-colors duration-300 hover:text-charcoal-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-terracotta-500 px-5 py-2 font-sans text-body-sm font-medium text-white transition-colors hover:bg-terracotta-600"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
