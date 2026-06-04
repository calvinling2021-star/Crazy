# Deploying Attestly

The app is a standard Next.js 16 app and builds clean (`npm run build`). Two supported targets,
both configured in-repo. **No local build is required** — both platforms build in their cloud.

> Note: the deploy itself must be triggered from your account (dashboard import or CLI with your
> token). A locked-down CI/cloud sandbox cannot reach vercel.com / render.com.

Branch to deploy: `claude/ipo-os-business-model-KKTms` (merge to `main` when ready and deploy that).

Routes: `/attestly` (landing), `/capital` (dashboard), `/capital/connect`, `/capital/standing`,
`/api/*`. The root `/` is still the legacy Molecule Capital site (see "Make Attestly the homepage").

---

## Option A — Vercel (recommended for Next.js)

**Dashboard (≈2 min):**
1. https://vercel.com/new → Import the GitHub repo `calvinling2021-star/crazy`.
2. Pick the branch; Framework auto-detects **Next.js** (`vercel.json` pins it). Build/install are default.
3. Env vars (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SITE_URL` = your Vercel URL (e.g. `https://attestly.vercel.app`) — makes the
     OG/share-card image URLs absolute & correct.
   - `STRIPE_SECRET_KEY` (optional) = a **restricted, read-only** key for live data. Omit for demo.
4. Deploy. Visit `/attestly`.

**CLI (from your machine, with your login):**
```bash
npm i -g vercel
vercel link        # select/create the project
vercel --prod
```

---

## Option B — Render (Blueprint)

`render.yaml` defines the web service (build `npm install && npm run build`, start `npm run start`,
health check `/attestly`, free plan).

1. https://dashboard.render.com → **New → Blueprint** → connect the repo/branch. Render reads `render.yaml`.
2. Set the `sync: false` env vars when prompted:
   - `NEXT_PUBLIC_SITE_URL` = your Render URL (e.g. `https://attestly.onrender.com`).
   - `STRIPE_SECRET_KEY` (optional, read-only).
3. Create. Render builds and serves on its `$PORT` (Next `start` honors it).

> Free Render web services sleep when idle (cold start on first hit) — fine for testing.

---

## Verify after deploy
- `/attestly` renders (hero + share image)
- `/capital` shows Standing, Line offers, deadline alerts, data-room readiness, the Verified badge
- `/api/cdp/state` returns JSON; `/api/badge` and `/api/og` return SVG

## Make Attestly the homepage (optional)
Today `/` serves the legacy Molecule Capital site. To launch Attestly-first, either (a) move the
landing to `/`, or (b) add a redirect `/ → /attestly` in `next.config.ts`. Ask Claude to do (a)/(b).

## MCP server
The Attestly MCP (`npm run mcp`) is a local stdio server for agents (Claude/Cursor/Codex), not a
web deploy. Point your client at `npm run mcp` (or `tsx /abs/path/mcp/server.ts`).
