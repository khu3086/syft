# Syft — Go-Live, step by step (website + app)

Everything you need, in order, with links. Run all `pnpm` commands from the
`syft-prototype/` folder.

---

## Phase 1 — Accounts & tools (one-time)

| What | Link | Cost |
|---|---|---|
| Node.js 20+ (to run local commands) | https://nodejs.org | free |
| pnpm (package manager) | `npm install -g pnpm` · https://pnpm.io/installation | free |
| Supabase (database + auth) | https://supabase.com | free tier |
| Groq (LLM key) | https://console.groq.com/keys | free tier |
| Railway (website hosting) | https://railway.com | free trial, ~$5/mo |
| Railway CLI | `npm install -g @railway/cli` · https://docs.railway.com/guides/cli | free |
| *(Android store, optional)* Google Play Console | https://play.google.com/console/signup | $25 once |
| *(iOS store, optional)* Apple Developer + Xcode | https://developer.apple.com/programs/ · https://developer.apple.com/xcode/ | $99/yr |

---

## Phase 2 — Supabase (database + auth)

1. Create a project → https://supabase.com/dashboard (pick a region near your users).
2. **SQL Editor** (https://supabase.com/dashboard/project/_/sql) → paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. (Creates the `profiles` table,
   pgvector, RLS, the `match_profiles` RPC.)
3. **Project Settings → API** (https://supabase.com/dashboard/project/_/settings/api) → copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(secret — never put in the browser)*
4. **Authentication → Providers → Email**
   (https://supabase.com/dashboard/project/_/auth/providers) → turn **“Confirm email” OFF**
   for easy testing (otherwise users must click an emailed link).
   *Optional Google login:* enable the **Google** provider here (you'll need a Google OAuth
   client → https://console.cloud.google.com/apis/credentials).

## Phase 3 — Get your Groq key

1. https://console.groq.com/keys → **Create API Key** → copy it → that's `LLM_API_KEY`.

## Phase 4 — Seed the database (from your machine)

1. In `syft-prototype/`, copy the env template and fill it in:
   ```bash
   cp .env.example .env
   ```
   Set at least `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `LLM_API_KEY`.
2. Install deps and load the 15 starter profiles into Supabase:
   ```bash
   pnpm install
   pnpm db:seed
   ```
   You should see `✓ Ananya … ✓ Diya` and “15 profiles are now in the pool.”

---

## Phase 5 — Deploy the website (Railway)

```bash
# from syft-prototype/
railway login
railway init                        # name your project

# Set all four variables (two are used at build, two at runtime):
railway variables \
  --set "NEXT_PUBLIC_SUPABASE_URL=<project-url>" \
  --set "NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>" \
  --set "SUPABASE_SERVICE_ROLE_KEY=<service-role-key>" \
  --set "LLM_API_KEY=<groq-key>"

railway up                          # builds the Dockerfile in the cloud + deploys
railway domain                      # creates your public https URL
```

Open the printed `https://<app>.up.railway.app`. (First build takes a few minutes —
it compiles, warms the embedding model, and bakes in the seed data.)

**Resources:** if it restarts with out-of-memory, give the service ~1 GB RAM under
**Settings → Resources** in the Railway dashboard (https://railway.com/dashboard).

## Phase 6 — Connect auth to your domain

In Supabase → **Authentication → URL Configuration**
(https://supabase.com/dashboard/project/_/auth/url-configuration):
- **Site URL:** `https://<app>.up.railway.app`
- **Redirect URLs → Add:** `https://<app>.up.railway.app/auth/callback`

Now sign-up / sign-in / Google login all redirect correctly. ✅ **The website is live.**

---

## Phase 7 — The app (installable PWA — no store needed)

Once the site is on its HTTPS domain, it installs as a real app:
- **iPhone (Safari):** open the URL → **Share** → **Add to Home Screen**.
- **Android (Chrome):** open the URL → **Install Syft** prompt (or ⋮ menu → **Install app**).
- **Desktop (Chrome/Edge):** **install icon** in the address bar.

It launches full-screen with the Syft icon and works offline (browsing; search/voice need a
connection). For most launches, **this is your app.**

---

## Phase 8 — App-store listings (optional)

> Scaffolds are already in the repo — see **[STORES.md](STORES.md)** for the exact
> fill-in-two-values steps. Android uses
> [`public/.well-known/assetlinks.json`](public/.well-known/assetlinks.json); iOS uses
> [`capacitor.config.json`](capacitor.config.json).

### Android → Google Play (easiest)
1. Go to **PWABuilder** → https://www.pwabuilder.com → enter your Railway URL → **Start**.
2. **Package For Stores → Android → Google Play** → **Generate**. You get a signed `.aab`
   plus an `assetlinks.json`.
3. Host the verification file at `https://<app>.up.railway.app/.well-known/assetlinks.json`
   (drop it in `public/.well-known/`, redeploy).
4. Create the app in **Play Console** → https://play.google.com/console → upload the `.aab`.
   (Docs: https://docs.pwabuilder.com/#/builder/android)

### iOS → App Store (more involved — Apple won't take a raw PWA)
Wrap it with **Capacitor** (https://capacitorjs.com) on a Mac with **Xcode**:
```bash
pnpm add @capacitor/core @capacitor/ios
pnpm dlx @capacitor/cli init Syft com.syft.app --web-dir=public
pnpm dlx @capacitor/cli add ios
# point the app at your hosted URL in capacitor.config — server.url = your Railway domain
pnpm dlx @capacitor/cli open ios     # opens Xcode → Archive → upload to App Store Connect
```
App Store Connect: https://appstoreconnect.apple.com · Guide: https://capacitorjs.com/docs/ios

*(Ask and I'll scaffold either wrapper — including the `capacitor.config` and the
`.well-known/assetlinks.json` — into the repo for you.)*

---

## Updating later

- **Change profiles / seed pool:** edit `data/profiles.seed.ts` → `pnpm embed:seed` →
  `pnpm db:seed` (push to Supabase) → `railway up`.
- **Code changes:** `railway up` (CLI) or push to the connected GitHub repo.

## Cost sanity

"Embed once, rank cheap" holds in production: each search makes **0** per-profile embedding
calls and **≤6** LLM calls total, independent of pool size — so inference cost tracks users,
not searches.
