import Link from "next/link";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          {/* Logo */}
          <div className="flex flex-col items-center md:items-start">
            <span className="font-serif text-heading-lg text-cream-100 tracking-tight">
              Daytrip
            </span>
            <p className="mt-2 max-w-xs font-sans text-body-sm text-cream-200/50">
              Your journey begins with a single search.
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans text-body-sm text-cream-200/60 transition-colors hover:text-cream-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="mt-12 h-px w-full bg-cream-200/10" />

        {/* Copyright */}
        <p className="mt-6 text-center font-sans text-caption text-cream-200/40">
          &copy; 2024 Daytrip. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
