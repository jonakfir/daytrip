import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/check-auth";
import { isDbConfigured, listAllUsers, listRecentPayments } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({
      users: [],
      payments: [],
      totalRevenue: 0,
      totalUsers: 0,
      configured: false,
      message:
        "Vercel Postgres not configured. Attach a Postgres database in the Vercel dashboard (Storage → Create Database → Postgres) and redeploy.",
    });
  }

  try {
    const [users, payments] = await Promise.all([
      listAllUsers(),
      listRecentPayments(100),
    ]);

    const shaped = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      totalPaidCents: u.total_paid_cents,
      plan: u.plan,
      createdAt: u.created_at,
    }));

    const totalRevenue = shaped.reduce(
      (sum, u) => sum + (u.totalPaidCents || 0),
      0
    );

    return NextResponse.json({
      users: shaped,
      payments,
      totalRevenue,
      totalUsers: shaped.length,
      configured: true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch users", detail: message },
      { status: 500 }
    );
  }
}
