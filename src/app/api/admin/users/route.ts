import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/check-auth";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(_req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({
      users: [],
      totalRevenue: 0,
      totalUsers: 0,
      configured: false,
      message: "Supabase not configured. Add env vars to enable user tracking.",
    });
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, total_paid_cents, plan, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch users", detail: error.message },
      { status: 500 }
    );
  }

  const { data: payments } = await admin
    .from("payments")
    .select("id, user_id, amount_cents, currency, plan, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const users = (profiles || []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
    totalPaidCents: p.total_paid_cents,
    plan: p.plan,
    createdAt: p.created_at,
  }));

  const totalRevenue = users.reduce(
    (sum, u) => sum + (u.totalPaidCents || 0),
    0
  );

  return NextResponse.json({
    users,
    payments: payments || [],
    totalRevenue,
    totalUsers: users.length,
    configured: true,
  });
}
