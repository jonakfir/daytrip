"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { Menu, Map as MapIcon, Shield, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { label: "Destinations", href: "/destinations" },
  { label: "Guides", href: "/guides" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];
const nativeNavLinks = navLinks.filter((l) => l.href !== "/pricing");

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { authenticated, isAdmin, email } = useAuth();
  const auth = { authenticated, isAdmin, email };
  const { scrollY } = useScroll();
  const isNative = useIsNativeApp();
  const visibleLinks = isNative ? nativeNavLinks : navLinks;

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

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
      style={{ paddingTop: "env(safe-area-inset-top)" }}
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
          <div className="hidden items-center gap-5 lg:flex">
            {visibleLinks.map((link) => (
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
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-terracotta-500/30 bg-terracotta-500/10 px-4 py-2.5 font-sans text-caption font-medium text-terracotta-600 transition-colors hover:bg-terracotta-500/20 min-h-[44px]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
              <Link
                href="/trips"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-cream-200/60 px-4 py-2.5 font-sans text-caption font-medium text-charcoal-800/80 transition-colors hover:bg-cream-200 min-h-[44px]"
              >
                <MapIcon className="w-3.5 h-3.5" />
                My trips
              </Link>
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-cream-200/60 px-4 py-2.5 font-sans text-caption font-medium text-charcoal-800/80 transition-colors hover:bg-cream-200 min-h-[44px]"
              >
                <UserIcon className="w-3.5 h-3.5" />
                {auth.email?.split("@")[0] || "Account"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("plan");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  else window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-full bg-terracotta-500 px-5 py-2.5 font-sans text-body-sm font-medium text-white transition-colors hover:bg-terracotta-600 min-h-[44px]"
              >
                Plan a trip
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:flex items-center px-3 py-2.5 font-sans text-body-sm font-medium text-charcoal-800/70 transition-colors duration-300 hover:text-charcoal-900 min-h-[44px]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden sm:flex items-center rounded-full bg-terracotta-500 px-5 py-2.5 font-sans text-body-sm font-medium text-white transition-colors hover:bg-terracotta-600 min-h-[44px]"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile hamburger — shown only when desktop nav is hidden */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            className="lg:hidden -mr-1 rounded-full p-2.5 text-charcoal-900 hover:bg-cream-200/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {/* Mobile drawer — always mounted. Inline transform/opacity avoids
          any conflict with framer-motion on the parent <motion.header>. */}
      <div
        className="lg:hidden"
        aria-hidden={!mobileOpen}
        style={{
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      >
        <div
          className="fixed inset-0 z-[60] bg-charcoal-900/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          style={{
            opacity: mobileOpen ? 1 : 0,
            transition: "opacity 200ms ease-out",
          }}
        />
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className="fixed right-0 top-0 z-[61] h-full w-[85%] max-w-sm bg-cream-100 shadow-elevated flex flex-col"
          style={{
            transform: mobileOpen ? "translate3d(0,0,0)" : "translate3d(100%,0,0)",
            transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
        >
              <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
                <span className="font-serif text-heading-lg text-charcoal-900">
                  Daytrip
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-2 text-charcoal-900 hover:bg-cream-200/60 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex flex-col px-6 py-6 gap-1">
                {visibleLinks.map((link) => {
                  const isHash = link.href.startsWith("#");
                  if (isHash) {
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={(e) => {
                          setMobileOpen(false);
                          handleAnchorClick(e, link.href);
                        }}
                        className="font-serif text-heading text-charcoal-900 py-3 border-b border-cream-200/60 hover:text-terracotta-500 transition-colors"
                      >
                        {link.label}
                      </a>
                    );
                  }
                  // Real route changes: use next/link for client-side nav so
                  // the drawer unmounts with the page. No onClick → no race.
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="font-serif text-heading text-charcoal-900 py-3 border-b border-cream-200/60 hover:text-terracotta-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto px-6 pb-8 pt-6 border-t border-cream-200 flex flex-col gap-3">
                {auth.authenticated ? (
                  <>
                    {auth.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 rounded-full border border-terracotta-500/30 bg-terracotta-500/10 px-4 py-3 font-sans text-body-sm font-medium text-terracotta-600"
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/trips"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-full bg-cream-200 px-4 py-3 font-sans text-body-sm font-medium text-charcoal-800"
                    >
                      <MapIcon className="w-4 h-4" />
                      My trips
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-full bg-cream-200 px-4 py-3 font-sans text-body-sm font-medium text-charcoal-800"
                    >
                      <UserIcon className="w-4 h-4" />
                      {auth.email?.split("@")[0] || "Account"}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-full border border-charcoal-900/10 px-4 py-3 text-center font-sans text-body-sm font-medium text-charcoal-800"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-full bg-terracotta-500 px-4 py-3 text-center font-sans text-body-sm font-medium text-white hover:bg-terracotta-600 transition-colors"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
        </div>
      </div>
    </motion.header>
  );
}
