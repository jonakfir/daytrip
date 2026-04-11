import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getTripCredits } from "@/lib/db";
import { JWT_SECRET } from "@/lib/jwt-secret";

export const runtime = "nodejs";

interface JwtPayload {
  email?: string;
  userId?: string;
  role?: string;
}

/**
 * Returns the current user's trip-credit balance.
 *
 * Admin users return { credits: -1, isAdmin: true } so the UI can
 * show "unlimited" instead of a number.
 *
 * Returns 401 for unauthenticated requests so the client can branch on
 * status code instead of checking a payload field.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("daytrip-auth")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  let payload: JwtPayload;
  try {
    const { payload: p } = await jwtVerify(token, JWT_SECRET);
    payload = p as JwtPayload;
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
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
