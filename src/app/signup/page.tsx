"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) {
        setError(j.error || "Signup failed");
        setLoading(false);
        return;
      }
      // Redirect based on role
      if (j.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block font-serif text-display text-charcoal-900"
            aria-label="Daytrip home"
          >
            Daytrip
          </Link>
          <h1 className="mt-2 font-serif text-heading-lg text-charcoal-900">
            Create your free account
          </h1>
          <p className="mt-1 font-sans text-body-sm text-charcoal-800/50">
            Plan, save, and share AI-generated itineraries
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-8">
          <form
            onSubmit={handleSubmit}
            method="post"
            action="/api/auth/signup"
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="signup-name"
                className="block text-caption font-sans font-medium text-charcoal-800 mb-2"
              >
                Full name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30" />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Traveler"
                  className="w-full pl-10 pr-4 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-caption font-sans font-medium text-charcoal-800 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-caption font-sans font-medium text-charcoal-800 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30" />
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-800/40 hover:text-charcoal-800"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-caption font-sans text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white font-sans font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-caption font-sans text-center text-charcoal-800/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-terracotta-500 hover:text-terracotta-600 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-caption font-sans text-charcoal-800/50 hover:text-terracotta-500 transition-colors"
          >
            ← Back to Daytrip
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
