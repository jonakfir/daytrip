import type { Metadata } from "next";
import { Cormorant_Garamond, Karla } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-karla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daytrip — AI Travel Itinerary Generator",
  description:
    "Create beautiful, personalized day-by-day trip plans powered by AI. Free itinerary planning with bookable flights, hotels, and activities.",
  openGraph: {
    title: "Daytrip — AI Travel Itinerary Generator",
    description:
      "Create beautiful, personalized day-by-day trip plans powered by AI.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${karla.variable}`}>
      <body className="min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
