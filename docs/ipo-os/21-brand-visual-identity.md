# 21 — Brand & Visual Identity

> ✅ **Launch brand decided: Attestly** (codename: VCOP). The naming section §2 below predates
> the decision — use the canonical naming in [`24`](./24-product-naming.md): brand **Attestly**,
> wordmark `attestly`, sub-brands **Attestly Connect** (read-only rails) → **Standing** (the
> credit-from-day-one score) → **Line** (instant capital), all via **Attestly MCP**. Taglines:
> "Verified, not vibes." / "Attest your revenue. Get your capital." / "The key is seamless, not
> the fund." Everything else here (voice, color, type, UI, motion, SVG direction) stands.

> Brand book v1.0 for **Attestly**. Drop-in: real hex, real fonts, working SVG.
> Direction grounded in Vercel / Linear / Supabase / Resend / Raycast.

## 1. Brand strategy
- **Positioning (one line):** *The financial operating layer for AI builders — verified numbers
  in, instant capital out, no paperwork.*
- **Brand promise:** *Your real numbers, working for you from day one.* Never fill out a form to
  prove something we can already see and verify.
- **Mission:** Give every indie AI builder the financial credibility and access-to-capital that
  today only funded startups with a finance team get.
- **Vision:** A solo builder shipping in Cursor at 2am has the same financial infrastructure —
  verified books, a real credit score, on-demand growth capital — as a Series A company, and
  never opens a spreadsheet to get it.
- **Personality / archetype:** Calm, precise, quietly confident. **Sage** (truth, verification,
  neutrality) with a **Caregiver** streak (we handle the scary finance stuff). Deliberately **not**
  hype-VC-Twitter. Trust is the differentiator.

### Messaging pillars
1. **Verified, not vibes.** Financials read from the source, reconciled, auditable — to you, to
   lenders, to anyone you choose.
2. **Credit from day one.** We score your business the moment you connect, so credibility
   compounds while you build.
3. **Capital without paperwork.** Underwriting off audited data = no forms, no decks, no wait.
4. **The key is seamless, not the fund.** We meet you in Claude/Cursor/Codex via MCP — finance is
   a capability your agent has, not a chore you do.
5. **Read-only by design. Yours, always.** We observe and verify; we never move, hold, or touch
   your money. Trust is the product.

## 2. Naming
- **Long form (legal/descriptive):** *Vibe Coder Operation Platform.* Pros: speaks the audience's
  language, category-defining, SEO-legible. Cons: long; "vibe coder" is a trend term that may
  date; the name doesn't say "finance/capital." **Verdict:** keep as descriptive/legal form,
  **lead with a short wordmark.**
- **Primary wordmark:** **`VCOP`** — mono, lowercase-friendly, reads like a CLI tool.
- **Friendly verb/nickname:** **"Vibe"** — *"connect Vibe," "ask Vibe for capital," "Vibe verified."*
  Use in conversational/agent contexts; `VCOP` in product chrome.

| Product | Name |
|---|---|
| Startup credit score | **TrustScore** (alt: Ledger Score) |
| Verified-financials engine | **Verified Books** (audit trail = *the Ledger*) |
| Capital product | **Instant Capital** (a draw event = *a Draw*; avoid "loan/debt" in UI) |
| MCP / agent surface | **Vibe MCP** (server id `vibe`; calls read `vibe.score`, `vibe.draw`) |
| Trust mark | **Verified by VCOP** |

**Backup names:** Ledger/Ledgerline · Proof · Baseline · Throughline · Tally · Runrate · Keystone/Seam · Mint (collision risk).

## 3. Voice & tone
Plain numbers over jargon; show the source; calm under money; developer register (terse,
lowercase-comfortable, `read-only` like a flag); respect the builder; neutral on outcomes.

| Do | Don't |
|---|---|
| "Connected read-only. We can see your revenue; we can't touch it." | "Securely sync your data for a seamless experience!" |
| "Verified — pulled from Stripe, reconciled 2 min ago." | "Trust us, your numbers look great. 🚀" |
| "You qualify for $12,000. Want it now?" | "Congrats!!! You've been pre-approved!" |
| "Draw declined: 90-day revenue is below threshold. Here's what moves it." | "Unfortunately your application was unsuccessful." |

**Example lines** — Hero: *"Real numbers in. Instant capital out. No paperwork."* · Button:
`Connect read-only` / `Draw capital` · Email subject: *"You're cleared for $12,000 — no
paperwork"* · Agent reply: *"Vibe: last 90 days verified ($14.2k, +18%). TrustScore 612. You can
draw up to $9,000 now — say the word."* · Empty state: *"Nothing to verify yet. Connect a revenue
source read-only and we'll start building your TrustScore today."*

## 4. Taglines (ranked)
1. **The key is seamless, not the fund.** ← signature brand line
2. **Real numbers in. Instant capital out.** ← hero/product headline
3. Verified, not vibes. · 4. Credit from day one. · 5. Capital, without the paperwork.
6. Your real numbers, working for you. · 7. We read your books, so banks don't have to ask.
8. Finance that lives where you build. · 9. Proof beats pitch decks. · 10. Connect once. Stay fundable.

## 5. Visual identity
**Logo — recommended "The Seam":** a wordmark `vcop` in mono where two rails merge into one
unbroken join (visualizes *seamless*); the logomark alone is that join (two forms meeting into one
curve). Borrow a checkmark for the Verified badge. (Alts: "Check-Ledger" = check + baseline;
"Prompt Caret" = caret/cursor doubling as a growth tick.)

### Wordmark + monogram (drop-in SVG)
```svg
<svg width="320" height="96" viewBox="0 0 320 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VCOP">
  <g transform="translate(8,16)">
    <rect x="0" y="0" width="64" height="64" rx="16" fill="#0B0F14"/>
    <path d="M14 44 C26 44 30 32 42 32 L50 32" stroke="#3DD68C" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M14 20 C26 20 30 32 42 32" stroke="#5B8CFF" stroke-width="6" stroke-linecap="round" fill="none"/>
    <circle cx="50" cy="32" r="4.5" fill="#E8EDF2"/>
  </g>
  <text x="92" y="62" font-family="'JetBrains Mono','SFMono-Regular',ui-monospace,monospace" font-size="44" font-weight="600" letter-spacing="-1" fill="#E8EDF2">vcop</text>
  <circle cx="300" cy="56" r="5" fill="#3DD68C"/>
</svg>
```
```svg
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VCOP mark">
  <rect width="64" height="64" rx="16" fill="#0B0F14"/>
  <path d="M14 44 C26 44 30 32 42 32 L50 32" stroke="#3DD68C" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M14 20 C26 20 30 32 42 32" stroke="#5B8CFF" stroke-width="6" stroke-linecap="round" fill="none"/>
  <circle cx="50" cy="32" r="4.5" fill="#E8EDF2"/>
</svg>
```

### Color, type, tokens
Dark-native first. **Green = verified/live/approved/go (sacred — never decorative).** Blue =
action/capital. Depth from borders, not shadows. **Money is mono** (every real figure in
JetBrains/Geist Mono, tabular).

```css
:root[data-theme="dark"]{
  --bg:#0B0F14; --surface:#11161D; --surface-2:#1A212B; --border:#232C38;
  --text:#E8EDF2; --text-muted:#9AA7B5; --text-faint:#5E6B7A;
  --accent:#3DD68C; --accent-strong:#22B26E; --secondary:#5B8CFF;
  --warn:#F5B544; --danger:#F2585B;
}
:root[data-theme="light"]{
  --bg:#FBFCFD; --surface:#FFFFFF; --border:#E3E8EE;
  --text:#0B0F14; --text-muted:#566372;
  --accent:#179A5E; --secondary:#3A6DF0; --warn:#C98A12; --danger:#D83A3D;
}
--font-display:"Geist",Inter,system-ui,sans-serif;
--font-body:Inter,system-ui,sans-serif;
--font-mono:"JetBrains Mono","Geist Mono",ui-monospace,SFMono-Regular,monospace; /* money is mono */
```
- **Type:** Geist (display) · Inter (body/UI, weight 400–500, 600 for key numbers) · JetBrains Mono
  (numbers/wordmark/code) · optional Newsreader/Source Serif 4 for a single marketing pull-quote.
- **Icons:** outline, 1.5px, 24px grid, Lucide/Phosphor base; status = shape + color (● verified,
  ◐ reconciling, ▲ broken).
- **UI:** ink canvas, card-based, one bright action per view; TrustScore is the hero object (big
  mono number + thin green gauge + "verified as of <ts>"); provenance visible on hover; read-only
  shown as a calm badge.
- **Imagery:** no stock-photo humans; real product UI on ink; abstract line illustration (rails,
  nodes, ledger baselines); "receipt" aesthetic for trust artifacts.
- **Motion:** 120–200ms ease-out; numbers settle into place; one restrained green sweep when
  capital is approved (no confetti); respect `prefers-reduced-motion`.

## 6. Surface playbook
- **App UI:** dark dashboard, TrustScore hero, mono numbers w/ verified nodes + hover-provenance.
- **MCP/agent:** server id `vibe`; tools `vibe.score`/`vibe.verify`/`vibe.draw`; agent states
  verified facts + the next action, never hypes. Monogram = avatar.
- **Build-in-public:** ink cards, mono numbers, screenshots of real verified states; voice of a
  builder shipping in public, not a brand marketing.
- **Verified badge ("Verified by VCOP"):** portable, **timestamped, revocable, real-data-backed**
  (never decorative) — the trust mark made portable, and a growth loop.

> Opinionated calls: keep the long name as descriptive/legal, lead with `VCOP` + "Vibe"; green is
> exclusively the trust signal; the Verified badge must always be backed by a current verification.
