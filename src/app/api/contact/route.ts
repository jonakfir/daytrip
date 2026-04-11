import { NextRequest, NextResponse } from "next/server";

/**
 * Contact form submissions.
 *
 * For now this logs to console.error so submissions show up in Vercel
 * function logs (Project → Logs → /api/contact). Wire to Resend / Supabase /
 * SendGrid when you pick a provider — the contract is intentionally simple.
 *
 * Returns 200 on success, 400 on invalid input. The form on /contact swallows
 * non-200 and shows a generic error toast.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 200;
const MAX_MESSAGE = 5000;

export async function POST(req: NextRequest) {
  let body: { name?: unknown; email?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }
    if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: "Input exceeds maximum length" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Log the submission. console.error (rather than .log) so it surfaces
    // in Vercel's "Errors" tab and is easier to monitor until a real provider
    // is wired up.
    console.error(
      `[contact] new submission\n  name: ${name}\n  email: ${email}\n  message: ${message.slice(0, 500)}${message.length > 500 ? " …(truncated)" : ""}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] handler error:", err);
    return NextResponse.json(
      { error: "Could not process contact form" },
      { status: 500 }
    );
  }
}
