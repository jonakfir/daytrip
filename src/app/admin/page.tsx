"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { authenticated, isAdmin, email, login, logout, loading } = useAuth();
  const [formEmail, setFormEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(formEmail, password);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Invalid credentials");
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Already logged in as admin
  if (authenticated && isAdmin) {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-elevated p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-sage-500/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-sage-600" />
            </div>
            <h1 className="font-serif text-heading-xl text-charcoal-900 mb-2">
              Admin Access
            </h1>
            <p className="text-body text-charcoal-800/60 mb-2">
              Logged in as
            </p>
            <p className="text-body font-medium text-terracotta-500 mb-8">
              {email}
            </p>
            <p className="text-body-sm text-sage-600 bg-sage-500/10 rounded-xl px-4 py-3 mb-6">
              ✓ You have unlimited access to all features — no payment required.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 px-6 py-3 bg-terracotta-500 text-white rounded-xl font-sans font-medium hover:bg-terracotta-600 transition-colors"
              >
                Go to Daytrip
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-3 border border-cream-300 rounded-xl text-charcoal-800/60 hover:border-red-300 hover:text-red-500 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  // Login form
  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-display text-charcoal-900 mb-2">
            Daytrip
          </h1>
          <p className="text-body text-charcoal-800/50">Admin Login</p>
        </div>

        <div className="bg-white rounded-3xl shadow-elevated p-8">
          <div className="w-14 h-14 rounded-full bg-terracotta-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-terracotta-500" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-800/30" />
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="Admin email"
                required
                className="w-full bg-cream-50 rounded-xl pl-12 pr-4 py-3.5 text-body text-charcoal-900
                  placeholder:text-charcoal-800/30 focus:outline-none focus:ring-2
                  focus:ring-terracotta-500/40 focus:bg-white transition-all duration-300"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-800/30" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-cream-50 rounded-xl pl-12 pr-12 py-3.5 text-body text-charcoal-900
                  placeholder:text-charcoal-800/30 focus:outline-none focus:ring-2
                  focus:ring-terracotta-500/40 focus:bg-white transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-800/30 hover:text-charcoal-800/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-body-sm text-red-500 text-center bg-red-50 rounded-lg px-4 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-terracotta-500 text-white rounded-xl font-sans font-medium
                hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-caption text-charcoal-800/40 mt-6">
            This area is for site administrators only.
          </p>
        </div>

        <p className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-body-sm text-terracotta-500 hover:underline"
          >
            ← Back to Daytrip
          </button>
        </p>
      </motion.div>
    </main>
  );
}
