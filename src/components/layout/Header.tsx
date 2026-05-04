"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import Container from "./Container";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-molecule-charcoal/90 backdrop-blur-md"
            : "bg-transparent"
        )}
      >
        <Container className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-molecule-gold rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-molecule-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-wide text-molecule-white">
              {SITE_CONFIG.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm font-semibold uppercase tracking-[0.12em] transition-colors duration-300",
                  pathname === link.href
                    ? "text-molecule-gold"
                    : "text-molecule-white hover:text-molecule-gold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="bg-molecule-gold text-molecule-black px-5 py-2.5 text-sm font-semibold tracking-wide hover:bg-molecule-gold-light transition-colors duration-200"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={clsx("w-6 h-[2px] bg-molecule-gold transition-all", mobileOpen && "rotate-45 translate-y-2")} />
            <span className={clsx("w-6 h-[2px] bg-molecule-gold transition-all", mobileOpen && "opacity-0")} />
            <span className={clsx("w-4 h-[2px] bg-molecule-gold transition-all", mobileOpen && "-rotate-45 -translate-y-2 w-6")} />
          </button>
        </Container>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-molecule-black/95 flex flex-col pt-28 px-8">
          <nav className="flex flex-col gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-light text-molecule-white hover:text-molecule-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="mt-4 bg-molecule-gold text-molecule-black px-6 py-3 text-sm font-semibold text-center"
            >
              Open Dashboard
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
