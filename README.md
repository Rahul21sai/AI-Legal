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

Requirements: Node.js 22.23.1 and pnpm 11.19.0.

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

- **108 Vitest tests** across domain, guard, routes, components, and source fallback.
- **14 Playwright tests** across desktop Chromium and touch-mobile Chromium.
- Axe checks cover the empty, UNBOUND, and methodology states with no serious or critical violations.
- Real-browser QA found no console error, failed request, horizontal overflow, or dead interaction.

## Deployment

The application targets Vercel with Node.js 22. The clean production domain must remain public during evaluation; hash-suffixed protected preview URLs are not suitable for submission. Verify `/`, `/method`, `/api/health`, manual calculation, Gemini extraction, and live-source fallback from a signed-out browser after every deployment.

## Tool provenance

The current implementation was developed in OpenAI Codex. No Google Antigravity usage is claimed in this repository because no build slice has yet been executed there. If the event organizer confirms Antigravity is mandatory, record a real implementation or review slice before adding that claim to the submission.

## Further detail

- [GenAI architecture](docs/GENAI-ARCHITECTURE.md)
- [Four-minute demo script](docs/DEMO-SCRIPT.md)
- [Build log](docs/BUILD-LOG.md)
- [Browser QA report](docs/QA-REPORT.md)
- [Approved design](docs/superpowers/specs/2026-09-20-proofclock-design.md)
