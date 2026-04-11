import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

export interface AuthUser {
  authenticated: boolean;
  role: string | null;
  email: string | null;
  userId: string | null;
  isAdmin: boolean;
}

/**
 * Server-side auth check. Returns the current user's auth state.
 * Call from API routes or server components.
 */
export async function getServerAuth(): Promise<AuthUser> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("daytrip-auth")?.value;

    if (!token) {
      return {
        authenticated: false,
        role: null,
        email: null,
        userId: null,
        isAdmin: false,
      };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      authenticated: true,
      role: (payload.role as string) || null,
      email: (payload.email as string) || null,
      userId: (payload.userId as string) || null,
      isAdmin: payload.role === "admin",
    };
  } catch {
    return {
      authenticated: false,
      role: null,
      email: null,
      userId: null,
      isAdmin: false,
    };
  }
}

/**
 * Check if a JWT cookie value represents an admin user.
 * For API routes that have direct cookie access via NextRequest.
 */
export async function isAdminRequest(
  cookieValue: string | undefined
): Promise<boolean> {
  if (!cookieValue) return false;
  try {
    const { payload } = await jwtVerify(cookieValue, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}
