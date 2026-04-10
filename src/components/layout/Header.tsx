"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_LINKS } from "@/lib/constants";
import Container from "./Container";
import MobileMenu from "./MobileMenu";

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
          <Link href="/" className="text-molecule-white hover:text-molecule-gold transition-colors duration-300">
            <span className="text-lg font-semibold tracking-[0.15em] uppercase">
              Molecule
            </span>
            <span className="text-lg font-light tracking-[0.15em] uppercase text-molecule-gold ml-2">
              Capital
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm font-semibold uppercase tracking-[0.15em] transition-colors duration-300 relative",
                  pathname === link.href
                    ? "text-molecule-gold"
                    : "text-molecule-white hover:text-molecule-gold"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-molecule-gold" />
                )}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Open menu"
          >
            <span className="w-6 h-[2px] bg-molecule-gold" />
            <span className="w-6 h-[2px] bg-molecule-gold" />
            <span className="w-4 h-[2px] bg-molecule-gold" />
          </button>
        </Container>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
