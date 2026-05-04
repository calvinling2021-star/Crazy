# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Molecule Capital is a static marketing website for a healthcare/biotech family office investment firm. It is built with Next.js (App Router) configured for **static export** (`output: "export"`), meaning no server-side rendering or API routes — all pages are pre-rendered to HTML at build time.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build static export to /out
npm run lint     # Run ESLint (Next.js core-web-vitals + TypeScript rules)
```

There is no test suite in this project.

## Architecture

### Routing

Pages live in `src/app/` using Next.js App Router conventions. Each route directory (`about/`, `investments/`, `team/`, `contact/`) has its own `layout.tsx` (metadata) and `page.tsx` (content). The root `src/app/layout.tsx` wraps every page with the global `<Header>` and `<Footer>`, loads the Inter font from Google Fonts, and defines the site-wide SEO metadata and JSON-LD schema.

### Component Layers

- `src/components/layout/` — Structural shell: `Container` (max-width wrapper), `Header` (fixed, scroll-aware nav), `Footer`, `MobileMenu`
- `src/components/sections/` — Full-width page sections composed into pages (e.g. `Hero`, `Stats`, `PortfolioGrid`)
- `src/components/ui/` — Reusable primitives: `Button` (Link-based, primary/secondary variants), `SectionLabel` (gold label + underline), `AnimatedSection` (Framer Motion scroll-trigger wrapper)

### Data Layer

All content is static TypeScript in `src/data/`. Types are defined in `src/lib/types.ts` (`TeamMember`, `PortfolioCompany`, `Stat`). To add or modify content, edit the corresponding data file — no API calls are involved.

### Animation System

Framer Motion variants are centralized in `src/lib/animations.ts` (`fadeUp`, `fadeIn`, `slideLeft`, `slideRight`, `staggerContainer`, `scaleIn`). For scroll-triggered animations, wrap content in `<AnimatedSection>` (defaults to `fadeUp`). For hero/page-load animations, use `motion.*` directly with `initial`/`animate` (not `whileInView`). Any component using Framer Motion must include `"use client"` at the top.

### Design Tokens

The color palette and font are defined as Tailwind v4 CSS custom properties in `src/app/globals.css` under `@theme inline`. Use these token names in Tailwind classes:

| Token | Use |
|---|---|
| `molecule-black` / `molecule-dark` / `molecule-charcoal` / `molecule-gray` | Backgrounds, dark to light |
| `molecule-muted` / `molecule-silver` / `molecule-white` | Text, light to bright |
| `molecule-gold` / `molecule-gold-light` / `molecule-gold-dark` | Primary accent |

### Key Conventions

- **Path alias**: `@/*` resolves to `src/*` — always use this for imports.
- **Navigation links** are the single source of truth in `src/lib/constants.ts` (`NAV_LINKS`). Site config (name, email, URL) is also in `SITE_CONFIG` there.
- **`clsx`** is used for all conditional class merging.
- **TypeScript strict mode** is enabled — avoid `any`, use the types in `src/lib/types.ts`.

## Don't

- **Don't use `<Image>` from `next/image` with optimization** — images are `unoptimized: true`; use a plain `<img>` tag or pass `unoptimized` explicitly.
- **Don't add API routes** — `output: "export"` makes them impossible; this is a fully static site.
- **Don't fetch data at runtime in Server Components** — all data comes from `src/data/` at build time.
- **Don't use `whileInView` directly on `motion.*` elements** — use the `<AnimatedSection>` wrapper instead, which handles viewport margin and `once: true`.
- **Don't hardcode nav links or site config** — always read from `src/lib/constants.ts`.

## Verification Order

After making changes, run in this order:

```bash
npm run lint     # 1. catch style/type issues early
npm run build    # 2. confirm static export succeeds
```

TypeScript errors surface during `build`; there is no standalone `tsc` script.

## Commit Messages

Write commit messages as a working engineer would: short, direct, lowercase imperative subject line. Describe what changed and why if non-obvious. No bullet lists, no marketing language, no "refactor to improve maintainability"-style filler.
