# Deploying Syft — website + app

Syft runs as **one always-on Node server** (not serverless): embeddings run
in-process via a native module (`onnxruntime-node`) kept warm. The included
`Dockerfile` is portable — same deploy on **Railway, Render, Fly.io, Cloud Run, or
any VPS**. This guide uses Railway. State lives in **Supabase** (hosted Postgres +
pgvector), so the app server itself is stateless and easy to host/scale.

---

## 0. Supabase (one-time)

1. Create a free project at **supabase.com**.
2. **SQL Editor** → paste & run [`supabase/schema.sql`](supabase/schema.sql) (creates the
   `profiles` table, pgvector, RLS, the `match_profiles` RPC).
3. **Project Settings → API** → copy three values:
   - Project **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only secret)
4. **Authentication → Providers → Email**: turn **"Confirm email" off** for frictionless
   testing (else users confirm via an emailed link). Google sign-in is optional (enable the
   Google provider + add your domain's `…/auth/callback` under URL Configuration).
5. **Seed the pool** from your machine (uses the service-role key + the precomputed
   embeddings — no recompute):
   ```bash
   # in .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   pnpm db:seed
   ```

> Skipping Supabase? The app still builds and runs in **demo mode** — onboarding passes
> through, and search ranks the baked-in Indian seed pool. Auth + per-user profiles just
> stay off until the keys are set.

## Environment variables

| Variable | When | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **build** | Inlined into the client bundle (Docker **build arg**). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **build** | Same — must be present at build time. |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime | Server-only. Reads the pool, writes embedded profiles. Never expose. |
| `LLM_API_KEY` | runtime | Groq key — query parse, Stage-3 reasoning, voice interview. |
| `PORT` | runtime | Injected by the host automatically — don't set it. |

The `NEXT_PUBLIC_*` split is the one gotcha: Next.js bakes those into the browser bundle at
**build** time, so they go in as Docker **build args**; the two server secrets are read at
**runtime**.

---

## Deploy the website to Railway

### Option A — Railway CLI (fastest)

`railway up` uploads your local folder (respecting `.dockerignore`, which keeps
`data/embeddings.json`), so the gitignored seed embeddings ship as-is.

```bash
# from syft-prototype/
npm i -g @railway/cli        # or: brew install railway
railway login
railway init

# Runtime secrets:
railway variables --set "LLM_API_KEY=<groq-key>" \
                  --set "SUPABASE_SERVICE_ROLE_KEY=<service-role-key>" \
                  --set "NEXT_PUBLIC_SUPABASE_URL=<project-url>" \
                  --set "NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>"

railway up                   # builds the Dockerfile in the cloud and deploys
railway domain               # provision a public HTTPS URL
```

Railway exposes service variables to the Docker build, so the `NEXT_PUBLIC_*` ones reach the
`ARG`s in the Dockerfile automatically. HTTPS is automatic → the **PWA installs** on phones
and desktop straight from the domain.

### Option B — GitHub repo

1. `git init && git add -A && git add -f data/embeddings.json && git commit -m "Syft"` → push.
2. Railway → **New Project → Deploy from GitHub repo** (auto-detects the `Dockerfile`).
3. **Variables** tab → add all four from the table above.
4. **Settings → Networking → Generate Domain**.

### After it's up

Add your Railway domain to Supabase **Authentication → URL Configuration**:
- **Site URL**: `https://<your-app>.up.railway.app`
- **Redirect URLs**: add `https://<your-app>.up.railway.app/auth/callback`

(Needed for email-confirmation and Google OAuth redirects. A stable domain matters here —
this is why a deployed URL beats the rotating dev tunnel.)

---

## The "app" — installable, and optionally in app stores

Syft is already a **PWA**, so once it's on an HTTPS domain it installs as an app:
- **iPhone (Safari):** Share → Add to Home Screen.
- **Android (Chrome):** the "Install Syft" prompt / menu → Install app.
- **Desktop (Chrome/Edge):** install icon in the address bar.

It launches full-screen with the terracotta icon, has an offline shell, and the dev stage-nav
hides itself once installed. For **most uses this is the app** — no store needed.

If you want **app-store listings**:
- **Android (Play Store):** wrap the PWA as a **TWA** with [PWABuilder](https://pwabuilder.com)
  or Bubblewrap → produces a signed `.aab`. Needs your domain + a `.well-known/assetlinks.json`.
- **iOS (App Store):** Apple doesn't accept raw PWAs; wrap with **Capacitor** (or PWABuilder's
  iOS package) into a native shell that loads the site. Expect review scrutiny for thin wrappers.

I can scaffold either wrapper on request.

---

## Resources, updates, cost

- **RAM:** give it **~1 GB** (onnxruntime fp32 MiniLM + Next). Bump under Settings if you see OOM restarts. CPU-only; no GPU.
- **Updating the seed pool:** edit `data/profiles.seed.ts` → `pnpm embed:seed` → `pnpm db:seed` (to push to Supabase) → redeploy.
- **Health:** `/` healthcheck is set in `railway.json`.
- **Cost guard:** "embed once, rank cheap" holds in production — a search makes **0** per-profile embedding calls and **≤6** LLM calls total, independent of pool size (the `match_profiles` RPC keeps it that way as the pool grows).
