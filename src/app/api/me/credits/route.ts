import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getTripCredits } from "@/lib/db";

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

interface JwtPayload {
  email?: string;
  userId?: string;
  role?: string;
}

/**
 * Returns the current user's trip-credit balance.
 *
 * Admin users return { credits: Infinity, isAdmin: true } so the UI can
 * show "unlimited" instead of a number.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("daytrip-auth")?.value;
  if (!token) {
    return NextResponse.json({
      authenticated: false,
      credits: 0,
      isAdmin: false,
    });
  }
  let payload: JwtPayload;
  try {
    const { payload: p } = await jwtVerify(token, JWT_SECRET);
    payload = p as JwtPayload;
  } catch {
    return NextResponse.json({
      authenticated: false,
      credits: 0,
      isAdmin: false,
    });
  }

  const isAdmin = payload.role === "admin";
  if (isAdmin) {
    return NextResponse.json({
      authenticated: true,
      credits: -1, // sentinel for "unlimited"
      isAdmin: true,
    });
  }

  if (!payload.userId) {
    return NextResponse.json({
      authenticated: true,
      credits: 0,
      isAdmin: false,
    });
  }

  const credits = await getTripCredits(payload.userId);
  return NextResponse.json({
    authenticated: true,
    credits: credits ?? 0,
    isAdmin: false,
  });
}
