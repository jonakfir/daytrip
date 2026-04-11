"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  Mail,
  Shield,
  User as UserIcon,
  Ticket,
  Plus,
  Loader2,
} from "lucide-react";

interface Me {
  authenticated: boolean;
  email: string | null;
  role: string | null;
  isAdmin: boolean;
}

interface Credits {
  authenticated: boolean;
  credits: number; // -1 = unlimited
  isAdmin: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j))
      .catch(() => setMe({ authenticated: false, email: null, role: null, isAdmin: false }));
    // /api/me/credits returns 401 for unauthenticated; only store the body
    // when the response is 2xx so we don't pollute `credits` state with an
    // {error:"Unauthorized"} object that breaks the render below.
    fetch("/api/me/credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setCredits(j))
      .catch(() => setCredits(null));
  }, []);

  const buyTrip = async () => {
    setBuying(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/account" }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.message ?? data?.error ?? "Checkout failed");
        setBuying(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Checkout failed");
      setBuying(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (me === null) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-charcoal-800/40 font-sans">Loading…</div>
      </div>
    );
  }

  if (!me.authenticated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-serif text-display text-charcoal-900 mb-4">
            You need to be logged in
          </h1>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="rounded-full bg-terracotta-500 px-5 py-2 font-sans text-body-sm font-medium text-white hover:bg-terracotta-600"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-charcoal-800/20 px-5 py-2 font-sans text-body-sm font-medium text-charcoal-900 hover:bg-cream-200"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 px-6 md:px-12 lg:px-20 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <Link
          href="/"
          className="font-serif text-heading-lg text-charcoal-900 inline-block mb-8"
        >
          Daytrip
        </Link>

        <div className="bg-white rounded-3xl shadow-card p-8 md:p-10">
          <h1 className="font-serif text-display text-charcoal-900 mb-2">
            Your account
          </h1>
          <p className="font-sans text-body text-charcoal-800/60 mb-8">
            Manage your Daytrip profile and settings.
          </p>

          <div className="space-y-5 mb-8">
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={me.email || "—"} />
            <InfoRow
              icon={<UserIcon className="w-4 h-4" />}
              label="Role"
              value={me.role || "user"}
            />
          </div>

          {/* Credits card */}
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-terracotta-500/10 to-sage-300/10 border border-cream-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-terracotta-500 text-white">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-sans text-caption text-charcoal-800/50 uppercase tracking-wider">
                    Trip credits
                  </div>
                  <div className="font-serif text-heading-lg text-charcoal-900 mt-0.5">
                    {credits === null
                      ? "—"
                      : credits.isAdmin
                      ? "Unlimited"
                      : `${credits.credits} credit${
                          credits.credits === 1 ? "" : "s"
                        }`}
                  </div>
                </div>
              </div>
              {credits && !credits.isAdmin && (
                <button
                  onClick={buyTrip}
                  disabled={buying}
                  className="flex items-center gap-1.5 rounded-full bg-terracotta-500 px-4 py-2 font-sans text-caption font-medium text-white hover:bg-terracotta-600 disabled:opacity-50 transition-colors"
                >
                  {buying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Buy 1 trip — $3
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-6 border-t border-cream-200">
            {me.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-full bg-terracotta-500 px-5 py-2.5 font-sans text-body-sm font-medium text-white hover:bg-terracotta-600"
              >
                <Shield className="w-4 h-4" />
                Admin dashboard
              </Link>
            )}
            <Link
              href="/"
              className="rounded-full border border-charcoal-800/20 px-5 py-2.5 font-sans text-body-sm font-medium text-charcoal-900 hover:bg-cream-100"
            >
              Plan a trip
            </Link>
            <button
              onClick={handleLogout}
              className="ml-auto flex items-center gap-2 rounded-full px-5 py-2.5 font-sans text-body-sm font-medium text-charcoal-800/60 hover:text-terracotta-500"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-cream-200">
      <div className="p-2 rounded-lg bg-cream-100 text-charcoal-800/60">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-sans text-caption text-charcoal-800/50 uppercase tracking-wide">
          {label}
        </div>
        <div className="font-sans text-body text-charcoal-900 mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}
