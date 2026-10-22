# OpportunityKit Deployment Guide & Checklist

Comprehensive guide for deploying **OpportunityKit** (SETU 2026 Hackathon, Problem Statement PS-03).

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS deployed on **Vercel**
- **Backend:** Node.js + Express + TypeScript deployed on **Render** (Web Service)
- **Shared Library:** Pure TypeScript types, parser, rule engine, and feature flags in `@opportunity-kit/shared`
- **Data & Auth:** Supabase (Postgres + Auth) with automatic `localStorage` fallback

---

## 1. Quick Reference: Deployment Commands & Scripts

| Command | Purpose |
|---|---|
| `npm run wake -- <backend-url>` | Manually pings and polls the Render `/health` endpoint until the instance wakes from cold sleep |
| `npm run smoke -- <frontend-url> <backend-url>` | Comprehensive live smoke test checking `/health`, CORS headers, frontend accessibility, sample parse, and 3 Match / 1 Mismatch / 2 Missing info benchmark evaluation |
| `npm run build:render` | Installs & builds shared package followed by backend (`npm run build:shared && npm run build:backend`) |
| `npm run test:sample` | Validates benchmark data (3 Match, 1 Mismatch, 2 Missing info) against pure TypeScript engine |

---

## 2. Render Deployment (Backend Service)

### 2.1 Web Service Configuration
1. Log in to [Render Dashboard](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository containing the OpportunityKit monorepo.
3. Configure the service settings:
   - **Name:** `opportunitykit-backend` (or your preferred name)
   - **Region:** Select closest to your judges/audience (e.g. Frankfurt, Oregon, Singapore)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank — repository root)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build:shared && npm run build:backend
     ```
   - **Start Command:**
     ```bash
     node backend/dist/index.js
     ```
   - **Instance Type:** `Free` (see Free-Tier Notes below)
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** `Yes`

### 2.2 Server Network & Port Binding
The backend server in `backend/src/index.ts` is explicitly configured to bind to `0.0.0.0` and listen on `process.env.PORT` (automatically assigned by Render):
```ts
const port = Number(process.env.PORT) || 5000;
const host = '0.0.0.0';
app.listen(port, host, () => {
  console.log(`[OpportunityKit Backend] Listening on http://${host}:${port}`);
});
```

### 2.3 Backend Environment Variables
In the Render dashboard, navigate to **Environment** and add the following environment variables (no secret values should ever be committed to git):

| Variable Name | Required | Default / Example Value | Purpose & Description |
|---|---|---|---|
| `PORT` | Auto | *(Provided by Render)* | Port the Express server listens on (bound to `0.0.0.0`). |
| `DEMO_MODE` | **Yes** | `true` | When `true`, returns cached benchmark evidence and ensures 100% reliable demo flow. |
| `ALLOWED_ORIGINS` | **Yes** | `https://opportunitykit.vercel.app,http://localhost:3000` | Exact Vercel production URL, preview URLs, and localhost for CORS access. |
| `DEFAULT_LLM_PROVIDER` | No | `gemini` | Primary LLM gateway provider (`gemini`, `groq`, `openrouter`). |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Google Gemini API key (free tier default). |
| `GROQ_API_KEY` | Optional | `gsk_...` | Groq API key (free tier fallback). |
| `OPENROUTER_API_KEY` | Optional | `sk-or-...` | OpenRouter API key (free tier fallback). |
| `OPENAI_API_KEY` | Optional | `sk-...` | Optional paid OpenAI key (used only if student has credits). |
| `XAI_API_KEY` | Optional | `xai-...` | Optional paid xAI / Grok key. |
| `FEATURE_SCAM_CHECKER` | No | `true` | Feature flag: Enable scam & legitimacy inspection route. |
| `FEATURE_AGENT_EVIDENCE` | No | `true` | Feature flag: Enable AI multi-agent evidence gathering. |
| `FEATURE_SUPABASE_SYNC` | No | `false` | Feature flag: Set `false` for zero-credential offline demo, `true` for live Supabase sync. |
| `FEATURE_PDF_EXPORT` | No | `true` | Feature flag: Client-side PDF export. |
| `FEATURE_CALENDAR_EXPORT` | No | `true` | Feature flag: `.ics` calendar export. |
| `FEATURE_ACTION_PLAN` | No | `true` | Feature flag: Action plan next steps generator. |
| `FEATURE_LIVE_LLM` | No | `true` | Feature flag: Allow fallback to live LLM gateway. |
| `SUPABASE_URL` | Optional | `https://xyzcompany.supabase.co` | Supabase backend connection URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | `eyJ...` | Supabase secret service-role key (server-side only; never `NEXT_PUBLIC_`). |
| `EVIDENCE_STORE` | Optional | *(unset)* or `json` | Unset uses Supabase when the keys above are set. `json` forces the local file store. |
| `EVIDENCE_STORE_PATH` | Optional | `data/evidence.json` | Path for the local JSON evidence file. **Not durable on Render free disk.** |

---

## 3. Vercel Deployment (Frontend Web App)

### 3.1 Project Import & Build Settings
1. Log in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
2. Select your GitHub repository.
3. In the project setup screen, configure:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend`
   - **Build & Development Settings:**
     - Build Command: `next build` *(Note: `frontend/package.json` contains `"prebuild": "npm run build --prefix ../shared"` which automatically builds the shared package before Next.js builds)*.
     - Output Directory: `.next` (default)
     - Install Command: `npm install` (or leave default)

### 3.2 Monorepo Configuration
The frontend's `next.config.mjs` contains:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@opportunity-kit/shared'],
  reactStrictMode: true
};

export default nextConfig;
```
This ensures Next.js correctly bundles and transpiles code from the shared TypeScript package.

### 3.3 Frontend Environment Variables
In Vercel **Project Settings** → **Environment Variables**, configure:

| Variable Name | Required | Example Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://opportunitykit-backend.onrender.com` | Live HTTPS URL of your Render backend web service (no trailing slash). |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | `https://xyzcompany.supabase.co` | Supabase project URL for authentication & client sync. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | `eyJhbGciOi...` | Supabase public anonymous key. |

> [!IMPORTANT]
> **NEXT_PUBLIC Variables are Baked in at Build Time:**
> In Next.js, all environment variables prefixed with `NEXT_PUBLIC_` are statically embedded into client JavaScript bundles during `next build`.
> If you add, change, or update `NEXT_PUBLIC_API_URL`, you **MUST trigger a redeployment in Vercel** (with "Clear build cache") for the changes to take effect in the browser.

---

## 4. Supabase Configuration (Authentication, Redirect URLs & Evidence Migration)

If using Supabase Authentication & Sync:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Navigate to **Authentication** → **URL Configuration**.
3. Set the **Site URL** to your production Vercel URL:
   ```
   https://opportunitykit.vercel.app
   ```
4. In the **Redirect URLs** list, add:
   - Production URL: `https://opportunitykit.vercel.app/**`
   - Local Development: `http://localhost:3000/**`
   - Preview Deployments (wildcard): `https://*-<your-vercel-team>.vercel.app/**`
5. Click **Save Changes**.

### 4.1 Evidence store SQL migration

The server evidence store is append-only Postgres: `evidence_versions` (primary key `evidence_id` + `version`), `sync_ops` (idempotent `op_id`), and the `evidence_current` view (highest version per evidence id). Row level security limits each user to their own rows. The backend never updates or deletes version rows.

1. Open **Supabase Dashboard** → **SQL Editor** → **New query**.
2. Paste the contents of `backend/migrations/001_evidence.sql` and run it.
3. Confirm the tables exist under **Table Editor**: `evidence_versions`, `sync_ops`, and the view `evidence_current`.
4. On **Render** (backend only), set:
   - `SUPABASE_URL` — project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — **service role** key (server-side only; never add this to Vercel or any `NEXT_PUBLIC_*` variable)
5. Leave `EVIDENCE_STORE` unset so the backend uses Supabase. Set `EVIDENCE_STORE=json` only for local development without a project.
6. Optional re-run: the migration uses `IF NOT EXISTS` / `CREATE OR REPLACE`, so applying it again is safe.

> [!IMPORTANT]
> Do not put `SUPABASE_SERVICE_ROLE_KEY` in the frontend. The browser uses the anon key; the Express process uses the service role key to write evidence on behalf of sync routes.

### 4.2 Local JSON fallback (not durable)

Without `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, the backend writes `backend/data/evidence.json` (or `EVIDENCE_STORE_PATH`). That file is for local development only. **Render’s free disk is not persistent** — it is cleared when the free instance sleeps or is rebuilt — so do not rely on the JSON file in production.

---

## 5. Free-Tier Operational Notes & Latency Management

### 5.1 Render Free-Tier Spin-Downs
- **Inactivity Timeout:** A free Render Web Service automatically spins down (goes to sleep) after **15 minutes without inbound traffic**.
- **Cold Boot Latency:** When sleeping, the next incoming request takes **50 to 90 seconds (about a minute)** to wake the container and respond.
- **Monthly Instance Hours:** Render accounts have a monthly allotment of free instance hours (~750 hours shared across all free services). Verify the current terms on [Render's Pricing Page](https://render.com/pricing).
- **Demo Week Recommendation:** During the hackathon demo week and live judging, strongly consider upgrading the Web Service to the paid **Starter instance ($7/month)** to eliminate cold starts and ensure instant response times for judges.

### 5.2 Automatic Frontend Keep-Alive Ping
To prevent the Render instance from spinning down while a user or judge is reviewing the app, the frontend includes a client-side keep-alive worker (`KeepAlivePing.tsx` mounted in `RootLayout`):
- Pings `${NEXT_PUBLIC_API_URL}/health` every **4 minutes**.
- Listens to `visibilitychange` so when a user switches back to an open tab, it triggers an immediate keep-alive ping if more than 4 minutes have elapsed.
- Silently handles network errors so the user experience is never interrupted.

### 5.3 Offline & Sleeping Resilience
OpportunityKit is designed so the core student experience **never breaks** even if the backend is cold, sleeping, or completely offline:
- Both the deterministic Rule Parser and the Rule Engine are packaged in `@opportunity-kit/shared` and imported directly into the Next.js frontend.
- When an evaluation is requested, the frontend attempts to call the backend with an internal timeout. If the backend is cold or unavailable, the browser instantly executes the rule engine locally with 0ms latency!

### 5.4 Manual Wake-Up Script
Before starting a live demo or presentation to hackathon judges, run the manual wake script:
```bash
npm run wake -- https://your-backend.onrender.com
```
This script polls the `/health` endpoint every 3 seconds, displays a live elapsed timer, and verifies when the backend is fully awake and ready.

---

## 6. Smoke Testing & Verification

Once both frontend and backend are deployed, execute the automated smoke test:

```bash
npm run smoke -- <frontend-url> <backend-url>
```
*Example:*
```bash
npm run smoke -- https://opportunitykit.vercel.app https://opportunitykit-backend.onrender.com
```

### What the Smoke Test Verifies:
1. **Backend Health Check:** Calls `/health`, confirms HTTP 200, checks `{ status: "ok" }`, and measures latency.
2. **CORS Validation:** Sends request with `Origin: <frontend-url>` and verifies that `Access-Control-Allow-Origin` allows the frontend URL.
3. **Frontend Availability:** Validates that the live Next.js app responds with HTTP 200.
4. **Part 5 - Sample Opportunity Parse:** POSTs the benchmark opportunity description to `/api/parse-opportunity` and confirms 6 parsed requirements.
5. **Part 6 - Benchmark Comparison Engine:** POSTs the benchmark opportunity and student profile to `/api/evaluate` and asserts:
   - **3 Match** (Year, CGPA, Resume)
   - **1 Mismatch** (Skills missing JavaScript)
   - **2 Missing info** (Portfolio/GitHub and Availability)
   - Verdict: **"Not ready to apply yet"**
   - Invariant: "Unknown" is never treated as fails.

---

## 7. Deployment Checklist

Print or review this checklist before submitting or presenting:

- [ ] **Render Service Active:** Web service status is green / live on Render.
- [ ] **Render Health Check Configured:** Health check path set to `/health`.
- [ ] **Render Host Binding:** Express binds to `0.0.0.0` and listens on `process.env.PORT`.
- [ ] **Render CORS Configuration:** `ALLOWED_ORIGINS` includes the exact Vercel URL (e.g. `https://opportunitykit.vercel.app`).
- [ ] **Render LLM Keys & Demo Mode:** `DEMO_MODE=true` is set (or live API keys provided).
- [ ] **Vercel Build Prebuild Hook:** `frontend/package.json` contains `"prebuild": "npm run build --prefix ../shared"`.
- [ ] **Vercel Transpile Config:** `transpilePackages: ['@opportunity-kit/shared']` in `next.config.mjs`.
- [ ] **Vercel API URL Configured:** `NEXT_PUBLIC_API_URL` points to live Render service HTTPS URL.
- [ ] **Vercel Redeployed After Env Changes:** Triggered fresh deployment after saving `NEXT_PUBLIC_*` variables.
- [ ] **Supabase Redirect URLs:** Vercel production URL and `http://localhost:3000` added to allowed redirects.
- [ ] **Evidence migration applied:** `backend/migrations/001_evidence.sql` run in the Supabase SQL editor; `SUPABASE_SERVICE_ROLE_KEY` set on Render only.
- [ ] **Wake Script Verified:** `npm run wake -- <backend-url>` reports `✓ BACKEND IS AWAKE AND HEALTHY!`.
- [ ] **Smoke Test Verified:** `npm run smoke -- <frontend-url> <backend-url>` passes all 5 tests.
- [ ] **Demo Week Instance Plan:** Reviewed Render instance hours and considered Starter instance for zero cold boot latency.
