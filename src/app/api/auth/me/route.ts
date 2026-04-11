import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt-secret";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("daytrip-auth")?.value;
  if (!token) {
    return NextResponse.json({
      authenticated: false,
      role: null,
      email: null,
      isAdmin: false,
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = (payload.role as string) || null;
    return NextResponse.json({
      authenticated: true,
      role,
      email: (payload.email as string) || null,
      userId: (payload.userId as string) || null,
      isAdmin: role === "admin",
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      role: null,
      email: null,
      isAdmin: false,
    });
  }
}
