import Link from "next/link";
import Container from "./Container";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-molecule-black">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-molecule-gold to-transparent" />
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <div className="w-7 h-7 bg-molecule-gold rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-molecule-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-molecule-white">
                {SITE_CONFIG.name}
              </span>
            </Link>
            <p className="text-sm text-molecule-muted leading-relaxed max-w-xs">
              {SITE_CONFIG.tagline}. Generate AI music, distribute to 150+ platforms, and collect royalties on autopilot.
            </p>
            <p className="text-xs text-molecule-muted/60 mt-4">
              Powered by Suno AI · Distributed via DistroKid
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-molecule-gold mb-6">
              Product
            </h4>
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-molecule-silver hover:text-molecule-gold transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/dashboard" className="text-sm text-molecule-silver hover:text-molecule-gold transition-colors duration-300">
                Dashboard
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-molecule-gold mb-6">
              Contact
            </h4>
            <div className="flex flex-col gap-3 text-sm text-molecule-silver">
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="hover:text-molecule-gold transition-colors duration-300"
              >
                {SITE_CONFIG.email}
              </a>
              <span>{SITE_CONFIG.location}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-molecule-gray/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-molecule-muted">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-xs text-molecule-muted/60">
            Music royalties are subject to streaming platform terms. Results vary.
          </p>
        </div>
      </Container>
    </footer>
  );
}
