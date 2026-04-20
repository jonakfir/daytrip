import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Daytrip to view and manage your AI-generated trip itineraries.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
