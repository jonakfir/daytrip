import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("daytrip-auth")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, role: null });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({
      authenticated: true,
      role: payload.role,
      email: payload.email,
    });
  } catch {
    return NextResponse.json({ authenticated: false, role: null });
  }
}
