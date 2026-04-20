import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a free Daytrip account to save, edit, and share your AI-generated travel itineraries.",
  alternates: { canonical: "/signup" },
  robots: { index: true, follow: true },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
