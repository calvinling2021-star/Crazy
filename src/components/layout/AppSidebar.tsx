"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { APP_NAV_LINKS, SITE_CONFIG } from "@/lib/constants";

function NavIcon({ icon }: { icon: string }) {
  if (icon === "chart")
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    );
  if (icon === "sparkles")
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    );
  if (icon === "music")
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    );
  if (icon === "trending")
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    );
  return null;
}

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] flex-shrink-0 bg-molecule-dark border-r border-molecule-gray/30 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-molecule-gray/30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-molecule-gold rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-molecule-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <span className="font-semibold text-molecule-white tracking-wide text-sm">
            {SITE_CONFIG.name}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3">
        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-molecule-muted px-3 mb-3">
          Platform
        </p>
        <div className="flex flex-col gap-1">
          {APP_NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-molecule-gold/10 text-molecule-gold border border-molecule-gold/20"
                    : "text-molecule-silver hover:text-molecule-white hover:bg-molecule-gray/50"
                )}
              >
                <NavIcon icon={link.icon} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-molecule-muted px-3 mb-3">
            Resources
          </p>
          <div className="flex flex-col gap-1">
            <Link
              href="/#pricing"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-molecule-silver hover:text-molecule-white hover:bg-molecule-gray/50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              Pricing
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-molecule-silver hover:text-molecule-white hover:bg-molecule-gray/50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Homepage
            </Link>
          </div>
        </div>
      </nav>

      {/* User profile stub */}
      <div className="p-4 border-t border-molecule-gray/30">
        <div className="flex items-center gap-3 p-2 rounded hover:bg-molecule-gray/30 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-molecule-gold/20 border border-molecule-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="text-molecule-gold text-xs font-semibold">U</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-molecule-white truncate">Creator Account</p>
            <p className="text-[10px] text-molecule-muted truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
