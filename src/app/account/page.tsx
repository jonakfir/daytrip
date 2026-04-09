"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Mail, Shield, User as UserIcon } from "lucide-react";

interface Me {
  authenticated: boolean;
  email: string | null;
  role: string | null;
  isAdmin: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j));
  }, []);

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
