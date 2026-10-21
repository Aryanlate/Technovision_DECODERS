# MASTER CONTEXT

**Project:** OpportunityKit, a web app for the SETU 2026 hackathon (PS-03).  
**Goal:** A student creates a profile once (with projects and links), pastes an internship/scholarship/competition description, and the app builds a checklist and compares it with the profile. Each requirement gets one status: **Match**, **Mismatch**, or **Missing info**, with a short reason. &quot;Unknown&quot; must never be treated as &quot;fails&quot;: if the profile has no answer, the status is Missing info. The result page shows a summary and next steps, never just yes/no.

---

## Core Principle
AI agents gather evidence; a transparent, rule-based engine (plain TypeScript, no AI) makes the final decision.  
Agents are pretrained LLMs specialised by a role prompt, tools, a strict JSON schema (validated with zod) and few-shot examples. No fine-tuning. Every agent must cite evidence or sources, return a confidence, and only suggest: the student confirms before anything counts. LLM output never decides Match, Mismatch or Missing info.

---

## Architecture
A monorepo with three packages:
- `/frontend` = Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel.
- `/backend` = Node.js + Express + TypeScript, deployed on Render (free web service).
- `/shared` = types, rule parser, rule engine and feature flags as pure TypeScript used by both sides.

### Folder Mapping
- `/lib/engine`, `/lib/parser`, `/lib/types`, `/lib/data` and `/lib/flags.ts` live in `/shared`;
- `/lib/llm`, `/lib/agents`, the scam checker and every `/api/...` route live in `/backend` as Express routes;
- Pages, components, the storage helper, PDF and calendar export live in `/frontend`.

All LLM keys and agent code stay in the backend only. The frontend also runs the parser and rule engine itself, so the core flow works even if the backend is asleep or offline. Everything must run locally with one command (`npm run dev`) and in production on Vercel plus Render using only environment variable changes.

---

## Stack Details
- **Data:** Supabase (Auth + Postgres) with a localStorage fallback so the demo works without login.
- **LLM Layer:** A provider-agnostic gateway (`/lib/llm`) that uses FREE-tier models by default: Google Gemini (main), Groq and OpenRouter free models (fallbacks). OpenAI and Grok (xAI) are optional and only used if the student has paid credits.
- **Agent Configuration:** Each agent is assigned a provider and model through environment variables, with a fallback chain (assigned provider, then the next free provider, then cached demo result). Providers without an API key are skipped automatically. Use sample data only, never real student data, because free tiers may use inputs to improve provider products. `DEMO_MODE=true` returns cached sample results.

---

## Design
- **Aesthetic:** Editorial, minimal.
- **Colors:**
  - Background: Cream `#F1EEE6`
  - Text: Near-black `#111111`
  - Badges:
    - Match `#2F7D5B`
    - Mismatch `#C0453A`
    - Missing info `#D98A1F`
- **Typography:** Bold heavy uppercase headlines (Archivo Black), body Inter.
- **Styling Rules:** Thin black borders, no gradients, no shadows. Every badge shows a word, not just a color. Mobile-first, responsive, minimum body text 16px.

---

## Sample Data (Benchmark)
- **Opportunity:**  
  *&quot;2nd or 3rd-year B.Tech/B.E. student. CGPA 7.5 or above. Skills: HTML, CSS, JavaScript. Resume required. Portfolio or GitHub link required. Available for 8 weeks.&quot;*
- **Profile:**  
  *2nd-year B.Tech CSE, CGPA 8.2, skills HTML, CSS, Python, resume ready, no GitHub/portfolio link, availability not provided.*
- **Expected Results:**
  - Year: **Match**
  - CGPA: **Match**
  - Skills: **Mismatch** (JavaScript missing)
  - Resume: **Match**
  - Portfolio/GitHub: **Missing info**
  - Availability: **Missing info**
- **Summary:** 3 Match, 1 Mismatch, 2 Missing info, &quot;Not ready to apply yet&quot;.

---

## Feature Flags & Rules
- **Feature Flags:** Every optional feature from Parts 16 to 22 sits behind a flag in `/lib/flags.ts` so unfinished features can be switched off for the demo.
- **Code Rules:** Keep files small and typed, one responsibility per file, add short comments, no hard-coded secrets, handle empty and wrong input with clear messages.
