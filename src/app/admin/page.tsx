"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Users,
  DollarSign,
  TrendingUp,
  Shield,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  totalPaidCents: number;
  plan: string | null;
  createdAt: string;
}

interface DashboardData {
  users: User[];
  totalRevenue: number;
  totalUsers: number;
  configured: boolean;
  message?: string;
}

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard data
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const checkAuth = async () => {
    try {
      const r = await fetch("/api/auth/me");
      const j = await r.json();
      if (j.authenticated && j.isAdmin) {
        setIsAdmin(true);
        setCurrentEmail(j.email);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
    setAuthChecked(true);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loadDashboard = async () => {
    setLoadingData(true);
    try {
      const r = await fetch("/api/admin/users");
      const j = await r.json();
      setData(j);
    } catch {
      setData(null);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) loadDashboard();
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) {
        setLoginError(j.error || "Login failed");
      } else if (j.role !== "admin") {
        setLoginError("This area is for site administrators only.");
      } else {
        setIsAdmin(true);
        setCurrentEmail(j.email);
      }
    } catch {
      setLoginError("Network error. Please try again.");
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    setCurrentEmail(null);
    setData(null);
    setEmail("");
    setPassword("");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-charcoal-800/40 font-sans">Loading…</div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6">
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
            >
              Daytrip
            </Link>
            <p className="mt-2 font-sans text-body-sm text-charcoal-800/50">
              Admin Login
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-terracotta-500/10 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-terracotta-500" />
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-caption font-sans font-medium text-charcoal-800 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Admin email"
                    className="w-full pl-10 pr-4 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption font-sans font-medium text-charcoal-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-10 py-3 bg-cream-100 border border-cream-300 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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

              {loginError && (
                <div className="text-caption font-sans text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white font-sans font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loggingIn ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-caption font-sans text-center text-charcoal-800/40">
              This area is for site administrators only.
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

  // ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-white border-b border-cream-300 px-6 md:px-12 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-heading-lg text-charcoal-900">
              Daytrip
            </Link>
            <span className="text-caption font-sans text-charcoal-800/40">
              / Admin Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-caption font-sans text-charcoal-800/60 hidden sm:block">
              <Shield className="inline w-3 h-3 mr-1" />
              {currentEmail}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-caption font-sans text-charcoal-800/60 hover:text-terracotta-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-12 lg:px-20 py-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-display text-charcoal-900">
            Welcome back, admin.
          </h1>
          <p className="mt-2 font-sans text-body text-charcoal-800/60">
            Overview of users and revenue.
          </p>
        </div>

        {!data?.configured && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-sans font-medium text-amber-900 mb-1">
              Supabase not configured
            </h3>
            <p className="font-sans text-body-sm text-amber-800/80">
              {data?.message ||
                "Add Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) to enable user tracking and payments."}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          <StatCard
            label="Total Users"
            value={data?.totalUsers?.toString() || "0"}
            icon={<Users className="w-5 h-5" />}
            color="sage"
          />
          <StatCard
            label="Total Revenue"
            value={`$${((data?.totalRevenue || 0) / 100).toFixed(2)}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="terracotta"
          />
          <StatCard
            label="Paying Users"
            value={(
              data?.users?.filter((u) => u.totalPaidCents > 0).length || 0
            ).toString()}
            icon={<TrendingUp className="w-5 h-5" />}
            color="charcoal"
          />
        </div>

        {/* Users table */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-cream-200">
            <h2 className="font-serif text-heading-lg text-charcoal-900">
              All Users
            </h2>
            <p className="font-sans text-caption text-charcoal-800/50 mt-1">
              Sorted by most recent signup
            </p>
          </div>

          {loadingData ? (
            <div className="px-6 py-12 text-center font-sans text-body-sm text-charcoal-800/40">
              Loading users…
            </div>
          ) : !data?.users || data.users.length === 0 ? (
            <div className="px-6 py-12 text-center font-sans text-body-sm text-charcoal-800/40">
              No users yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-50">
                  <tr>
                    <Th>Email</Th>
                    <Th>Name</Th>
                    <Th>Role</Th>
                    <Th>Plan</Th>
                    <Th>Total Paid</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-cream-200 hover:bg-cream-50/50 transition-colors"
                    >
                      <Td>
                        <span className="font-sans text-body-sm text-charcoal-900">
                          {u.email}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-sans text-body-sm text-charcoal-800/70">
                          {u.fullName || "—"}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 font-sans text-caption font-medium ${
                            u.role === "admin"
                              ? "bg-terracotta-500/10 text-terracotta-600"
                              : "bg-sage-300/20 text-sage-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-sans text-body-sm text-charcoal-800/70">
                          {u.plan || "—"}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-sans text-body-sm font-medium text-charcoal-900">
                          ${(u.totalPaidCents / 100).toFixed(2)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-sans text-caption text-charcoal-800/50">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "sage" | "terracotta" | "charcoal";
}) {
  const colors = {
    sage: "bg-sage-300/15 text-sage-600",
    terracotta: "bg-terracotta-500/10 text-terracotta-500",
    charcoal: "bg-charcoal-900/5 text-charcoal-900",
  };
  return (
    <div className="bg-white rounded-3xl shadow-card p-6">
      <div className="flex items-start justify-between mb-4">
        <span className="font-sans text-caption text-charcoal-800/50">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
      <div className="font-serif text-display text-charcoal-900">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left font-sans text-caption font-medium text-charcoal-800/50 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-6 py-4">{children}</td>;
}
