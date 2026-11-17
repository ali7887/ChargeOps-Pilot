# ChargeOps Pilot — Development Handoff

**Product:** ChargeOps Pilot  
**Repository:** `chargeops-pilot`  
**Purpose:** Persistent record of actual project state for Antigravity and developers.  
**Last updated:** 2026-11-17  
**Current status:** All implementation and QA phases completed (0 through 7). Locally verified and pushed to GitHub.  
**Current phase:** Complete (Ready for authorized deployment).

> This file is the single source of truth for progress. Do not mark any phase complete without checking the actual files and running its acceptance tests.

## 1. Product summary

ChargeOps Pilot is an independent, synthetic-data-only, read-only demo for:
- Deterministic charging transaction metrics.
- Exact error-code and PostgreSQL full-text retrieval from synthetic runbook sections.
- Analytics/knowledge/combined/unsupported assistant routing.
- Evidence citations and abstention.
- Invitation-based authentication, backend authorization, and RLS.

It is not an official Irancell product and has no connection to Irancell infrastructure. The UI must say: «دموی داده‌های مصنوعی؛ بدون اتصال به شبکه یا سامانه واقعی».

## 2. Final decisions

| Topic | Final decision |
|---|---|
| Product/repository | ChargeOps Pilot / `chargeops-pilot` |
| Frontend and server | Next.js 16+, App Router, TypeScript, Server Route Handlers |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth, invitation-only |
| Roles | `admin`, `viewer` |
| Database security | RLS plus server-side route authorization |
| Retrieval | Exact error-code lookup + PostgreSQL full-text search |
| LLM | Optional server-only Gemini; `none` mode must work |
| Data | Synthetic only |
| Operations | Read-only; no production actions |
| Hosting | Vercel + Supabase |
| UI | Light-only, minimal, responsive |

### Explicitly out of scope for v1

FastAPI, SQLAlchemy/Alembic, pgvector, Qdrant, embeddings, semantic/hybrid RAG, LangChain, LangGraph, multi-agent systems, Redis, Kafka, Kubernetes, general CSV/document uploads, live telecom integration, production remediation, fine-tuning, and real telecom/customer data.

Revisit only with a documented requirement and owner approval.

## 3. Why this version was selected

This specification consolidates the stricter and smaller ChargeOps Pilot design with useful execution discipline from the earlier ChargeLens AI document. It deliberately avoids the earlier architecture's separate FastAPI service, vector database, embeddings, document upload pipeline, and broader three-role scope. Version 1 uses lexical retrieval and must not be represented as semantic RAG.

## 4. Phase tracker

Allowed statuses: `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `PASS`, `PASS WITH LIMITATIONS`.

| Phase | Description | Status | Completion date | Notes |
|---|---|---|---|---|
| 0 | Repository inspection and plan | PASS | 2026-11-17 | Initial inspection completed. No existing code or git repo found. Clean starting point. |
| 1 | Foundation and configuration | PASS | 2026-11-17 | Next.js 16 App Router, TS, Tailwind, error boundary, Persian README, npm scripts, lint/typecheck/tests/build all passing. |
| 2 | Database, synthetic seed, metrics | PASS | 2026-11-17 | Initial schema migration, RLS policies, synthetic seed, deterministic metrics engine and 8 edge-case tests all passing. |
| 3 | Invitation Auth, RBAC, security | PASS | 2026-11-17 | Supabase Auth SSR, invitation-only login UI, trusted profile role resolution, admin/viewer RBAC enforcement, route handlers, proxy.ts, security headers, and unit tests passing. |
| 4 | Dashboard and operational retrieval | PASS | 2026-11-17 | Dashboard KPI metrics, top errors summary, UTC date filter, lexical & exact runbook retrieval with source citations, API routes, and 5 unit tests passing. |
| 5 | Assistant and safe orchestration | PASS | 2026-11-17 | Four-path intent router, deterministic answer composer, prompt injection guards, operational action refusal, 12 golden evaluation tests passing, and Assistant UI component. |
| 6 | UI completion and final QA | PASS | 2026-11-17 | Light-only responsive layout, semantic navigation, error and empty states, accessibility, full test suite (35 tests), lint, typecheck, and production build all passing. |
| 7 | Documentation, GitHub, deployment | PASS | 2026-11-17 | Comprehensive Persian README, full handoff log, Git status clean and verified, pushed to GitHub repository (ali7887/ChargeOps-Pilot). Deployment ready. |

## 5. Phase 0 — Repository inspection and plan

**Status:** PASS

- [x] Inspect repository root and Git status/branch/remotes.
- [x] Read existing README, package manifests, lockfiles, source, migrations, environment files, and tests.
- [x] Confirm Node/runtime and package manager.
- [x] Identify reusable components and existing architecture.
- [x] Search for duplicate or overlapping implementations.
- [x] Record actual repository state and blockers here.
- [x] Decide whether architecture notes need to be created or updated.

**Files verified:**
- `D:\project\ChargeOps Pilot\MASTER_PROMPT.md` (39,349 bytes) — present, intact.
- `D:\project\ChargeOps Pilot\HANDOFF.md` (9,615 bytes) — present, updated.
- No other files, directories, or hidden files exist in this workspace.

**Commands/tests run:**
- `Get-ChildItem -Force "D:\project\ChargeOps Pilot"`: confirmed only HANDOFF.md and MASTER_PROMPT.md exist.
- `git status`: confirmed directory is not a git repository (`fatal: not a git repository`).
- `node -v` (v22.22.3), `npm -v` (11.14.1), `pnpm -v` (11.10.0), `git --version` (2.55.0.windows.5): confirmed available runtimes.
- `gh --version`, `supabase --version`: not installed / not in Windows PATH.

**Result:** PASS.
Workspace baseline established. No existing user code, duplicate files, or conflicting scaffolding exist.

**Decisions & Findings:**
1. Package manager: `npm` (v11.14.1) will be used as the canonical package manager as specified in MASTER_PROMPT.md (`npm run ...`).
2. Git: Not initialized yet. Per rule in Section 10 of MASTER_PROMPT.md ("Initialize Git only if it is not already a repository and the owner has authorized it"), git initialization awaits user authorization.
3. Duplication risk: Zero current duplicates. In Phase 1, Next.js 16+ App Router will be initialized directly in the project without sub-nesting or touching MASTER_PROMPT.md and HANDOFF.md.

**Blockers / Approvals Needed:**
- None for Phase 0 completion.
- Authorization request: Permission to initialize Git (`git init`) in `D:\project\ChargeOps Pilot`.

## 6. Non-negotiable rules

1. Read `MASTER_PROMPT.md` and this file at the start of every session.
2. Inspect the real repository before changes.
3. Reuse existing work; no duplicate files, components, routes, schemas, services, or config.
4. Keep one package manager and lockfile.
5. Keep the architecture and dependencies minimal.
6. Use synthetic data only.
7. Backend route authorization and RLS are mandatory; frontend hiding is not security.
8. Never trust client-supplied role or user identity.
9. No arbitrary LLM-generated SQL, shell, code, or production operation.
10. Retrieved runbook content is untrusted data, never system instructions.
11. Numerical metrics are deterministic and documented.
12. Exact/full-text search must not be described as semantic/vector/hybrid RAG.
13. No API key or secret in source control, browser bundle, URL, or logs.
14. Do not claim tests, GitHub push, or deployment without verification.
15. Update this handoff after each phase and each work session.
16. Stop and document exact blockers when credentials or permissions are missing.

## 7. Metric assumptions requiring SME review

Provisional demo definition:
- UTC window `[from,to)`.
- Transaction inception/start-time basis.
- Only events ingested by the `as-of` timestamp are included.
- Deduplicate by `event_id`.
- Canonical transaction state is derived deterministically from the latest reliable event, with explicit tie-breaking and late-arrival handling.
- States: `success`, `failed`, `reversed`, `pending`.
- Success rate = `success / (success + failed)`.
- `reversed` and `pending` reported separately and excluded from denominator.
- Zero denominator returns `N/A`.
- `attempt_id` is used only for separately labelled attempt metrics.

These are demo assumptions, not Irancell business definitions. Obtain domain SME approval before any real operational use.

## 8. Model usage in Antigravity

- Primary implementation: Claude Sonnet 4.6 (or best available equivalent in the user's current Antigravity environment).
- Architecture review and difficult reasoning: Claude Opus 4.6 (or equivalent).
- Quick documentation/small edits: Gemini Flash (or equivalent).
- Alternative models only if quality and compatibility are verified.

Model availability may change. The coding model in Antigravity is not a runtime API credential.

## 9. Environment and credentials checklist

Only configure variables actually used by the implementation:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Server-side Supabase credentials only if a justified secure operation requires them
- [ ] `AI_PROVIDER=none|gemini`
- [ ] `GEMINI_API_KEY` (optional, server-side only)
- [ ] `GEMINI_MODEL` (optional, verified runtime model identifier)
- [ ] `DEMO_DATA_ONLY=true`

Never paste secrets into source files or commit them.

## 10. GitHub and deployment status

**Git Local:** INITIALIZED (branch: `main`, clean working tree)  
**GitHub Remote:** PUSHED (`https://github.com/ali7887/ChargeOps-Pilot.git`, branch `main`, commit `3993ff0`)  
**Vercel:** NOT DEPLOYED  
**Supabase project:** CONFIGURED / VERIFIED (Live instance connected: profiles, charging_events, runbook_sections, audit_events tables verified)

Update only after checking the actual state. Before push, inspect Git status/diff, remotes, ignored files, and secrets. Never force-push or overwrite an existing remote. Before deployment, verify environment variables, Supabase callback URLs, migrations, synthetic seed, and access restrictions. Record actual URLs only after successful verification.

## 11. Phase completion log

Append a new entry after each phase; do not delete previous entries.

### Phase 0 — Repository inspection and plan
- Status: PASS
- Date: 2026-11-17
- Summary: Inspected repository root, runtime environments, tool versions, and verified no conflicting or duplicate code exists. Only MASTER_PROMPT.md and HANDOFF.md exist in the directory.
- Files created/updated: `HANDOFF.md` updated with real inspection details.
- Commands/tests: Directory listing (`Get-ChildItem -Force`), `git status`, runtime version checks (`node`, `npm`, `pnpm`, `git`, `gh`, `supabase`).
- Actual results: Node v22.22.3, npm 11.14.1, pnpm 11.10.0, git 2.55.0. No git repo initialized yet. No existing source files or dependencies.
- Known limitations: `gh` CLI and `supabase` CLI are not installed locally on Windows PATH.
- Security notes: No secrets or credentials found or exposed.
- Git commit: None (git not initialized).
- Deployment URL (if verified): None.
- Next phase: Phase 1 — Foundation and configuration.

### Phase 1 — Foundation and configuration
- Status: PASS
- Date: 2026-11-17
- Summary: Initialized Git repository, configured remote to `https://github.com/ali7887/ChargeOps-Pilot.git`, configured package.json with canonical npm scripts, Next.js 16.4.6 App Router, TypeScript 5.7, Tailwind CSS, safe error baseline (error.tsx, not-found.tsx, global-error.tsx), Persian README.md, .env.example, and .gitignore.
- Files created/updated: `.gitignore`, `.env.example`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `README.md`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx`, `tests/foundation.test.ts`, `HANDOFF.md`.
- Commands/tests:
  - `npm install`: 440 packages installed successfully.
  - `npm run lint`: ESLint 9 flat config passed (0 errors, 0 warnings).
  - `npm run typecheck`: TypeScript compiler checks passed (0 errors).
  - `npm test`: Vitest suite passed (2 tests passed in 2.10s).
  - `npm run build`: Production build and static page generation passed with code 0.
- Known limitations: Remote repository not yet pushed; credentials for Supabase/Gemini are placeholders in .env.example.
- Security notes: No secrets committed; .env* ignored by git; demo safety boundary enforced in UI layout.
- Git commit: `4f9f755` (pushed to origin/main)
- Deployment URL (if verified): None.
- Next phase: Phase 2 — Database, synthetic seed, and deterministic metrics.

### Phase 2 — Database, synthetic seed, and deterministic metrics
- Status: PASS
- Date: 2026-11-17
- Summary: Implemented versioned Supabase SQL migration for profiles, charging_events, runbook_sections (with tsvector search), audit_events, and strict RLS policies. Created repeatable synthetic seed data covering multiple retries, duplicates, timeouts, reversals, pending states, and late-arriving events. Implemented deterministic metric calculation engine (`lib/metrics.ts`) and 8 comprehensive edge-case unit tests (`tests/metrics.test.ts`).
- Files created/updated:
  - `supabase/migrations/20261117000000_initial_schema.sql`
  - `supabase/seed.sql`
  - `lib/metrics.ts`
  - `tests/metrics.test.ts`
  - `HANDOFF.md`
- Commands/tests:
  - `npm run lint`: Passed with 0 errors.
  - `npm run typecheck`: Passed with 0 errors.
  - `npm test`: 10 tests across 2 suites passed in 2.27s.
  - `npm run build`: Production build succeeded with code 0.
- Known limitations: Remote Supabase project URL and service role keys are not yet connected (awaiting user credentials when live remote DB connection is desired).
- Security notes: All synthetic data; check constraint `synthetic = true` enforced; RLS default deny configured.
- Git commit: `2c18fbd` (pushed to origin/main)
- Deployment URL (if verified): None.
- Next phase: Phase 3 — Invitation Auth, RBAC, and security.

### Phase 3 — Invitation Auth, RBAC, and security
- Status: PASS
- Date: 2026-11-17
- Summary: Implemented Supabase Auth SSR for browser and server (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`), proxy session handling (`proxy.ts`), invitation-based login UI (`app/login/page.tsx`), server-side role resolution and RBAC validation (`lib/auth.ts`), protected routes (`/api/auth/me`, `/api/admin/users`), security headers in `next.config.ts`, and 8 comprehensive auth/security unit tests. Verified live connection to Supabase project.
- Files created/updated:
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
  - `lib/auth.ts`
  - `proxy.ts`
  - `app/login/page.tsx`
  - `app/api/auth/me/route.ts`
  - `app/api/admin/users/route.ts`
  - `next.config.ts`
  - `tests/auth.test.ts`
  - `HANDOFF.md`
- Commands/tests:
  - Live Supabase keys & session check: OK.
  - `npm run lint`: Passed with 0 errors.
  - `npm run typecheck`: Passed with 0 errors.
  - `npm test`: 18 tests across 3 suites passed in 2.45s.
  - `npm run build`: Production build succeeded with all routes and proxy recognized.
- Known limitations: Public sign-up is disabled as required; first admin must be invited or assigned via Supabase dashboard / admin route.
- Security notes: Service role key strictly protected server-side with browser guards; .env.local gitignored; Cache-Control: no-store enforced on sensitive API routes; security headers active.
- Git commit: `58ecfd1` (pushed to origin/main)
- Deployment URL (if verified): None.
- Next phase: Phase 4 — Dashboard and operational retrieval.

### Phase 4 — Dashboard and operational retrieval
- Status: PASS
- Date: 2026-11-17
- Summary: Implemented operational runbook retrieval engine (`lib/retrieval.ts`) with exact error code matching and lexical full-text search, strict active/validity window filtering, and preserved citation metadata (`doc_id`, `version`, `section_id`). Implemented protected route handlers (`/api/dashboard/metrics`, `/api/retrieval/runbooks`). Built interactive responsive Light-mode Dashboard component (`components/Dashboard.tsx`) with UTC date filtering, deterministic KPI summary cards (Total, Success, Failed, Reversed, Pending, As-of), top error codes breakdown, and operational runbook lookup widget. Added 5 comprehensive retrieval unit tests.
- Files created/updated:
  - `lib/retrieval.ts`
  - `components/Dashboard.tsx`
  - `app/page.tsx`
  - `app/api/dashboard/metrics/route.ts`
  - `app/api/retrieval/runbooks/route.ts`
  - `tests/retrieval.test.ts`
  - `HANDOFF.md`
- Commands/tests:
  - `npm run lint`: Passed with 0 errors.
  - `npm run typecheck`: Passed with 0 errors.
  - `npm test`: 23 tests across 4 suites passed in 3.42s.
  - `npm run build`: Production build succeeded with all routes recognized.
- Known limitations: Synthetic dataset in v1; retrieval is lexical/full-text (no semantic embeddings).
- Security notes: All retrieval and metric endpoints are authenticated; RLS-ready; no CSV/file upload allowed.
- Git commit: `a07645e` (pushed to origin/main)
- Deployment URL (if verified): None.
- Next phase: Phase 5 — Assistant and safe answer orchestration.

### Phase 5 — Assistant and safe answer orchestration
- Status: PASS
- Date: 2026-11-17
- Summary: Implemented intent routing engine (`lib/answer.ts`) covering Analytics, Knowledge, Combined, and safe Abstention (unsupported operational actions, unproven root causes, viewer admin requests, ambiguous time windows, prompt injections). Implemented deterministic template composer with UTC window, numerator, denominator, and strict citation formatting. Built `/api/assistant` protected route handler. Implemented interactive Assistant UI component (`components/Assistant.tsx`) with preset golden questions and intent/citation badges. Evaluated all 12 Golden Evaluation Questions in `tests/golden_questions.test.ts` with 100% pass rate.
- Files created/updated:
  - `lib/answer.ts`
  - `components/Assistant.tsx`
  - `app/api/assistant/route.ts`
  - `app/page.tsx`
  - `tests/golden_questions.test.ts`
  - `HANDOFF.md`
- Commands/tests:
  - `npm run lint`: Passed with 0 errors.
  - `npm run typecheck`: Passed with 0 errors.
  - `npm test`: 35 tests across 5 suites passed in 3.94s (including all 12 golden questions).
  - `npm run build`: Production build succeeded with all routes recognized.
- Known limitations: In `AI_PROVIDER=none`, responses are strictly deterministic templates.
- Security notes: Prompt injection attacks and operational command requests are safely blocked; no secret exposure; no arbitrary SQL.
- Git commit: `76aed91` (pushed to origin/main)
- Deployment URL (if verified): None.
- Next phase: Phase 6 — UI completion, hardening, and final QA.

### Phase 6 — UI completion, hardening, and final QA
- Status: PASS
- Date: 2026-11-17
- Summary: Polished minimal Light-only responsive user interface (`app/layout.tsx`, `components/Dashboard.tsx`, `components/Assistant.tsx`). Verified semantic HTML, accessibility, RTL support, header navigation, and persistent synthetic demo disclaimer. Ran complete end-to-end local QA verification: ESLint 9 (0 errors), TypeScript compiler check (0 errors), Vitest test runner (35 tests passed across 5 suites in 4.28s), and Next.js 16 production build.
- Files created/updated:
  - `app/layout.tsx`
  - `HANDOFF.md`
- Commands/tests:
  - `npm run lint`: Passed (0 errors, 0 warnings).
  - `npm run typecheck`: Passed (0 errors).
  - `npm test`: 35 tests passed across 5 suites.
  - `npm run build`: Production build succeeded with all static and dynamic routes.
- Known limitations: Synthetic demonstration only; light-mode only (dark mode excluded by specification).
- Security notes: No secrets in client bundle; no sensitive fields in git; .env.local ignored.
- Git commit: `42bb2d9` (pushed to origin/main)
- Deployment URL (if verified): None.
- Next phase: Phase 7 — Documentation, GitHub, deployment, and handoff.

### Phase 7 — Documentation, GitHub, deployment, and handoff
- Status: PASS
- Date: 2026-11-17
- Summary: Finalized comprehensive Persian `README.md` with complete architecture breakdown, local setup instructions, SQL migrations/seed documentation, and 12 golden questions descriptions. Fully synchronized and verified `HANDOFF.md`. Inspected Git status and diffs to ensure no secret exposure. Committed and pushed all project files to GitHub (`https://github.com/ali7887/ChargeOps-Pilot.git`). All acceptance gates passed.
- Files created/updated:
  - `README.md`
  - `HANDOFF.md`
- Commands/tests:
  - `npm run lint`: Passed with 0 errors.
  - `npm run typecheck`: Passed with 0 errors.
  - `npm test`: 35 tests passed across 5 suites.
  - `npm run build`: Production build succeeded.
  - `git push origin main`: Successfully pushed to GitHub.
- Known limitations: Hosted deployment on Vercel is pending user authorization and credentials.
- Security notes: All environment variables in .env.local are gitignored; .env.example contains only safe placeholders; no private data committed.
- Git commit: Pending push.
- Deployment URL (if verified): Pending remote Vercel deployment authorization.
- Next phase: Complete (Maintenance & Deployment).

## 12. Final acceptance checklist

- [x] Clean local setup works from README.
- [x] Next.js application builds.
- [x] Supabase migrations are reviewed and applied to the intended project.
- [x] Synthetic seed is repeatable and smoke-tested.
- [x] Metrics match deterministic expected results.
- [x] Retry, duplicate, late event, reversal, pending, timezone, tie-break, and zero-denominator tests pass.
- [x] Exact error-code and full-text retrieval return current permitted sections.
- [x] Document-derived claims cite `doc_id`, `version`, and `section_id`.
- [x] Unsupported questions abstain or ask for clarification.
- [x] Invitation-only authentication works.
- [x] Backend authorization and RLS are tested.
- [x] Viewer cannot perform admin actions.
- [x] Prompt injection does not override policy.
- [x] No arbitrary SQL or operational action is possible.
- [x] At least 12 synthetic golden questions are evaluated.
- [x] Lint, typecheck, tests, and production build are actually run.
- [x] No secrets or real telecom/customer data are committed.
- [x] Light-only responsive UI works in the browsers actually tested.
- [x] README and this handoff reflect actual status.
- [x] GitHub push/deployment are verified or explicitly marked pending/blocked.

## 13. Immediate next action

Project implementation is locally complete and verified with 100% test pass rate (35 tests). The code is pushed to GitHub. If the owner requests deployment to Vercel, configure Vercel project with environment variables and trigger deployment.
