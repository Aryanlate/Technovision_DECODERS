# OpportunityKit — Project Prompts & Implementation Reference

> Consolidated from `OpportunityKit_Antigravity_Build_Plan_original(1).docx` and `OpportunityKit_Offline_First_Evidence_Prompts.docx`. Source prompts and checkpoints are retained and organized below. Use the build plan first, then the offline-first evidence pack as an architectural upgrade.

## Quick navigation
- Project vision, architecture, workflow and non-negotiable rules
- Original build plan: Parts 1–22
- Offline-first evidence model: Prompts 1–12
- Acceptance checks, deployment notes and caveats

## Recommended order of work
1. Read the Master Context and save it as `MASTER_CONTEXT.md` in the repository root.
2. Complete and test the original build plan Parts 1–9 first; Parts 5 (rule engine) and 6 (parser) are core dependencies.
3. Keep demo mode functional and deploy the skeleton early; test locally before pushing.
4. Apply the offline-first evidence pack Prompts 1–12 in order. Prompt 1 updates `MASTER_CONTEXT.md`; later prompts depend on it.
5. Run the checkpoint after each prompt, commit and push each working change, and keep unfinished extras behind feature flags.


---

# Part A — Original Antigravity Build Plan


# How to use this plan

- Paste the Master Context only once, in your first session together with Part 1. Part 1 saves it as MASTER_CONTEXT.md in the repo. Every later part already begins with a line telling Antigravity to read that file, so from Part 2 onward you paste only that part’s prompt.

- If you change a decision (a provider, a folder name, a rule), edit MASTER_CONTEXT.md first so every future session follows the new version. Keep the file short.

- If Antigravity ignores a rule, quote it back: “MASTER_CONTEXT.md says the comparison engine must be pure rules. Fix this.”

- Give Antigravity one part per session. If it drifts, say: “Only touch the files listed in this part.”

- Test the checkpoint at the end of each part and commit before moving on.

- Deploy a tiny version (health check plus one page) right after Part 1, using the steps in Part 2, so deployment problems show up early.

- Always get a change working locally first (npm run dev), then push to GitHub so Vercel and Render redeploy, and run npm run smoke on the live URLs.

- Parts 5 and 6 (rule engine and parser) are the core. They must pass the sample (3 Match, 1 Mismatch, 2 Missing info) before anything is built on top.

- Put the Gemini API key in .env.local. Never paste keys into prompts.

- Keep demo mode on while presenting, and test it with the Wi-Fi off.

- After each part, ask: “Run the tests and the app, and list anything that does not work.”

- Never let agents decide statuses. If AI ends up in the comparison engine, say: “Move that back to a pure rule function.”

- Start with GEMINI_API_KEY from Google AI Studio, then add GROQ_API_KEY and OPENROUTER_API_KEY as free fallbacks. OpenAI and xAI keys are optional because they need paid credits. The gateway skips missing keys, so the app runs with one key, or none in demo mode.

- Use sample data only while on free tiers, and check each provider’s current free limits before demo day.


# Master Context (paste once, with Part 1)

Paste this box together with the Part 1 prompt in your first session. Part 1 saves it as MASTER_CONTEXT.md in the repo root. After that you do not paste it again: every later prompt starts with a line telling Antigravity to read the file. A new session does not remember earlier sessions, which is why the file lives in the repo.

Optional: if Antigravity has a project rules or instructions feature that loads a file automatically, you can put the Master Context there as well. Check its current documentation for the exact name and location.


| MASTER CONTEXT
Project: OpportunityKit, a web app for the SETU 2026 hackathon (PS-03).
Goal: a student creates a profile once (with projects and links), pastes an internship/scholarship/competition description, and the app builds a checklist and compares it with the profile. Each requirement gets one status: Match, Mismatch, or Missing info, with a short reason. "Unknown" must never be treated as "fails": if the profile has no answer, the status is Missing info. The result page shows a summary and next steps, never just yes/no.

Core principle: AI agents gather evidence; a transparent, rule-based engine (plain TypeScript, no AI) makes the final decision.
Agents are pretrained LLMs specialised by a role prompt, tools, a strict JSON schema (validated with zod) and few-shot examples. No fine-tuning. Every agent must cite evidence or sources, return a confidence, and only suggest: the student confirms before anything counts. LLM output never decides Match, Mismatch or Missing info.

Architecture: a monorepo with three packages. /frontend = Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel. /backend = Node.js + Express + TypeScript, deployed on Render (free web service). /shared = types, rule parser, rule engine and feature flags as pure TypeScript used by both sides. Folder mapping for every prompt in this plan: /lib/engine, /lib/parser, /lib/types, /lib/data and /lib/flags.ts live in /shared; /lib/llm, /lib/agents, the scam checker and every /api/... route live in /backend as Express routes; pages, components, the storage helper, PDF and calendar export live in /frontend. All LLM keys and agent code stay in the backend only. The frontend also runs the parser and rule engine itself, so the core flow works even if the backend is asleep or offline. Everything must run locally with one command (npm run dev) and in production on Vercel plus Render using only environment variable changes.
Stack details:  Data: Supabase (Auth + Postgres) with a localStorage fallback so the demo works without login. LLM layer: a provider-agnostic gateway (/lib/llm) that uses FREE-tier models by default: Google Gemini (main), Groq and OpenRouter free models (fallbacks). OpenAI and Grok (xAI) are optional and only used if the student has paid credits. Each agent is assigned a provider and model through environment variables, with a fallback chain (assigned provider, then the next free provider, then cached demo result). Providers without an API key are skipped automatically. Use sample data only, never real student data, because free tiers may use inputs to improve provider products. DEMO_MODE=true returns cached sample results.

Design: editorial, minimal. Cream background #F1EEE6, near-black text #111111, bold heavy uppercase headlines (Archivo Black), body Inter. Thin black borders, no gradients, no shadows. Status colors only on badges: Match #2F7D5B, Mismatch #C0453A, Missing info #D98A1F. Every badge shows a word, not just a color. Mobile-first, responsive, minimum body text 16px.

Sample data that must work end to end:
Opportunity: "2nd or 3rd-year B.Tech/B.E. student. CGPA 7.5 or above. Skills: HTML, CSS, JavaScript. Resume required. Portfolio or GitHub link required. Available for 8 weeks."
Profile: 2nd-year B.Tech CSE, CGPA 8.2, skills HTML, CSS, Python, resume ready, no GitHub/portfolio link, availability not provided.
Expected: Year Match, CGPA Match, Skills Mismatch (JavaScript missing), Resume Match, Portfolio/GitHub Missing info, Availability Missing info. Summary: 3 Match, 1 Mismatch, 2 Missing info, "Not ready to apply yet".

Feature flags: every optional feature from Parts 16 to 22 sits behind a flag in /lib/flags.ts so unfinished features can be switched off for the demo.
Rules: keep files small and typed, one responsibility per file, add short comments, no hard-coded secrets, handle empty and wrong input with clear messages. |
| --- |


# Build Order and Priorities


| Priority | Parts | Why |
| --- | --- | --- |
| Must work (Completeness, 35 marks) | 1 to 9 | Skeleton, live deployment, design system, rule engine, parser, profile, check and result pages, polish and demo mode |
| Business case (30 marks) | 10, 20 | Pricing, college dashboard, partner checklists, sustainability |
| Wow and Innovation (20 marks) | 11, 12, 13, 14, 15, 16 | LLM gateway, agents, research, discovery, readiness score and what-if |
| UI/UX (15 marks) | 3, 8, 9, 16, 19 | Design system, result page, polish, languages, themes, accessibility |
| Trust and safety | 17 | Scam warnings, privacy, delete my data |
| Retention and usefulness | 18, 21 | Tracker, PDF, calendar export, learning links, roadmap |
| Reliability and stretch | 22 | Status page, logging, regression tests, optional OCR |

Build in the order of the parts. The parts are now numbered in build and deployment sequence, so you can simply go from Part 1 to Part 22. Parts 1 to 9 give you a working, deployed, demo-ready product (skeleton, live deployment, core flow, polish). Part 10 adds the business case, Parts 11 to 15 add the AI agents, and Parts 16 to 22 are extras added behind flags. If time runs short, stop after any part from Part 9 onward and you still have a reliable demo.


# Architecture, Local Run and Deployment


| Package | Runs on | Contains |
| --- | --- | --- |
| /frontend | Vercel (locally: port 3000) | Pages, components, tracker, PDF and calendar export, languages, themes, the shared engine for instant results |
| /backend | Render (locally: port 4000) | LLM gateway, agents, scam checker, share links, logging, all AI API keys |
| /shared | Both sides | Types, rule parser, rule engine, feature flags (pure TypeScript, no AI) |
| Supabase | Cloud | Auth, profiles, tracker, share snapshots |


### Run everything locally


| Where | File | Key settings |
| --- | --- | --- |
| frontend | .env.local | NEXT_PUBLIC_API_URL=http://localhost:4000 and the Supabase public keys |
| backend | .env | PORT=4000, ALLOWED_ORIGINS=http://localhost:3000, DEMO_MODE=true, GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY |
| root | command | npm run dev starts shared, backend and frontend together |

The same code runs locally and in production. Only the environment variables change. With DEMO_MODE=true the full sample flow works even with the internet unplugged.


### Deployment settings (details in Part 2)


| Host | Setting | Value |
| --- | --- | --- |
| Vercel | Root Directory | frontend |
| Vercel | Environment variables | NEXT_PUBLIC_API_URL (https Render URL), Supabase public keys. Redeploy after any change. |
| Render | Service type | Web Service, build shared then backend, start node backend/dist/index.js |
| Render | Port and health | Listen on the PORT variable at 0.0.0.0, health check path /health |
| Render | Environment variables | All AI keys, DEMO_MODE, Supabase server settings, ALLOWED_ORIGINS = exact Vercel URL |
| Supabase | Redirect URLs | Add the Vercel URL and http://localhost:3000 |


### Render free-tier cautions

- A free web service spins down after about 15 minutes without traffic and takes roughly a minute to wake. Wake it before the demo.

- Free instance hours are limited each month. Free Render Postgres databases expire, so keep data in Supabase.

- The frontend shows “Waking up the agents...” and falls back to the in-browser rule engine plus cached demo data after 8 seconds.

- The paid Starter instance removes the spin-down if you want zero cold starts for demo week.

- Terms change often, so verify them on Render’s pricing page.


### Common deployment problems and fixes


| Problem | Fix |
| --- | --- |
| Vercel build fails in the monorepo | Set Root Directory to frontend and build shared first |
| “Cannot find module shared” only when deployed | Build shared before frontend and backend, and test a clean install |
| Render service unreachable | Listen on the PORT variable at 0.0.0.0 |
| Browser blocks calls to the backend (CORS) | Set ALLOWED_ORIGINS to the exact Vercel URL, including the preview URL if used |
| Feature silently fails live | Check every environment variable on each host |
| NEXT_PUBLIC change has no effect | Redeploy the frontend, because these are baked in at build time |
| Mixed content blocked | Use the https Render URL in NEXT_PUBLIC_API_URL |
| Login works locally but not live | Add the Vercel URL to Supabase redirect URLs |


### Pre-demo test list

- Test on the live URLs, from a phone on mobile data, not only localhost.

- Run the sample end to end live: profile, paste, checklist, result (3 Match, 1 Mismatch, 2 Missing info).

- Let the backend sleep, then confirm the fallback works and the sample still shows.

- Remove the Gemini key on Render and confirm the rule-based result and cached demo still work.

- Open the browser network tab and confirm no API key appears anywhere.

- Run npm run smoke against both live URLs.

- An hour before: ping /health, run the full demo once, and keep a screen recording as a backup.

- Switch off any unfinished feature with its flag.


# Multi-API Agent Design

Every agent is a pretrained LLM from a free provider (Gemini as main, Groq and OpenRouter as fallbacks) specialised without any training. An agent is: a role prompt + allowed tools + a strict JSON schema + 2 to 3 few-shot examples + an assigned provider. The decision about Match, Mismatch or Missing info never comes from an LLM.


### Free providers used (verify current limits on each official page)


| Provider | Cost | Role in OpportunityKit | Key needed |
| --- | --- | --- | --- |
| Google Gemini (AI Studio) | Free tier on eligible text models (Flash and Flash-Lite style models) | Main provider for all LLM agents, plus Google Search grounding for research | GEMINI_API_KEY (required) |
| Groq | Free, rate-limited tier | Fast fallback for extraction tasks | GROQ_API_KEY |
| OpenRouter | Free models (ids ending in :free), small daily allowance | Second fallback, and a way to try many models with one key | OPENROUTER_API_KEY |
| OpenAI | Prepaid, not reliably free | Optional, only if you already have credits | OPENAI_API_KEY (optional) |
| Grok (xAI) | Prepaid API, no standing free tier | Optional, only if you have credits or promo access | XAI_API_KEY (optional) |


### Agent to provider assignment (default chain: Gemini, then Groq, then OpenRouter)


| Agent | Primary | Fallbacks | Real facts come from | Output | Built in |
| --- | --- | --- | --- | --- | --- |
| GitHubAnalyzer | Gemini Flash-Lite | Groq, OpenRouter | GitHub REST API | Skills and projects with repo evidence | Part 13 |
| LinkedInAnalyzer | Gemini Flash | Groq | Text the student pastes | Skills, education, experience | Part 13 |
| OpportunityReader | Gemini Flash (JSON mode) | Groq, OpenRouter | Rule parser, then listing text | Requirements with source sentence | Part 14 |
| ResearchAgent | Gemini with Google Search grounding | Cached demo result | Web search with sources | Extra requirements with URLs | Part 14 |
| DiscoveryAgent | Gemini | Curated list of 12 | Web search or curated list | Related opportunities with links | Part 15 |
| VerifierAgent | None (rules) | None | URL and domain checks | Verified / Needs review / Unverified | Part 14 |
| Orchestrator | None (plain code) | None | Agent results | Run order and progress | Part 12 |
| Comparison Engine | Never an LLM | None | Visible rules | Match / Mismatch / Missing info | Part 5 |

Free-tier cautions: (1) Free tiers have low rate limits, so the gateway counts requests, caches prompts and falls back to the next provider, then to cached demo results. (2) Free tiers may use your inputs to improve provider products, so test with sample profiles only. (3) Web search is the weakest free capability, so every researched fact needs a source and the demo must work from cache. (4) Limits, model names and terms change often, so check each provider’s official documentation before the demo. (5) Free tiers may restrict commercial use, which is fine for a hackathon prototype but must be rechecked before launching a paid product.


### How an agent is specialised (no fine-tuning)

- Role prompt: tells it exactly one job and what it must never do.

- Tools: real facts come from code (GitHub API, web search), not from the model’s memory.

- Strict JSON schema: output is validated with zod. Invalid output is retried once, then replaced by the rule-based or cached result.

- Few-shot examples: 2 to 3 sample inputs with correct outputs, built from your sample opportunities.

- Evidence rule: every claim cites a source, repo or sentence, plus a confidence of high, medium or low.

- Temperature near 0 for consistent results.

- Student confirms: agents suggest, the Suggestions inbox needs Accept before anything counts.

- Fine-tuning is future work, once you have a large set of real listings with correct checklists.


# Features Deliberately Left Out

These would add risk or break the “student stays in control” promise, so they are not in the plan:

- Real payment integration (payments stay mocked)

- A native mobile app (a responsive website is enough)

- Auto-applying to opportunities

- Connecting to social-media accounts (privacy and policy problems)

- Fine-tuning your own model (prompts, schemas and examples are enough)


## Part 1: Monorepo setup, folder structure, and local run

Foundation. Creates the three packages so the same code runs locally and on Vercel plus Render.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
First, save the Master Context text pasted above this prompt as MASTER_CONTEXT.md in the repo root, exactly as written, and commit it. It must stay short and be updated whenever a decision changes. Then set up an npm-workspaces monorepo with three packages. /frontend: Next.js (App Router, TypeScript, Tailwind), ESLint and Prettier. /backend: Node.js with Express and TypeScript (dev script with hot reload, build script that compiles to dist, start script that runs node dist/index.js). /shared: TypeScript package for types, the rule parser, the rule engine and flags, compiled with tsc and imported by both frontend and backend through the workspace. Create this structure: frontend/app (routes) and frontend/components; backend/src (routes, llm, agents); shared/src (types, engine, parser, data, flags). Backend requirements: listen on process.env.PORT (default 4000) bound to 0.0.0.0; GET /health returns {ok, uptime, demoMode}; CORS allows only the origins listed in ALLOWED_ORIGINS (comma separated, default http://localhost:3000); read all secrets from environment variables. Add frontend/.env.example with NEXT_PUBLIC_API_URL=http://localhost:4000, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY. Add backend/.env.example with PORT=4000, ALLOWED_ORIGINS=http://localhost:3000, DEMO_MODE=true, GEMINI_API_KEY (required, from Google AI Studio), GROQ_API_KEY and OPENROUTER_API_KEY (free fallbacks), OPENAI_API_KEY and XAI_API_KEY (optional, paid), LLM_FALLBACK_ORDER=gemini,groq,openrouter, per-provider limit settings (GEMINI_RPM, GEMINI_RPD, GROQ_RPM, GROQ_RPD, OPENROUTER_RPM, OPENROUTER_RPD), per-agent settings (AGENT_OPPORTUNITY_READER_PROVIDER, AGENT_OPPORTUNITY_READER_MODEL, and the same pair for GITHUB_ANALYZER, LINKEDIN_ANALYZER, RESEARCH, DISCOVERY), GITHUB_TOKEN (optional) and the Supabase server settings. Never expose backend keys to the frontend. Add root scripts: dev (starts shared watch, backend and frontend together, for example with concurrently), build (builds shared first, then backend and frontend), test and lint. Create placeholder frontend routes: /, /profile, /check, /result, /discover, /pricing, /college. On the home page show a small "Backend status" chip that calls GET /health. Add a README with local run steps. Do not build features yet. |
| --- |
```

**Checkpoint:** MASTER_CONTEXT.md exists in the repo root, and npm run dev starts frontend on port 3000 and backend on port 4000, the home page shows the backend status chip as online, and npm run build succeeds from a clean install.


## Part 2: Deployment on Vercel and Render

Deploy a tiny skeleton right after Part 1, then redeploy after every part. Frontend on Vercel, backend on Render.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Prepare and document deployment. Vercel (frontend): import the repo; set Root Directory to frontend; framework preset Next.js; make sure the shared package is built before the frontend build (for example a root install command plus a prebuild step, and transpilePackages or a built dist in next.config); set NEXT_PUBLIC_API_URL to the https URL of the Render service, plus NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY; remember that NEXT_PUBLIC variables are baked in at build time, so redeploy after changing them. Render (backend): create a Web Service from the same repo; build command installs dependencies and builds shared then backend; start command runs node backend/dist/index.js; the server must listen on the PORT environment variable on 0.0.0.0; set the health check path to /health; add every backend environment variable in the Render dashboard (all LLM keys, DEMO_MODE, Supabase server settings); set ALLOWED_ORIGINS to the exact Vercel production URL (and the preview URL if used). Supabase: add the Vercel URL and http://localhost:3000 to the allowed redirect URLs. Add a keep-alive ping from the frontend while the app is open, a manual wake-up script (npm run wake) that calls the Render /health URL, and a deploy checklist file DEPLOY.md with every step and variable name (no secret values). Add a smoke-test script (npm run smoke -- <frontend-url> <backend-url>) that checks /health and the CORS header against the live URLs, and once Parts 5 and 6 are built also checks the sample parse and the sample comparison result (3 Match, 1 Mismatch, 2 Missing info). Free-tier notes to record in DEPLOY.md: a free Render web service spins down after 15 minutes without traffic and takes about a minute to wake, and free instance hours are limited each month, so verify the current terms on Render's pricing page and consider the paid Starter instance during demo week. |
| --- |
```

**Checkpoint:** Both live URLs load with the placeholder page, the frontend shows the backend status as online, /health answers, and the smoke test passes. Repeat the smoke test after Parts 8 and 12 and try the full sample flow on a phone.


## Part 3: Design system and layout shell

Covers UI/UX. Builds every reusable component once.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the design system from the Master Context. Add fonts (Archivo Black for headings, Inter for body), Tailwind theme tokens for cream, ink, and the three status colors. Create reusable components: Button (solid black and outline), Card (thin black border), Badge (Match, Mismatch, Missing info, each with an icon and a word), SectionTitle (huge uppercase headline with a small tag above), SummaryBar, Input, Textarea, Tag, and Toast. Build the app shell: top nav (OpportunityKit logo, Profile, Check, Discover, Pricing), footer, and a small sunburst line-art SVG motif used sparingly. Make everything responsive and keyboard accessible. Create a /styleguide route showing every component. |
| --- |
```

**Checkpoint:** /styleguide looks consistent on desktop and phone width.


## Part 4: Types and data layer

Defines the data shapes and sample data used by every later part.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Create TypeScript types in /lib/types: StudentProfile (year, branch, cgpa, skills[], documents[] such as resume/marksheet/incomeCertificate, availabilityWeeks, links {github, linkedin, instagram, portfolio}, projects[]), Project (id, title, domains[], tech[], role, status, proofLink), Requirement (id, kind: year \| cgpa \| skills \| document \| link \| availability \| projectCount \| projectTag \| deadline \| custom, label, value, required), Checklist (opportunityType, title, requirements[], sources[]), Finding (requirementId, status, reason, ruleUsed, nextStep), and Result (findings[], counts, readiness, nextSteps[]). Create /lib/data with the sample opportunity text, the sample profile, and 3 more sample opportunities (a scholarship with marks cut-off and income limit, a competition with team size and deadline, and an IoT internship that needs 1 IoT project and a LinkedIn link). Add a storage helper that saves and loads the profile from Supabase when logged in, otherwise from localStorage. |
| --- |
```

**Checkpoint:** Types compile, sample data imports without errors.


## Part 5: Comparison rule engine (the core)

The most important part. Pure TypeScript, no AI, no network calls.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the comparison engine in /lib/engine as pure TypeScript with no AI and no network calls. Implement visible rules, each in its own small function that returns {status, reason, ruleUsed}: numberRule (CGPA minimum, marks cut-off, income maximum), rangeRule (year of study within allowed years), listRule (required skills minus profile skills; the reason must name the missing skills), documentRule, linkRule (present / format valid; a "GitHub or portfolio" requirement is satisfied by either), countRule (matching projects vs required count), tagRule (requested domain or tech appears in a project's tags or tech), proofRule (a link is required on a project but missing), availabilityRule, and deadlineRule. Strict rules: an empty or unknown profile field returns "Missing info", never "Mismatch". Skill matching is case-insensitive and handles aliases (JS = JavaScript, Node = Node.js). Add compare(checklist, profile) that returns a Result with counts, a readiness label (Ready to apply / Almost ready / Not ready yet), and ordered next steps. Write unit tests (Vitest) including the Master Context sample, which must give exactly 3 Match, 1 Mismatch, 2 Missing info, plus tests for empty profile, wrong input, aliases, and either/or links. |
| --- |
```

**Checkpoint:** All tests pass, and the sample gives 3 Match, 1 Mismatch, 2 Missing info.


## Part 6: Opportunity parser (rules first, AI optional)

Turns pasted text into a checklist using regex and keyword rules.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build /lib/parser that turns pasted opportunity text into a Checklist using regex and keyword rules, with no AI. Detect: opportunity type (internship, scholarship, competition), year of study ("2nd or 3rd year", "second year"), CGPA or percentage cut-off ("7.5 or above", "60%"), skills ("Skills: HTML, CSS, JavaScript" and "knowledge of X"), documents (resume, marksheet, income certificate, ID), links (GitHub, portfolio, LinkedIn), availability and duration ("8 weeks", "2 months"), income limit, team size, project requirements ("at least 1 IoT project", "2 projects"), and deadlines in formats like "30 Nov", "30/11/2026". Each detected requirement keeps the exact source sentence it came from. Return a list of parse warnings for sentences it could not understand. Add unit tests using all 4 sample opportunities. The sample opportunity must produce the 6 expected requirements. |
| --- |
```

**Checkpoint:** The sample text produces 6 requirements, and the other 3 samples parse sensibly.


## Part 7: Profile page (with projects and links)

Profile form, project cards, link validation, completeness meter.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build /profile. Sections: Basics (year, branch, CGPA, availability in weeks), Skills (tag input with suggestions), Documents ready (checkboxes: resume, marksheet, income certificate, ID proof), Links (GitHub, LinkedIn, Instagram optional, portfolio), and Projects (add, edit, delete cards with title, domains, tech, role, status, proof link). Validate link formats (github.com/username, linkedin.com/in/username, instagram.com/handle) and show clear inline errors like "This doesn't look like a GitHub profile link. Try github.com/username." Add a profile completeness meter that names the next field to add ("Profile 80% complete. Add LinkedIn to unlock more matches."). Add a "Load sample profile" button. Add this privacy note near Links: "We only check the link format. We never log in to your accounts." Save automatically using the storage helper. |
| --- |
```

**Checkpoint:** The profile saves, reloads, and shows validation errors.


## Part 8: Check page and result page

The full student flow: paste, review checklist, compare, fix, next steps.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build /check and /result. On /check: a large textarea to paste an opportunity, a "Load sample opportunity" button, and a type selector (auto-detect by default). Show the parsed checklist as an editable list (the student can fix, add, or delete any requirement; each row shows its source sentence and any parse warnings), then a "Compare with my profile" button. On /result: a SummaryBar at the top ("3 Match · 1 Mismatch · 2 Missing info → Not ready to apply yet"), then a table with Requirement, Opportunity asks, Your profile, Status badge, and a one-line Reason with the rule used. Missing info rows have an inline fix field, and filling it updates the status instantly without reloading. Below the table, show Next steps as a numbered list. If no profile exists, show a friendly prompt to create one. Handle empty paste, text with no detectable requirements, and a missing profile with clear messages. |
| --- |
```

**Checkpoint:** The whole sample flow works. Adding the GitHub link and availability changes the summary to "Only JavaScript left".


## Part 9: Polish, error handling, and demo mode

Final hardening so the live demo is reliable.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Polish and harden the app. UI/UX: review every page on a 375px phone width and a laptop; ensure contrast, 16px minimum body text, visible focus states, and that every status badge uses a word as well as a color. Add loading skeletons, empty states, and friendly error messages for every failure (empty paste, unparseable text, invalid link, missing profile, agent timeout, rate limit). Add a "Demo mode" toggle in the footer and a "Run the sample demo" button on the home page that loads the sample profile and opportunity and walks through the full flow with cached agent results, so the presentation works with no internet. Build the home page: a hero with the line "Know if you qualify, what you miss, and what to do next", the 5-step How It Works strip, and a sample result preview. Add basic analytics events for the demo flow (optional). Run the full test suite and Lighthouse (aim for 90+ on accessibility). Update the README with run instructions and a 60-second demo script. Also: confirm the sample flow works in demo mode on the live URLs. Optional features added in later parts will be switched on or off through /lib/flags.ts. |
| --- |
```

**Checkpoint:** The demo button runs the full flow offline, and the deployed link works on a phone.


## Part 10: Monetization (pricing, limits, college dashboard)

Covers the 30 Monetization marks.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Implement the business model. Plans: Free (Rs 0: 1 profile, projects and links, rule-based checks for up to 5 opportunities per month, no agent features), Student Premium (Rs 49 to 99 per month: unlimited checks, GitHub analysis, web research, related-opportunity discovery, ranking and comparison, readiness tracking, document checklist templates), and College License (per year: placement-cell dashboard, bulk student profiles, custom checklists for company drives, batch skill-gap and readiness reports). Build /pricing with three plan cards and a "Why it pays for itself" section. Add a usage counter ("3 of 5 free checks used this month") and a friendly upgrade prompt, never a hard block that hides results already shown. Gate the agent features by plan using a simple plan flag in the profile. Payments are mocked: an "Upgrade" button that sets the plan to Premium after a fake checkout screen, structured so Razorpay can be added later. Build /college: a dashboard with sample data for 120 students showing percentage of profiles complete, percentage with a GitHub or LinkedIn link, the most common missing skills (bar chart), readiness distribution (Ready / Almost ready / Not ready), and a "Create a company-drive checklist" form that runs the checklist against all students and lists who is ready. Label this page as sample data. |
| --- |
```

**Checkpoint:** The free limit counter works, upgrade unlocks the agent features, and the college dashboard renders charts.


## Part 11: LLM gateway with free models

Lets different agents use different free AI providers (Gemini, Groq, OpenRouter) behind one interface, with fallbacks. OpenAI and Grok are optional add-ons.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the LLM gateway in /lib/llm. Define an interface LLMProvider.generate({system, prompt, schema?, tools?, temperature, timeoutMs}) that returns {text, json?, sources?, usage}. Implement providers in separate files: gemini.ts (main, free tier, with Google Search grounding for research), groq.ts and openrouter.ts (free fallbacks; both can be called through an OpenAI-style chat endpoint, so one shared OpenAI-compatible client with different base URLs and keys can serve them; for OpenRouter prefer models whose id ends in :free), plus optional openai.ts and xai.ts for users who have paid credits (xAI also accepts an OpenAI-compatible client with its own base URL). Check each provider's current docs for endpoints. A provider with no API key in the environment is skipped automatically, so the app runs with only the Gemini key. Do not hard-code model names: read them from environment variables so they can be changed without code edits. Create /lib/llm/config.ts that reads per-agent settings (AGENT_<NAME>_PROVIDER and AGENT_<NAME>_MODEL) and LLM_FALLBACK_ORDER. Create a function askAgentLLM(agentName, {system, prompt, schema, tools}) that: calls the agent's assigned provider; sets temperature to 0 by default; requests JSON output and validates it with zod against the schema; retries once on invalid JSON; times out after 8 seconds; on HTTP 429 or quota errors waits briefly and retries once, then moves to the next provider in the fallback order; tracks requests per minute and per day for each provider against limits set in environment variables so free caps are not hit by accident; caches identical prompts for 10 minutes; and if all fail, returns null so the agent can use its rule-based or cached demo result. Each provider declares capabilities (supportsJsonMode, supportsWebSearch) and the gateway only sends search-needing agents to providers that support search. Add a per-provider call counter so cost and rate limits are visible. Create a backend route GET /api/llm/health that shows which providers have keys configured (never return the keys). Create /lib/agents/specs.ts holding one spec per agent: name, role prompt, allowed tools, output schema, 2 to 3 few-shot examples built from the sample data, and the default provider. Role prompts must say: use only the provided data, never invent, cite evidence or sources, return a confidence of high, medium or low, and never decide eligibility. Write tests with mocked providers for: valid JSON, invalid JSON then retry, timeout then fallback, and all providers failing. |
| --- |
```

**Checkpoint:** /api/llm/health lists the configured providers, and the tests show fallback working when one provider is forced to fail.


## Part 12: Agent framework and orchestrator

Shared agent interface, orchestrator, live activity panel, and the confirm-before-it-counts inbox. Agents call the LLM gateway from Part 11.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the agent framework in /lib/agents on top of the LLM gateway from Part 11. Define a common interface: Agent.run(input) returns AgentResult {agent, status, data, sources[{title,url,trust}], notes, confidence, providerUsed}. Trust is Verified, Needs review, or Unverified. Every agent is defined by its spec in /lib/agents/specs.ts (role prompt, tools, schema, few-shot examples, provider) and calls askAgentLLM, so changing a provider means changing one environment variable. Create an Orchestrator written in plain TypeScript (not an LLM) that plans and runs agents in order, runs independent agents in parallel, emits progress events (queued, running, done, failed) to the UI, and never lets one failed agent stop the whole flow. Every agent supports DEMO_MODE: it returns cached sample data when DEMO_MODE=true or when the gateway returns null. Create an Express route POST /api/agents/run in /backend with request validation, per-IP rate limiting, CORS limited to the configured frontend origins, and Supabase login-token verification when the student is logged in. Create a "Suggestions inbox" component: anything an agent finds (for example a skill detected from GitHub) appears as "Suggested, confirm?" with Accept and Reject buttons, and only accepted items are added to the profile. Agents may suggest and research, but they never apply to anything and never decide a status. Create stub files for the 7 agents and register them: Orchestrator, GitHubAnalyzer, LinkedInAnalyzer, OpportunityReader, ResearchAgent, VerifierAgent, DiscoveryAgent. Add an "Agent activity" panel on the Check page that shows each agent's status, the provider it used, and its time taken, live. Add a frontend API client with these behaviours: call /health when the page loads to wake the backend; show a friendly "Waking up the agents..." state while waiting; if the backend does not answer within 8 seconds, fall back to the parser and rule engine from /shared running in the browser plus cached demo data, and show a small banner "Running in offline mode". |
| --- |
```

**Checkpoint:** The activity panel shows all agents running in demo mode with provider names, and the inbox Accept and Reject buttons work.


## Part 13: Profile agents (GitHub and LinkedIn)

Reads public GitHub data; LinkedIn works from pasted text only. Both use a pretrained LLM specialised by role prompt and schema.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Implement GitHubAnalyzer and LinkedInAnalyzer using their specs and the LLM gateway. GitHubAnalyzer: first fetch real facts with plain code from the public GitHub REST API using the profile's GitHub URL (optional GITHUB_TOKEN for rate limits): repos, languages, topics, stars and recent activity. Cache for 10 minutes. Then call askAgentLLM with the role prompt "You are the GitHub Analyzer for OpportunityKit. Infer skills and project evidence only from the repository data provided. Never invent skills or projects. Every skill must cite at least one repo name as evidence. Return a confidence of high, medium or low. Never judge the student or decide eligibility." Require JSON: suggestedSkills[{skill, evidence[], confidence}] and suggestedProjects[{title, tech[], domain, proofLink, confidence}]. Include 2 few-shot examples. Validate with zod. If the LLM is unavailable, fall back to a rule that maps languages and topics to skills. Send everything to the Suggestions inbox for confirmation. Handle rate limits, private or missing users and network errors with clear messages. LinkedInAnalyzer: LinkedIn blocks scraping, so never fetch the URL. Add a text area where the student pastes About, Experience and Skills text (or uploads their LinkedIn data export PDF). Call the LLM with a role prompt that extracts skills, education and experience only from the pasted text and returns JSON with confidence and the sentence each item came from; keyword rules are the fallback. Show the note: "We never access your LinkedIn account." |
| --- |
```

**Checkpoint:** A real GitHub username returns suggested skills with repo evidence, the LinkedIn paste box works, and both still work with the LLM keys removed (rule fallback).


## Part 14: Opportunity agents (Reader, Research, Verifier)

Fills gaps in the checklist and labels every source with a trust level. Reader and Research each use their own assigned provider.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Implement OpportunityReader, ResearchAgent and VerifierAgent. OpportunityReader: run the rule parser from Part 6 first. Only if requirements are missing, call askAgentLLM with the role prompt "Extract requirements from the listing. Quote the exact source sentence for each. Do not guess missing values. Return JSON matching the Requirement schema." Include few-shot examples using the 4 sample opportunities. Validate with zod. Anything the LLM adds is marked "AI-suggested" and needs the student's confirmation. Default provider: Gemini Flash, with Groq as the fallback. ResearchAgent: when the pasted text lacks details (deadline, eligibility, documents), call a provider that supportsWebSearch (the gateway routes it automatically; Gemini with Google Search grounding is the default, and its free search allowance is limited, so if it runs out or fails, return the cached demo result rather than uncited facts) with the role prompt "Find missing details about this opportunity. Every fact must include its source URL and the sentence it came from. If you cannot find a source, return nothing for that fact." Return extra requirements, each with source URL, source sentence and confidence. VerifierAgent: plain code, no LLM needed for the decision. Label every source Verified, Needs review or Unverified using transparent checks: HTTPS, official-looking domain (.gov.in, .ac.in, .edu, the organisation's own domain), URL reachable, the same fact found on a second source, and no urgency or payment red flags. Show each source with its trust badge and the reasons behind the label. Never present a researched fact as certain without a source. All three support DEMO_MODE with cached results. |
| --- |
```

**Checkpoint:** Extra requirements appear with source links, trust badges and the provider used, and still appear in demo mode.


## Part 15: Discovery agent

Finds, checks, and ranks related opportunities.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Implement DiscoveryAgent and the /discover page. Given the student's profile (skills, branch, projects, year), call a search-capable provider through the gateway with the role prompt "Find real, current internships, scholarships and competitions related to this profile. Return only listings you can link to. Never invent a listing. Each result needs a title, organisation, source URL and a one-line reason it fits." If live search is unavailable, use a curated local list of 12 sample opportunities. Run each result through the OpportunityReader, then the Verifier, then the comparison engine, and rank by closeness to ready (fewest Mismatch, then fewest Missing info). Show cards with the title, source, trust badge, a mini status count (for example 4 Match · 1 Mismatch · 1 Missing), and the single fix that unlocks it. Add "Compare multiple opportunities" (select up to 3 and view side by side). Add a skill-gap summary of the skills missing most often across all checked opportunities, with the heading "Learn this first". |
| --- |
```

**Checkpoint:** /discover shows ranked opportunities with trust badges and the "Learn this first" panel, in live and demo mode.


## Part 16: Readiness score, what-if simulator, and smarter next steps

Makes the result page more useful and gives you the best demo moment.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Create /lib/flags.ts with a boolean flag for every optional feature in Parts 16 to 22 (all on by default). Extend the result page and the rule engine with: (1) a Readiness Score from 0 to 100 percent, shown as a large number next to the label (Ready to apply / Almost ready / Not ready yet). The formula must be visible and rule-based: each required requirement counts fully, optional ones count less, Match scores full, Missing info scores half, Mismatch scores zero. Add a small "How this score is calculated" link that shows the formula and the per-row points. (2) A What-if simulator: on every Mismatch or Missing info row add a toggle "Assume I will fix this". Toggling re-runs the pure comparison engine against a temporary copy of the profile and live-updates the counts and score, for example "Only 1 gap left". Label it clearly "What-if, not saved" and never write it to the real profile. (3) Prioritised next steps: order the steps by quickest fix first, with a small effort estimate per step taken from a curated local table (for example "Add GitHub link: 5 minutes", "Learn JavaScript basics: about 2 weeks"), labelled as an estimate. (4) Best-fit project highlight: rank the student's projects by tag and tech overlap with the requirements using a visible rule, and show "Lead with your Home Automation project for this opportunity" with the reason. Add unit tests for the score formula and the what-if logic, including that the sample gives 3 Match, 1 Mismatch, 2 Missing info, and that fixing the three gaps in the what-if turns the result to Ready to apply. |
| --- |
```

**Checkpoint:** The sample shows a score, the what-if toggles update the summary live, and the real profile is unchanged afterwards.


## Part 17: Trust, safety, and privacy

Shows judges the app is responsible. Reuses the PS-01 scam-spotting idea.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the trust and safety features. (1) Opportunity scam warning: write a rule-based scam checker in /lib/engine/scam.ts (plain TypeScript, no AI) that scores a pasted or discovered listing with visible rules and points: asks for a registration or processing fee, asks for OTP, password or bank details, urgent or threatening wording, shortened or lookalike links, no official domain or contact details, and too-good-to-be-true payments. Combine the points into Low, Medium or High, highlight each warning sign inside the original text, explain each in plain words, and show safe next steps (verify on the organisation's official site, never share an OTP, never pay to apply). Run it on the Check page and on every Discovery result, and show a badge. Avoid false alarms: a normal listing must not be marked High without a reason. Add tests including a safe listing and a fake fee-based listing. (2) Trust and source badges: audit every place a researched fact appears and make sure it shows its source link and a Verified, Needs review or Unverified badge. (3) AI labels: anything not produced by rules shows an "AI-suggested" tag and needs confirmation. (4) Privacy page /privacy in plain language: what is stored, where, for how long, which free AI providers may see sample inputs, and that links are never accessed. (5) Delete my data: a button that removes the profile, tracker and share links after confirmation. |
| --- |
```

**Checkpoint:** A fee-asking sample listing shows a High scam warning with highlights, a normal listing does not, and Delete my data really clears everything.


## Part 18: Application tracker, sharing, and exports

Keeps students coming back and lets them take the result with them.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build /tracker and the export features. (1) Application tracker: a "Save to tracker" button on every result. Each saved item stores the opportunity title, source, deadline, readiness score at the time of saving, status (Interested, Preparing, Applied, Interview, Result) and a notes field. Show a table and a simple board view with filters and sort by deadline, and highlight deadlines within 7 days. Store in Supabase when logged in, otherwise localStorage. (2) Downloadable checklist PDF: generate a clean printable "Prepare before applying" PDF from a result (opportunity, status table, next steps, score) using a client-side PDF library such as jsPDF or a React PDF renderer, in the cream and black style. (3) Deadline calendar export: generate a valid .ics file (RFC 5545) for any opportunity with a deadline, with a reminder 3 days and 1 day before, built without relying on a service; test that it opens in Google Calendar and Apple Calendar. (4) Shareable result link: create a read-only snapshot page /share/[id] containing only the opportunity, statuses, score and next steps, with no email, phone or links from the profile; links expire after 7 days and the owner can revoke them from the tracker. (5) Data export: a button that downloads the student's own profile and tracker as JSON. Handle empty states and errors with friendly messages. |
| --- |
```

**Checkpoint:** You can save a result, download its PDF, import the .ics into a calendar, open a share link in a private window, and revoke it.


## Part 19: Language, themes, onboarding, and accessibility

Reaches more students and polishes the experience.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the experience features. (1) Language toggle for English, Hindi and Marathi: put all interface text into dictionaries (for example with next-intl or a simple JSON loader), translate the main flow (home, profile, check, result, tracker, pricing), and format the status words consistently. For the AI-written explanations, ask the LLM gateway for the chosen language and fall back to the English text if no provider is available. Rule reasons come from translatable templates, not from the LLM. Remember the choice per user. (2) Light and dark mode: keep the cream theme as the default and add a dark variant with the same status colors adjusted for contrast; respect the system setting and add a toggle. (3) Onboarding tour: a skippable 3-step first-visit guide (create profile, paste opportunity, read result) that can be replayed from the footer. (4) Accessibility: add labels, alt text, visible focus, sufficient contrast in both themes, screen-reader text for status badges, and keyboard shortcuts (for example N for new check, T for tracker, / to focus the paste box) with a shortcuts help dialog. Run an automated accessibility check (axe or Lighthouse) and fix all serious issues. |
| --- |
```

**Checkpoint:** The whole main flow works in Hindi and Marathi, the dark mode has no unreadable text, the tour replays, and the accessibility check has no serious issues.


## Part 20: Business model extras

Strengthens the 30 Monetization marks.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Extend the business features from Part 10. (1) College report export: add "Export report as PDF" to the college dashboard, with the readiness distribution, common missing skills and a list of students who are ready for a chosen drive. Label it sample data. (2) Partner-published checklists: build /drive/new where a company or placement cell enters a structured checklist (requirements, deadline) and gets a link /drive/[id]; students open the link, see the checklist and compare it with their own profile in one click. The college dashboard shows how many students are ready for that drive. (3) Sustainability page section on /pricing titled "How we stay sustainable": show configurable constants (average cost per AI call, share of checks that use no AI, free-plan limits) and compute the average cost per check and the break-even number of Premium students, in plain language. Make clear these are assumptions. (4) Premium nudges: after a student closes a gap or hits the free limit, show a friendly, non-blocking upgrade hint that names the specific feature they would get, never hiding results already shown. |
| --- |
```

**Checkpoint:** A drive link works end to end, the college PDF downloads, and the sustainability numbers update when the constants change.


## Part 21: Learning help, resume lines, and career roadmap

Turns every gap into an action. The roadmap is a Premium feature.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the improvement features. (1) Learning resources for gaps: create a curated local JSON file mapping about 30 common skills (HTML, CSS, JavaScript, Python, React, SQL, Git, Arduino, IoT, machine learning and similar) to 2 or 3 free learning links each, with a title, source name and typical hours. Do not use live search for this. Add a note in the file that every link must be checked manually before the demo. On a Mismatch row for a skill, show "Learn this" with the links and the effort estimate. (2) Resume and SOP lines: on each project card add a "Generate resume line" button that produces a short bullet and a two-sentence SOP paragraph using only the facts on the card (title, tech, role, status). Use the LLM gateway with a role prompt that forbids inventing facts, with a template-based fallback when no provider is available, and show the output as "AI-suggested, edit before using" with a copy button. (3) 30-day Career roadmap (Premium plan flag): given a target opportunity and its gaps, build a week-by-week plan ordered by quickest and most important fix, with tasks, learning links and a final "re-check readiness" step. The scheduling is rule-based; the LLM may only reword the text. Show it as a printable page and save it to the tracker. Free users see a locked preview with an upgrade prompt. |
| --- |
```

**Checkpoint:** A Mismatch skill shows learning links, a project card generates an editable resume line even with the LLM off, and the roadmap is locked for Free and unlocked for Premium.


## Part 22: Reliability, logging, and optional OCR

Keeps the demo safe. OCR is a stretch feature behind a flag.


**Prompt to paste into Antigravity:**

```text
| PROMPT (copy into Antigravity)
Read MASTER_CONTEXT.md in the repo root and follow it for everything in this task. Then do the task below.

Build the reliability features. (1) Status page /status and footer indicator: show which AI providers are configured and recently working (never the keys), the average response time per agent and whether demo mode is on. (2) Error logging: log every failed or slow agent call with agent name, provider, error type, duration and whether a fallback was used, into a logs table (or a local file when there is no database), and add a simple viewer at /status/logs that is hidden unless an admin flag is set. Never log personal data or full prompts. (3) Regression tests: build a test suite that runs all 4 sample opportunities through the parser, the rule engine, the score and the scam checker on every run, and a script (npm run demo-check) that verifies the full demo flow works offline. (4) Optional OCR (flag OCR_ENABLED, off by default): let the student upload a screenshot or photo of a WhatsApp message or poster on /check and extract the text with client-side OCR (such as tesseract.js) or a vision-capable free model through the gateway; show the extracted text in the paste box for the student to correct before parsing. Handle blurry images with a clear message. If OCR is flaky, leave the flag off. Also: add a small "AI providers" status line in the footer (which providers are configured, never the keys), test the whole flow with only the Gemini key, then with all LLM keys removed to confirm the rule-based fallback and cached demo results work, and confirm no API key appears in the browser bundle or network tab. Finish by re-running the checks from Part 9 and the smoke test from Part 2 against the live URLs. |
| --- |
```

**Checkpoint:** /status shows provider health, a forced failure appears in the logs with the fallback used, and npm run demo-check passes offline.


---

# Part B — Offline-First Evidence Model Prompt Pack

Mandatory architectural shift · 12 prompts for Antigravity · paste one per session


# 1. What This Changes

OpportunityKit stops assuming a backend that is always available. Instead, the student’s facts and the opportunity facts live as versioned evidence records in two places: a local store in the browser (works offline) and a server store (Supabase, through the Render backend). The two are synchronised when the connection returns. Eligibility is no longer a stored verdict. It is recomputed from the current evidence and always explains which evidence it used.

The original workflow stays: create a profile, paste an opportunity, get a checklist, and see the result (the sample still gives 3 Match, 1 Mismatch, 2 Missing info). It now also works offline, and it now shows the evidence behind each row.


# 2. How to Use This Pack

- Paste one prompt per new session, in order, from Prompt 1 to Prompt 12. Each prompt starts with “Follow MASTER_CONTEXT.md (read it first).”

- Prompt 1 adds the offline-first rules to MASTER_CONTEXT.md, so every later session follows them.

- After each prompt, run its checkpoint yourself, commit, and push (the same routine as before: branch, test, merge, push).

- Prompts 2, 4 and 8 are pure logic with tests. Do not skip them. The later prompts depend on them.

- If a prompt is too big for one session, split it. For example, do the stores first and the migration second.

- Add the new environment variables only where each prompt says so. Keep keys in Render and your local .env, never in Vercel or Git.

- Keep your existing feature flags. Put anything unfinished behind a flag so the demo stays clean.


# 3. Coverage of the Four Requirements


| Requirement | What it means in the app | Prompts |
| --- | --- | --- |
| 1. Local and server evidence stores | IndexedDB store in the browser, Supabase store on the server, offline evaluation and review, sync when connectivity returns | 3, 7, 9, 10 |
| 2. Versioned evidence records | Stable ID, source, trust, timestamp and version on every record; AI evidence versioned; full history kept, never silently replaced | 2, 3, 5, 6, 7 |
| 3. Dynamic, explainable decisions | Recomputed on every evidence change; every finding lists its evidence; unverified, stale or conflicting evidence is never a confirmed fact | 4, 5, 11 |
| 4. Safe sync and conflict resolution | Conflicts detected and resolved by rule; student confirmation never overwritten by AI; the confirmed versus AI distinction kept through sync and evaluation | 6, 8, 9, 11 |
| Original workflow keeps working | Profile, paste, checklist, result and the 3 / 1 / 2 sample, online and offline | 5, 10, 12 |


# 4. Design Reference


### 4.1 Evidence record fields


| Field | Purpose |
| --- | --- |
| evidenceId | Stable ID of one logical fact; it stays the same across versions |
| version, previousVersion | Version number, and the version this one replaces. Older versions are kept. |
| subjectType, subjectId, kind, key, value | What the fact is about (profile or opportunity), its type (skill, CGPA, link, deadline and so on) and its value |
| origin | student_confirmed, user_provided (typed or pasted by the student and parsed by rules), ai_generated, or system_import (curated samples) |
| trust | verified, needs_review or unverified (set by the Verifier for sources) |
| source | Type, URL, agent, provider and the exact sentence the fact came from |
| createdAt, observedAt, validUntil | When it was recorded, when it was seen, and when it goes stale |
| status | active, superseded, rejected or conflicted |
| deviceId, opId, serverSeq | Which device wrote it, an idempotency key, and the server-assigned order used for syncing |
| syncState | local_only, pending, synced or conflict |


### 4.2 When evidence counts as a confirmed fact

Evidence must be the current active version, not stale, and not in conflict. Then:


| Evidence | Counts as confirmed? | Result when it does not |
| --- | --- | --- |
| Profile-side facts (skills, CGPA, links, projects) from the student | Yes, if origin is student_confirmed | AI-generated profile facts stay advisory until the student confirms them |
| Opportunity facts from text the student pasted (parsed by rules) | Yes, origin is user_provided | Parse warnings are shown for anything unclear |
| Opportunity facts found by AI research | Only if trust is verified (the Verifier checked the source) | Missing info with reason UNCONFIRMED_AI or UNVERIFIED |
| Stale evidence (past its validUntil) | No | Missing info with reason STALE, and a Refresh action |
| Conflicting evidence | No | Missing info with reason CONFLICT, and a Resolve action |

Assumption to review: default staleness is 7 days for researched facts, 30 days for GitHub-derived facts, 90 days for analysis of pasted profile text, and never for student-confirmed facts. These are constants in one file, so you can change them.


### 4.3 Sync conflict rules


| Case | What happens |
| --- | --- |
| AI evidence versus student-confirmed evidence | The student wins. The AI version is kept as a linked advisory record, and the student sees a notice. It is never applied automatically. |
| Student-confirmed versus student-confirmed, different values (two devices) | Marked as a conflict. Both versions are kept. The evaluator reports CONFLICT until the student chooses. |
| AI versus AI | The newer server version becomes current. The older stays in the history. |
| Student rejected or deleted, then the AI suggests the same value again | The rejection stands. The suggestion is suppressed unless it comes from a new source. |
| Edit made on an old version while the server moved on | Detected through baseVersion. It is merged by the rules above, never by silent last-write-wins. |
| Duplicate pushes | Ignored, using the opId. |
| Device clocks disagree | Order comes from the server-assigned serverSeq. Timestamps are only shown to the student. |


# 5. MASTER_CONTEXT.md Addendum

Prompt 1 appends this section to MASTER_CONTEXT.md. It is shown here for reference.


| ADDENDUM (appended to MASTER_CONTEXT.md by Prompt 1)
Offline-first evidence model (added):
The app is offline-first. A local evidence store (IndexedDB in /frontend) and a server evidence store (Supabase Postgres through /backend) hold every fact about the student and about opportunities as versioned, append-only evidence records. The backend may be unavailable at any time; evaluation never depends on it.
Every record has: stable evidenceId, version, origin (student_confirmed \| user_provided \| ai_generated \| system_import), trust (verified \| needs_review \| unverified), source, timestamps, optional validUntil, and status.
Eligibility is never stored as a verdict. It is recomputed from the current evidence whenever evidence changes, and every finding lists the evidence ids and versions that support it, or why evidence was excluded.
Unverified, stale, conflicting or unconfirmed AI evidence is advisory only and never counts as a confirmed fact.
Sync never overwrites student_confirmed evidence with ai_generated evidence. Conflicts keep both versions.
The original workflow (profile, paste, checklist, result: 3 Match, 1 Mismatch, 2 Missing info) must keep working, online and offline. |
| --- |


# 6. The Prompts


## Prompt 1: Add the offline-first rules to MASTER_CONTEXT.md

Decision record. Every later prompt reads this file, so do it first. No code changes.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Append the following section to the end of MASTER_CONTEXT.md exactly as written, keeping the rest of the file unchanged. Then create docs/EVIDENCE_MODEL.md that repeats the section and says it is the reference for the offline-first evidence model. Do not change any code.

Offline-first evidence model (added):
The app is offline-first. A local evidence store (IndexedDB in /frontend) and a server evidence store (Supabase Postgres through /backend) hold every fact about the student and about opportunities as versioned, append-only evidence records. The backend may be unavailable at any time; evaluation never depends on it.
Every record has: stable evidenceId, version, origin (student_confirmed \| user_provided \| ai_generated \| system_import), trust (verified \| needs_review \| unverified), source, timestamps, optional validUntil, and status.
Eligibility is never stored as a verdict. It is recomputed from the current evidence whenever evidence changes, and every finding lists the evidence ids and versions that support it, or why evidence was excluded.
Unverified, stale, conflicting or unconfirmed AI evidence is advisory only and never counts as a confirmed fact.
Sync never overwrites student_confirmed evidence with ai_generated evidence. Conflicts keep both versions.
The original workflow (profile, paste, checklist, result: 3 Match, 1 Mismatch, 2 Missing info) must keep working, online and offline. |
| --- |
```

**Checkpoint:** MASTER_CONTEXT.md ends with the new section and docs/EVIDENCE_MODEL.md exists.


## Prompt 2: Versioned evidence model (shared)

Covers point 2. Pure TypeScript in /shared, no storage and no network.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

In /shared/src/evidence create the evidence model. Types: EvidenceRecord {evidenceId, subjectType ("profile" \| "opportunity"), subjectId, kind, key, value, origin, trust, source {type, url?, agent?, provider?, sentence?}, createdAt, observedAt, validUntil?, status ("active" \| "superseded" \| "rejected" \| "conflicted"), version, previousVersion?, linkedRef?, deviceId, serverSeq?, opId, syncState ("local_only" \| "pending" \| "synced" \| "conflict")}.
Records are append-only: a change never edits a record; it creates version n+1 with the same evidenceId and keeps every earlier version in the history.
Helpers: createEvidence, reviseEvidence (new version), confirmEvidence (the student confirms an AI record: new student_confirmed version linked to the AI version), rejectEvidence, currentVersion(history), historyOf(evidenceId), contentHash.
Rule: an ai_generated change can never revise a student_confirmed record. It must create a separate advisory record linked to it.
Add isStale(record, now) using constants per kind (researched facts 7 days, GitHub-derived 30 days, analysis of pasted profile text 90 days, student-confirmed never).
Vitest tests: versioning, history kept, the AI-cannot-overwrite rule, hashing, staleness. |
| --- |
```

**Checkpoint:** Tests pass. A record revised three times shows three versions in its history, and an AI revision of a confirmed record creates a linked advisory record instead.


## Prompt 3: Local evidence store with IndexedDB (frontend)

Covers point 1 (local store) and point 2. Lets students work and review evidence offline.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

In /frontend add the local evidence store using IndexedDB (Dexie or idb). Stores: evidence (all versions, indexed by evidenceId, subjectId, kind, syncState), outbox (pending operations with opId, operation type, record, baseVersion, createdAt) and meta (deviceId created once, lastSyncCursor, lastSyncedAt).
Repository API using the shared helpers: add, revise, confirm, reject, getCurrent(subjectId), getHistory(evidenceId), listPending(), markSynced(), subscribe(callback) so the UI updates on any change. Every change writes a new version plus an outbox entry in one transaction.
Migration: on first load convert the existing localStorage profile, projects, links, checklist and tracker data into student_confirmed (profile) or user_provided (pasted opportunity) evidence records. It must be idempotent (never twice) and must leave the old data untouched as a backup.
Handle storage errors and quota limits with a clear message.
Tests with fake-indexeddb: transactions, migration idempotency, history. |
| --- |
```

**Checkpoint:** After one load the old profile appears as evidence records; reloading does not duplicate them; the data is still there with the network switched off.


## Prompt 4: Dynamic, explainable evaluator (shared)

Covers point 3. Replaces stored verdicts with a pure function of the current evidence.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

In /shared/src/evaluator create the dynamic eligibility evaluator, pure TypeScript. evaluate(requirementEvidence[], profileEvidence[], now) returns Decision {evaluatedAt, evidenceFingerprint, findings[], counts, readiness, nextSteps}.
Each finding has: status (Match \| Mismatch \| Missing info), reasonCode (SUPPORTED, CONTRADICTED, MISSING, UNCONFIRMED_AI, UNVERIFIED, STALE, CONFLICT), a plain-language reason, supportingEvidence[{evidenceId, version, origin, trust, source}] and excludedEvidence[{evidenceId, version, why}].
Evidence counts as a confirmed fact only if it is the current active version, not stale, not in conflict, and either (a) its origin is student_confirmed or user_provided, or (b) it is an opportunity-side fact with origin ai_generated and trust verified. Profile-side facts (skills, CGPA, links, projects) always need student confirmation.
Anything else is advisory: list it as excluded, and the requirement becomes Missing info with the matching reasonCode, never Match or Mismatch.
Never store a verdict as the source of truth. If you cache, key the cache by evidenceFingerprint (hash of the evidence ids and versions used) so any change invalidates it.
Reuse the existing rule functions for the comparisons so the sample still gives exactly 3 Match, 1 Mismatch, 2 Missing info. Keep compare(checklist, profile) as a thin adapter that builds evidence from the profile and calls evaluate.
Tests: sample unchanged; an AI-only skill gives Missing info with UNCONFIRMED_AI; stale gives STALE; conflicting gives CONFLICT; confirming the AI skill flips the result; changing one record changes the fingerprint. |
| --- |
```

**Checkpoint:** The sample still gives 3 Match, 1 Mismatch, 2 Missing info, and every finding lists its evidence or the reason evidence was excluded.


## Prompt 5: Connect the UI to evidence and live evaluation

Covers points 2 and 3 in the interface, and keeps the original workflow working.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

In /frontend connect the existing pages to the evidence store and the evaluator.
Profile forms, project cards, links and the pasted checklist now write evidence records through the repository. Edits create new versions and never overwrite.
/result calls evaluate whenever the store emits a change, so the result recomputes live with no stored verdict.
Add a "Why?" drawer on every result row: supporting evidence (id, version, origin, trust, source link or sentence, time) and any excluded evidence with the reason.
Show badges: "Confirmed by you", "AI-suggested", "Verified source", "Stale", "Conflict".
Add /evidence listing records by subject with a version timeline per record (what changed, when, old value and new value).
Rows that are Missing info because of UNCONFIRMED_AI, STALE or CONFLICT must offer the right action (Confirm, Refresh, Resolve).
The original flow (load sample, compare, inline fixes, what-if, tracker) must work unchanged, and everything must work with no backend. |
| --- |
```

**Checkpoint:** The sample flow works with the backend stopped. Editing the CGPA changes the result instantly, and the Why? drawer shows the evidence behind each row.


## Prompt 6: Agents produce versioned AI evidence

Covers points 2 and 4. AI output becomes advisory evidence, never a silent profile change.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

In /backend/src/agents change every agent to return EvidenceRecord drafts instead of changing the profile: origin ai_generated, trust from the Verifier (default unverified), source (agent, provider, url, sentence), observedAt now, validUntil from the staleness constants.
Finding the same logical fact again creates a new version of the same evidenceId (derive a stable key from subjectId, kind and key). It never creates a duplicate or replaces the old one.
Rewire the Suggestions inbox in the frontend as a view over unconfirmed ai_generated evidence: Accept calls confirmEvidence (new student_confirmed version linked to the AI version); Reject calls rejectEvidence (status rejected, and identical re-suggestions from the same source are suppressed).
An agent must never write student_confirmed evidence.
Keep DEMO_MODE cached results, converted to evidence records.
Tests: re-running an agent creates versions, not duplicates; Accept and Reject behave; no agent output counts as confirmed. |
| --- |
```

**Checkpoint:** Running GitHub analysis twice makes version 2 of each suggestion. Until you click Accept, the result does not change. After Accept it does.


## Prompt 7: Server evidence store (Supabase)

Covers point 1 (server store) and point 2. Append-only history on the server.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

Create the server evidence store. Add a Supabase SQL migration backend/migrations/001_evidence.sql with: table evidence_versions (primary key evidence_id plus version; all EvidenceRecord fields; user_id; server_seq bigserial unique; received_at), table sync_ops (op_id primary key, user_id, applied_at) for idempotency, and a view giving the current version per evidence_id. Enable row level security so each user reads and writes only their own rows.
Backend repository in /backend/src/store: appendVersion (never update or delete rows; history is preserved), getCurrent, getSince(cursor), hasOp(opId). Use the Supabase service key from env, server-side only.
For local development without Supabase provide a JSON-file implementation behind the same interface and mark it non-persistent in the README (the free Render disk is not durable).
Tests against the interface: append-only behaviour, idempotency, cursor paging.
Document the migration steps in DEPLOY.md. |
| --- |
```

**Checkpoint:** The migration runs in Supabase, a second user cannot read the first user's rows, and the tests pass on the interface.


## Prompt 8: Sync engine and conflict rules (shared)

Covers point 4. Pure logic that decides how local and server records merge.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

In /shared/src/sync build the pure sync engine (no network or storage). Input: local outbox operations and server changes since a cursor. Output: {toApplyLocally, toPushToServer, conflicts, notices}. Rules:
1. Order by server-assigned serverSeq, never by device clocks.
2. Detect concurrent edits using baseVersion.
3. ai_generated never overwrites student_confirmed: the AI version is kept as an advisory record linked to the confirmed one, and a notice is produced.
4. student_confirmed versus student_confirmed with different values is a conflict: keep both versions, mark the record conflicted, and the evaluator reports CONFLICT until the student resolves it.
5. ai_generated versus ai_generated: the newer server version becomes current and the older stays in history.
6. A student rejection or deletion beats an AI re-suggestion of the same value.
7. Duplicate opIds are ignored.
8. Every merge keeps all versions.
Write a table-driven test file covering every rule plus: repeated sync is idempotent, offline edits for several days, and two devices confirming different values. |
| --- |
```

**Checkpoint:** All conflict-rule tests pass, including "AI never overwrites a student confirmation".


## Prompt 9: Sync API and sync client

Covers points 1 and 4. Syncs when connectivity returns, and never blocks evaluation.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

Add the sync transport.
Backend: POST /api/sync/push (array of operations, each with opId, record version, baseVersion; verify the Supabase token; apply with the shared sync engine and the server store; return applied ids, server_seq values, conflicts and notices) and GET /api/sync/pull?since=<cursor> (paged). Both idempotent and rate limited.
Frontend: a sync client that runs when the app loads, when the browser goes online, every few minutes while online, and on a "Sync now" button. It pushes the outbox, pulls changes, applies them to the local store through the shared engine, updates lastSyncCursor and retries with exponential backoff.
A sync status chip shows Offline, Syncing, Synced (time), Pending (n) or Conflict (n).
If the student is not logged in, keep everything local and say so. If the backend is asleep or unreachable, fail quietly, keep the outbox and retry. Never block evaluation on sync. |
| --- |
```

**Checkpoint:** Edit offline, go online, and the chip moves from Pending to Synced. The record then exists on the server with its history, and a duplicate push changes nothing.


## Prompt 10: Offline app shell (PWA)

Covers point 1. The app opens and evaluates with no network.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

Make the app usable offline. Add a service worker (Serwist or next-pwa; check current support for the Next.js version in use) that caches the app shell, pages, fonts and the sample data so /, /profile, /check, /result, /evidence and /tracker load with no network.
Add an offline banner and an online/offline indicator.
Opportunities and checklists already checked are stored as evidence, so they can be reopened and re-evaluated offline.
Features that need the network (agents, research, discovery, share links) show a clear "Needs connection" state and do not silently queue anything.
After one online visit, the sample flow (profile, paste, checklist, result: 3 Match, 1 Mismatch, 2 Missing info) must work with the network switched off.
New deployments must update the cached shell without trapping users on an old version: show an "Update available" prompt. |
| --- |
```

**Checkpoint:** In the browser dev tools, set Network to Offline and reload: pages open, the sample flow works, and edits are saved.


## Prompt 11: Conflict resolution and history screens

Covers points 3 and 4. The student stays in control of every conflict.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

Build the conflict and history UI.
A /conflicts page (with a badge in the nav) lists records in conflict. Show both versions side by side with origin, source, time and device, and buttons "Keep this one", "Keep the other" and "Enter a new value". The choice is saved as a new student_confirmed version linked to both, and the conflict closes.
Show notices from sync, for example "AI suggested a different CGPA; your confirmed value was kept", with a link to the timeline and an option to view the suggestion.
On the evidence timeline add filters (origin, trust, status), a diff of old and new value, and a Refresh action for stale records that re-runs the agent when online.
Make stale, advisory and conflicting evidence look different from confirmed evidence everywhere it appears.
Tests: the resolve flows, and the evaluator updating immediately after a resolve. |
| --- |
```

**Checkpoint:** Create a conflict (two student confirmations with different values), resolve it, and watch the result row change from Missing info (CONFLICT) to Match or Mismatch.


## Prompt 12: Verification, privacy and documentation

Final checks for all four points, plus the original workflow.


**Prompt to paste into Antigravity:**

```text
| PROMPT (paste into Antigravity)
Follow MASTER_CONTEXT.md (read it first). Task:

Verification and cleanup.
1. Extend npm run demo-check to run the original sample (3 Match, 1 Mismatch, 2 Missing info) through the evidence evaluator, then simulate: an AI-only skill is not counted; confirming it flips the result; a stale record becomes Missing info; a conflict becomes Missing info; an offline edit followed by a sync leaves a student confirmation intact.
2. Add a two-device sync simulation test using the shared engine with a fake transport.
3. Update "Delete my data" and "Export data" to include all evidence versions, the outbox and the user's server records (server deletion through an authenticated backend route).
4. Update /privacy to explain local storage, server sync, AI-generated versus confirmed evidence, and deletion.
5. Update README and DEPLOY.md with the Supabase migration, new env variables and a manual offline test script: load online once, switch the browser to offline, run the sample, edit the profile, go online and watch it sync.
Run all tests and npm run build. |
| --- |
```

**Checkpoint:** npm test, npm run demo-check and npm run build all pass, and the manual offline script works end to end.


# 7. Final Acceptance Checklist


| Test | Expected result |
| --- | --- |
| Load the sample online once, set the browser to Offline, reload, and run the sample | 3 Match, 1 Mismatch, 2 Missing info, with no backend |
| Edit the CGPA offline | The result changes instantly, with no stored verdict, and the record shows a new version |
| Open “Why?” on any row | Evidence ids, versions, origin, trust and source are listed; excluded evidence shows the reason |
| Run GitHub analysis, do not accept | Suggestions appear as AI-suggested; the result does not change |
| Accept a suggestion | A student_confirmed version is created and the result updates |
| Make AI suggest a different value for a confirmed fact, then sync | Your confirmed value is kept, the AI version is stored as advisory, and a notice appears |
| Confirm different values on two devices, then sync | Conflict appears; the row is Missing info (CONFLICT) until you choose |
| Let a researched fact pass its validUntil | The row becomes Missing info (STALE) with a Refresh action |
| Go online after offline edits | The chip goes from Pending to Synced, the server holds the full history, and nothing is duplicated |
| Run npm test, npm run demo-check and npm run build | All pass |


# 8. Caveats to Check

- Browser storage can be cleared by the user or the browser. The server copy is the backup, so tell students to log in to keep their evidence.

- Service workers can serve old cached pages. Prompt 10 includes an “Update available” prompt. Test it after each deployment.

- Render’s free disk is not durable, so the server store must be Supabase. The JSON-file store is for local development only.

- Supabase row level security must be tested with two accounts. A mistake here would expose one student’s data to another.

- Free AI providers still have rate limits, so agents may be unavailable. Evaluation does not depend on them.

- Check the current documentation for your Next.js version before choosing a service worker library.

- The staleness periods and the “verified AI counts for opportunity facts” rule are design choices. Change them if your team decides otherwise.
