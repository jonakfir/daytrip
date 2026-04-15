import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt-secret";

/**
 * Anonymous users are allowed to generate one trip without signing up so
 * the app complies with App Store guideline 5.1.1(v) — registration may
 * only be required for account-based features (saving to library, paid
 * credits). The count is tracked in a signed, httpOnly cookie so the client
 * can't reset it by clearing localStorage. We don't persist anon state in
 * the DB; if the user wipes cookies they can try once more, which is fine.
 */

const COOKIE_NAME = "daytrip-anon";
const FREE_ANON_TRIPS = 1;
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

interface AnonPayload {
  used: number;
}

export async function readAnonUsed(req: NextRequest): Promise<number> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return 0;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const used = (payload as unknown as AnonPayload).used;
    return typeof used === "number" && used >= 0 ? used : 0;
  } catch {
    return 0;
  }
}

export function hasAnonCreditLeft(used: number): boolean {
  return used < FREE_ANON_TRIPS;
}

export async function setAnonUsedCookie(
  response: NextResponse,
  used: number
): Promise<void> {
  const token = await new SignJWT({ used })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(JWT_SECRET);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export { FREE_ANON_TRIPS };
