import Link from "next/link";

const productLinks = [
  { label: "Plan a Trip", href: "/#plan" },
  { label: "Pricing", href: "/pricing" },
  { label: "Sample Trips", href: "/trip/demo" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-serif text-heading-lg text-cream-100 tracking-tight">
              Daytrip
            </span>
            <p className="mt-3 max-w-xs font-sans text-body-sm text-cream-200/50">
              AI-powered travel itineraries that read like a luxury magazine. Plan your perfect trip in seconds.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-sans text-caption uppercase tracking-[0.15em] text-cream-200/40 mb-4">
              Product
            </h4>
            <nav className="flex flex-col gap-3">
              {productLinks.map((link) => (
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

          {/* Company */}
          <div>
            <h4 className="font-sans text-caption uppercase tracking-[0.15em] text-cream-200/40 mb-4">
              Company
            </h4>
            <nav className="flex flex-col gap-3">
              {companyLinks.map((link) => (
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

          {/* Legal */}
          <div>
            <h4 className="font-sans text-caption uppercase tracking-[0.15em] text-cream-200/40 mb-4">
              Legal
            </h4>
            <nav className="flex flex-col gap-3">
              {legalLinks.map((link) => (
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
        </div>

        {/* Divider */}
        <div className="mt-12 h-px w-full bg-cream-200/10" />

        {/* Copyright */}
        <p className="mt-6 text-center font-sans text-caption text-cream-200/40">
          &copy; {new Date().getFullYear()} Daytrip. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
