import Link from "next/link";
import Container from "./Container";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-molecule-black">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-molecule-gold to-transparent" />
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="text-lg font-semibold tracking-[0.15em] uppercase text-molecule-white">
                Molecule
              </span>
              <span className="text-lg font-light tracking-[0.15em] uppercase text-molecule-gold ml-2">
                Capital
              </span>
            </Link>
            <p className="text-sm text-molecule-muted leading-relaxed max-w-xs">
              {SITE_CONFIG.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-molecule-gold mb-6">
              Navigation
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

        <div className="mt-16 pt-8 border-t border-molecule-gray/30 text-center">
          <p className="text-xs text-molecule-muted">
            &copy; {new Date().getFullYear()} Molecule Capital. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
