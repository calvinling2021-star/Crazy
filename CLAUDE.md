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
- **Static export constraints**: No `next/image` optimization (images are `unoptimized: true`), no server components that fetch data at runtime, no API routes.
