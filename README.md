# ProofClock

ProofClock turns user-confirmed legal events into transparent statutory clock worksheets. Google Gemini can identify candidate dated events in short evidence, but it cannot bind a trigger, perform arithmetic, generate an authority, or decide a legal outcome.

Built for **PromptWars: Virtual (Exclusive Edition)** under the **AI for Legal Assistance & Access** problem statement.

## The boundary

ProofClock deliberately separates three jobs:

1. **Extract** — optional Gemini extraction returns event labels and exact quotes from text supplied for that request.
2. **Bind** — the person using the tool reviews a guarded quote and explicitly attaches its date to a named statutory anchor.
3. **Compute** — pure TypeScript applies calendar-day, calendar-month, next-day, fallback, and later-of operations.

Missing evidence produces **UNBOUND** and stops dependent rows. Dates before the reviewed RB-IOS 2026 commencement produce **COVERAGE LIMIT**. The interface does not call a matter timely, late, valid, maintainable, open, or closed.

> Legal information, not legal advice. ProofClock performs arithmetic only on the reviewed rule and trigger selected in the interface. Court holidays, limitation exclusions, extensions, condonation, legal characterisation, and professional advice remain outside the calculation.

## Supported worksheets

- **Cheque dishonour** — reviewed arithmetic for Negotiable Instruments Act 1881 sections 138(b), 138(c), and 142(1)(b). Dispatch cannot satisfy the drawer-receipt anchor.
- **RBI Ombudsman 2026** — the standard 30-day response period, a confirmed applicable-timeline override, later-of selection, and the 90-day period under RB-IOS 2026.

## Evaluator parameter map

| Parameter | Evidence in this repository |
|---|---|
| **Code Quality** | Strict TypeScript, exact dependencies, focused domain/AI/server/feature boundaries, current Gemini Interactions API, ESLint with zero warnings, and conventional incremental commits. |
| **Security** | Same-origin API validation, Zod schemas, evidence grounding, CSP/HSTS/frame/permissions headers, bounded rate limiting, secret-safe logs, frozen lockfile, zero known dependency advisories, SHA-pinned CI actions, and `SECURITY.md`. |
| **Efficiency** | Static application routes, zero database/RAG/vector store, client-side recomputation after binding, low-thinking extraction, narrow snapshots, a 2-second live-source timeout, and manual fallback. |
| **Testing** | 110 Vitest tests plus 14 Playwright desktop/touch-mobile runs, including red-green domain tests, API failure paths, source drift, real browser flows, and axe. |
| **Accessibility** | Semantic table/fieldset/label structure, skip link, keyboard navigation, visible focus, 44px targets, non-colour states, reduced motion, responsive stacked ledger, and zero serious/critical axe findings. |
| **Problem Statement Alignment** | Legal information rather than advice; two grounded Indian statutory clocks; explicit UNBOUND/COVERAGE LIMIT states; source provenance; prompt/response inspection; and preparation of evidence questions without drafting or filing. |

## Repository structure

~~~text
src/
├── ai/                 # Versioned prompt, Gemini adapter, schemas, evidence guard
├── app/                # Next.js pages, route handlers, metadata, global visual system
├── domain/             # Date-only engine and reviewed rule packs
├── features/           # Evidence, ledger, provenance, inspector, workbench UI
├── server/             # Origin validation and bounded rate limiter
└── sources/            # Snapshot registry, hashing, and live verification
tests/e2e/              # Desktop and touch-mobile Playwright journeys
docs/                   # Architecture, demo, QA, build record, design and plan
.github/                # SHA-pinned quality and security workflow
~~~

Dependencies point inward: UI and HTTP adapters consume domain contracts; the domain imports no React, network, SDK, or environment code.

## Hackathon submission readiness

| Required item | Status |
|---|---|
| Public GitHub repository under 10 MB | ✅ Public and comfortably below the limit |
| Project description | ✅ This README |
| Explicit GenAI architecture | ✅ Table above and `docs/GENAI-ARCHITECTURE.md` |
| Working public deployment | ❌ Vercel login and deployment still required |
| Working Gemini extraction in deployment | ❌ Add `GEMINI_API_KEY` to the production environment |
| Walkthrough video under 4 minutes | ❌ Record after the production deployment; script is provided |
| Editable Hack2Skill submission form | ⚠️ Must be confirmed in Rahul's signed-in event dashboard |

Do not submit the final entry until every ❌ item is complete and the live URL/video are verified signed out.

## Architecture

~~~text
short evidence ──optional──> Gemini Interactions API
                                  │ event kind + exact quote only
                                  v
                            deterministic guard
                                  │ verified source span + parsed date
                                  v
manual date ───────────────> explicit human binding
                                  │ confirmed YYYY-MM-DD
                                  v
                           pure rule-pack engine
                                  │ worked rows
                                  v
                      BOUND / UNBOUND / COVERAGE LIMIT
~~~

The manual path never contacts Gemini. Legal excerpts are committed as narrow, hash-verified snapshots. A two-second live check may confirm that an excerpt remains present, but runtime content never rewrites a rule.

## GenAI integration map

| Stage | Service | Exact integration |
|---|---|---|
| Prompt contract | Google Gemini | `src/ai/prompts/extract-events.v1.ts` |
| SDK adapter | Google GenAI SDK 2.23, `interactions.create` | `src/ai/gemini-client.ts` |
| Orchestration | Structured response validation and evidence guard | `src/ai/extract-service.ts` |
| HTTP boundary | Same-origin validation, rate limit, timeout, no-store response | `src/app/api/extract-events/route.ts` |
| Trust surface | Prompt, schema, raw response, accepted and rejected candidates | `src/features/prompt-inspector/prompt-inspector.tsx` |

Model output is constrained to a closed event enum plus an exact `evidenceQuote`. Post-model code rejects unknown event kinds, missing or duplicated quotes, invalid or ambiguous dates, and dispatch-only evidence mislabeled as receipt. No candidate binds automatically.

## Legal-source provenance

- RBI timing text comes from the Reserve Bank of India's official RB-IOS 2026 FAQ.
- NI Act text comes from **IndiaCode by eCourtsIndia**, a third-party structured mirror. The UI labels it as such and states that the Gazette of India or official text prevails.
- Four excerpts are stored under `src/domain/rule-packs/snapshots/`; their normalized SHA-256 values are checked before use.
- The application remains functional when every live source is unavailable.

## Privacy and security

- No login, database, cookies, analytics, local storage, or application telemetry.
- Manual dates stay in current-tab React state.
- Optional evidence text is sent to Google only after per-request acknowledgement.
- Request bodies, evidence text, dates, model responses, forwarding addresses, and API keys are not logged.
- The extraction route enforces same-origin requests, a 5,000-character limit, a bounded per-instance token bucket, a 12-second timeout, and typed safe errors.
- CSP, frame protection, referrer policy, permissions policy, MIME sniffing protection, and HSTS are applied through Next.js response headers.

## Run locally

Requirements: Node.js 24.19.0 and pnpm 11.19.0.

~~~powershell
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm dev
~~~

`GEMINI_API_KEY` is optional. Without it, the complete manual calculator and source snapshots remain available. Set `GEMINI_MODEL` only to replace the pinned default `gemini-3.8-flash`.

## Verification

~~~powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
~~~

Current verified baseline:

- **110 Vitest tests** across domain, guard, routes, components, and source fallback.
- **14 Playwright tests** across desktop Chromium and touch-mobile Chromium.
- Axe checks cover the empty, UNBOUND, and methodology states with no serious or critical violations.
- Real-browser QA found no console error, failed request, horizontal overflow, or dead interaction.

## Deployment

The application targets Vercel with Node.js 24 LTS. The clean production domain must remain public during evaluation; hash-suffixed protected preview URLs are not suitable for submission. Verify `/`, `/method`, `/api/health`, manual calculation, Gemini extraction, and live-source fallback from a signed-out browser after every deployment.

GitHub Actions repeats the frozen install with lifecycle scripts disabled, dependency audit, lint, type-check, unit tests, production build, and Playwright suite on every push to `main` and on every pull request.

## Tool provenance

The current implementation was developed in OpenAI Codex. No Google Antigravity usage is claimed in this repository because no build slice has yet been executed there. If the event organizer confirms Antigravity is mandatory, record a real implementation or review slice before adding that claim to the submission.

## Further detail

- [GenAI architecture](docs/GENAI-ARCHITECTURE.md)
- [Four-minute demo script](docs/DEMO-SCRIPT.md)
- [Build log](docs/BUILD-LOG.md)
- [Browser QA report](docs/QA-REPORT.md)
- [Approved design](docs/superpowers/specs/2026-09-20-proofclock-design.md)
- [Contribution and coding standards](CONTRIBUTING.md)
