# 01 — Agent Architecture

## The core idea: one spine, many generators

Every document Vibe Coder Operation Platform produces — board pack, audit workpapers, pitch deck, S-1,
legal stack — is generated from **one canonical, verified data graph: the Revenue
& Corporate Spine.** Humans review the *spine and the exceptions once*; the
documents are then mechanically consistent with each other and with reality.

```
   RAILS (read-only)                THE SPINE                    GENERATORS
 ┌────────────────┐         ┌──────────────────────┐      ┌────────────────────┐
 │ Stripe         │         │  Canonical ledger:   │  ┌──▶│ Board Pack         │
 │ Apple App Store│──┐      │  • transactions      │  │   ├────────────────────┤
 │ Google Play/Ads│  ├─────▶│  • payouts↔bank      │──┼──▶│ Audit Workpapers   │──▶ Auditor signs
 │ Meta           │  │      │  • ASC 606 revenue   │  │   ├────────────────────┤
 │ Bank / ERP     │──┘      │  • cap table         │  ├──▶│ Pitch Deck         │
 └────────────────┘         │  • corporate facts   │  │   ├────────────────────┤
        ▲                   │  • KPI / cohorts     │  └──▶│ S-1 + Legal Stack  │──▶ Attorney signs
        │                   └──────────┬───────────┘      └────────────────────┘
   Revenue Truth Agent                 │
   (ingest, normalize, reconcile)      ▼
                              IPO Scoring Agent ──▶ ranks Tier-1 → IPO Track
                              Self-Improvement Agent ──▶ learns from human edits
```

**Rule:** generators never invent a financial fact. They may only cite facts that
exist in the spine, each with a provenance pointer back to a rail transaction or a
human-entered, human-attested input. This is what makes the output auditable and
keeps humans in a *review* posture instead of a *fact-check everything* posture.

## Agent roster

| # | Agent | Job | Human boundary |
|---|-------|-----|----------------|
| A1 | **Revenue Truth** | Ingest rails read-only, normalize to canonical ledger, reconcile payouts↔bank, compute net revenue/MRR/ARR/cohorts, flag anomalies | Founder confirms account ownership; no human assembles data |
| A2 | **Audit Automation** | Build ASC 606 workpapers, reconciliations, completeness/cutoff evidence, exception list, PBC ("prepared by client") package | **Independent auditor reviews exceptions & signs the opinion** |
| A3 | **S-1 Drafting** | Draft S-1 sections (Business, MD&A, Risk Factors, Use of Proceeds, financials narrative) from spine | **Securities attorney reviews & owns the filing** |
| A4 | **Pitch Deck** | Generate investor narrative + charts from the same spine | Founder approves story; no fact invented |
| A5 | **Legal Stack** | Draft cap table docs, board consents, charter amendments, underwriting-adjacent docs, diligence responses | **Attorney reviews & signs** |
| A6 | **IPO Scoring** | Score every company's IPO-readiness from verified data; rank Tier-1 → IPO Track | Investment committee confirms before high-touch |
| A7 | **Growth / GTM** | Identify activation hooks, free→paid triggers, churn risks, "must-have" nudges | Growth team approves campaigns |
| A8 | **Self-Improvement** | Diff human edits vs agent drafts; turn deltas into evals + prompt/policy updates | Eng reviews before policy changes ship |
| A0 | **Orchestrator (Copilot)** | Front-door agent; routes founder requests, tracks each company's readiness graph, calls A1–A8 | — |

## Human-in-the-loop boundaries (compliance-critical)

Draw a hard line between **preparer** work (agents can own) and **attestor /
filer** work (licensed independent humans must own):

| Agents may do | Licensed humans must do |
|---------------|-------------------------|
| Gather & reconcile evidence | Express the **audit opinion** |
| Draft workpapers & documents | Sign the **S-1 / certifications** |
| Propose accounting treatment | Make final **legal judgments** |
| Surface exceptions & risks | Exercise **independent professional skepticism** |

Keep an immutable **provenance + review log**: every fact's source, every agent
draft, every human edit and sign-off. That log *is* the audit trail and the product.

## Guardrails baked into every agent

1. **No fact without provenance.** If it's not in the spine with a source pointer,
   it cannot appear in a generated document. Hallucinated numbers are the existential
   risk for this product.
2. **Cite, don't assert.** Financial statements in documents link to workpaper lines.
3. **Exceptions escalate, never silently resolve.** Ambiguity → human queue.
4. **Independence firewall.** Agents that *prepare* are logically separated from the
   independent auditor/attorney who *signs*; the signing human's edits are recorded
   as independent review, not co-authoring.
5. **PII / financial data handling.** Rail credentials are read-only, scoped, and
   revocable; data is tenant-isolated; least-privilege everywhere.

See `02-prompt-library.md` for the actual system prompts that encode all of this.
