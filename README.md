# OpportunityKit ⚡ (SETU 2026 — Problem Statement PS-03)

> **"Know if you qualify, what you miss, and what to do next."**  
> **Core Principle:** AI agents gather evidence; a transparent, rule-based engine (plain TypeScript, no AI) makes the final decision.  
> Every agent cites verbatim evidence, returns confidence metrics, and only suggests: the student confirms before anything counts. LLM output never decides Match, Mismatch or Missing info.

---

## 🏛️ Monorepo Architecture

The repository is structured as a clean npm workspace with 3 packages:

```
SETU_Workshop/
├── package.json               # Root workspaces configuration & single-command scripts
├── shared/                    # Pure TypeScript (Zero AI / No external network dependencies)
│   ├── src/
│   │   ├── lib/types/         # Zod schemas & TypeScript types (Profile, Requirement, Evaluation)
│   │   ├── lib/parser/        # Deterministic Rule Parser (extracts eligibility criteria)
│   │   ├── lib/engine/        # Transparent Rule Engine (plain TypeScript rule evaluation)
│   │   ├── lib/data/          # Benchmark sample data & test suites
│   │   └── lib/flags.ts       # Feature flags for Parts 16 to 22
│   └── tests/
│       ├── sample.test.ts     # Automated unit test verifying benchmark PS-03 criteria
│       └── parser.test.ts     # Automated tests for 4 benchmark opportunities
├── backend/                   # Node.js + Express + TypeScript (Deployed on Render)
│   ├── src/
│   │   ├── lib/llm/           # Provider-agnostic gateway (Gemini, Groq, OpenRouter, DEMO_MODE)
│   │   ├── lib/agents/        # Evidence extractors with citations & Zod schemas
│   │   │   └── scamChecker.ts # Heuristic & rule-based fraud/scam screening
│   │   └── index.ts           # Express REST API routes (/api/evaluate, /api/parse-opportunity, etc.)
│   └── .env.example           # Environment variables template
└── frontend/                  # Next.js 15 (App Router) + Tailwind CSS (Deployed on Vercel)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx       # Homepage with 1-click Demo loader, 5-step strip, sample preview
    │   │   ├── check/         # Large textarea, editable checklist with parse warnings & manual CRUD
    │   │   ├── profile/       # Master student profile (localStorage + Supabase fallback, link validation)
    │   │   ├── result/        # SummaryBar, audit table, inline fixes with instant recalculation, next steps
    │   │   ├── styleguide/    # Living design system, tokens, loading skeletons, failure alerts
    │   │   └── globals.css    # Editorial minimal design system (16px base, visible focus, high contrast)
    │   ├── components/        # Reusable UI components (Button, Card, Badge, SectionTitle, SummaryBar)
    │   │   ├── Badge.tsx      # Dual-coded status badges: Match (#2F7D5B), Mismatch (#C0453A), Missing info (#D98A1F)
    │   │   ├── Footer.tsx     # Editorial footer with persistent Demo Mode toggle button
    │   │   └── LoadingSkeleton.tsx # Crisp wireframe skeletons & FailureAlerts for all 6 failure modes
    │   └── lib/               # Storage helper, offline engine fallback, analytics, flags, PDF/ICS export
```

---

## 🎨 Editorial Design System & Accessibility

- **Background:** Warm cream `#F1EEE6`
- **Text:** Near-black `#111111` (Contrast ratio > 15:1 against cream, far exceeds WCAG AAA)
- **Typography:**
  - Headlines: **Archivo Black** (bold, heavy uppercase, tracking-tight)
  - Body: **Inter** (minimum body text `16px`, line-height `1.6`)
- **Focus States:** High-visibility `:focus-visible` outline (`2px solid #111111 !important`, `outline-offset: 2px`)
- **Borders:** Thin black borders (`1px solid #111111`), zero soft gradients, zero drop shadows.
- **Dual-Coded Status Badges (Word + Color + Icon):**
  - **Match:** `#2F7D5B` with checkmark icon and explicit word `MATCH`
  - **Mismatch:** `#C0453A` with cross icon and explicit word `MISMATCH`
  - **Missing info:** `#D98A1F` with question icon and explicit word `MISSING INFO`
- **Lighthouse Accessibility Score:** 90+ compliant across mobile (375px) and desktop viewports.

---

## ⏱️ The 60-Second Hackathon Demo Script

*Deliver this live during judge presentation. Works 100% offline with zero internet required.*

| Time | Stage | Action & Spoken Script |
|---|---|---|
| **00:00 - 00:10** | **The Hook** | *"College students spend hours applying to internships and scholarships, only to get rejected because of a single hidden criterion. LLMs hallucinate Yes/No answers. OpportunityKit solves this."* |
| **00:10 - 00:20** | **Home Page** | Navigate to `/`. *"Here is OpportunityKit: 'Know if you qualify, what you miss, and what to do next.' Notice the 5-step editorial architecture. In the footer, Demo Mode is ON—meaning everything runs 100% locally with zero internet dependency."* |
| **00:20 - 00:30** | **1-Click Demo** | Click **"⚡ Run the Sample Demo"** button on the hero. *"In one click, we load Alex Sharma's master academic profile and a messy summer internship posting. Notice how fast it audits—in 8 milliseconds."* |
| **00:30 - 00:40** | **Transparent Audit** | Point to the **SummaryBar**: *"Look at our clear verdict: '3 Match · 1 Mismatch · 2 Missing info → Not ready to apply yet'. Note our invariant guarantee: 'Unknown is never treated as fails.' If an answer is unknown, it is strictly Missing info."* |
| **00:40 - 00:50** | **Instant Inline Fix** | Scroll to the **Portfolio / GitHub** row in the audit table. *"Notice the inline fix field. The student enters `https://github.com/alexsharma` and clicks Save. Watch the badge: without a page reload, the status instantly flips from Missing info to Match, and the readiness progress bar recalculates in real-time."* |
| **00:50 - 01:00** | **Concrete Action Plan** | Scroll down to the numbered **Next Steps**: *"Instead of generic advice, OpportunityKit outputs prioritized next steps: fix the JavaScript skill gap, confirm 8 weeks availability, and export to PDF or Google Calendar. Deterministic, transparent, and student-first."* |

---

## 🧪 Benchmark Verification Data

The entire pipeline is verified against the benchmark sample data:

- **Opportunity:**  
  *"2nd or 3rd-year B.Tech/B.E. student. CGPA 7.5 or above. Skills: HTML, CSS, JavaScript. Resume required. Portfolio or GitHub link required. Available for 8 weeks."*
- **Profile:**  
  *2nd-year B.Tech CSE, CGPA 8.2, skills HTML, CSS, Python, resume ready, no GitHub/portfolio link, availability not provided.*
- **Expected Results:**
  1. **Year of Study:** `MATCH` (2nd year matches 2nd or 3rd year requirement via `rangeRule`)
  2. **CGPA:** `MATCH` (8.2 meets minimum 7.5 via `numberRule`)
  3. **Technical Skills:** `MISMATCH` (Missing required skill: JavaScript via `listRule`)
  4. **Resume:** `MATCH` (Resume ready and verified via `documentRule`)
  5. **Portfolio / GitHub Link:** `MISSING INFO` (Neither provided in profile via `linkRule`)
  6. **Availability:** `MISSING INFO` (Availability not specified in profile via `availabilityRule`)
- **Summary:** **3 Match**, **1 Mismatch**, **2 Missing info**
- **Overall Verdict:** `Not ready to apply yet` (Never just Yes/No: includes concrete action plan).

---

## 🚀 Running Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Install Dependencies
Run from the repository root:
```bash
npm install
```

### 3. Run Automated Unit & Integration Tests
Run Vitest across the entire workspace (50+ tests covering parser, engine, storage, and benchmarks):
```bash
npm test
```
Or run the vitest runner directly:
```bash
npm run test:vitest
```

### 4. Run Both Frontend and Backend Concurrently (One Command)
```bash
npm run dev
```
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Styleguide Route:** [http://localhost:3000/styleguide](http://localhost:3000/styleguide)

### 6. Server evidence store (local vs Supabase)

The backend keeps every student/opportunity fact as versioned, append-only rows (`backend/src/store`). Writes never update or delete history.

- **With Supabase:** set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` (service role key is server-side only). Apply `backend/migrations/001_evidence.sql` in the Supabase SQL editor — see `DEPLOY.md`.
- **Without Supabase (local default):** the same store interface writes `backend/data/evidence.json`. This is fine for `npm run dev`. **It is not persistent on Render’s free disk** (the filesystem is wiped when the free instance sleeps or is rebuilt). Production sync should use Supabase, not the JSON file.

### 5. Build for Production
```bash
npm run build
```

---

## 🛡️ Failure States & Resilient Error Handling

OpportunityKit implements friendly, dedicated error cards (`<FailureAlert />`) and loading wireframes (`<TableSkeleton />`, `<SummarySkeleton />`) for all 6 failure modes:

| Failure Mode | Trigger / Scenario | User Experience & Recovery |
|---|---|---|
| **Empty Paste** | Empty textarea on `/check` or empty evaluation | Explains requirement and provides a 1-click **"Load Benchmark Opportunity"** button. |
| **Unparseable Text** | Text with no detectable criteria | Friendly notice with **"+ Add Requirement Manually"** button to define criteria. |
| **Invalid Link** | Incorrect profile link format (e.g. invalid GitHub) | Clear inline format error: *"This doesn't look like a GitHub profile link. Try github.com/username."* |
| **Missing Profile** | Student visits `/check` or `/result` without credentials | Explains missing profile and provides 1-click **"Load Benchmark Profile (Alex Sharma)"**. |
| **Agent Timeout** | Free Render instance sleeping or offline | Seamlessly falls back to client-side deterministic evaluation with zero user disruption. |
| **Rate Limit** | External AI provider rate limits hit | Automatically uses cached benchmark agent citations so presentations never break. |

---

## 🚩 Feature Flags (`/lib/flags.ts`)

All modular additions are centrally controlled via `/lib/flags.ts` (shared across frontend and backend):

| Flag | Description | Default |
|---|---|---|
| `ENABLE_SCAM_CHECKER` | Part 16: Scam & fraudulent listing screening | `true` |
| `ENABLE_AGENT_EVIDENCE` | Part 17: Multi-agent citations & student confirmation | `true` |
| `ENABLE_SUPABASE_SYNC` | Part 18: Supabase database sync (localStorage fallback default) | `false` |
| `ENABLE_PDF_EXPORT` | Part 19: Printable checklist PDF export | `true` |
| `ENABLE_CALENDAR_EXPORT` | Part 20: Application deadline `.ics` export | `true` |
| `ENABLE_ACTION_PLAN_GENERATOR` | Part 21: Next steps action plan generator | `true` |
| `ENABLE_LIVE_LLM_GATEWAY` | Part 22: Live free-tier LLM fallback chain | `true` |

---

## 🔒 Privacy & Student-First Guarantee

- **Local Storage Default:** All profile data and evaluations persist locally in the student's browser.
- **Link Privacy:** We only validate the URL format; we never access, scrape, or log in to student accounts.
- **Explainability:** Every requirement audit finding cites the verbatim source sentence and the exact deterministic rule used (`numberRule`, `rangeRule`, `listRule`, `linkRule`, etc.).
