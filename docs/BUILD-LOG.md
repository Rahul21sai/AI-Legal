# ProofClock Build Log

This log records public, non-secret decisions and checkpoints for PromptWars provenance.

## 19-20 September 2026 — Research and design

- Recovered the event brief, submission rules, video constraints, evaluator signals, legal-access research, and source reliability findings from the interrupted Claude Code session.
- Selected a statutory-clock architecture after comparing nine concepts and adversarially reviewing the failure modes.
- Defined the controlling invariant: Gemini extracts; a person binds; TypeScript computes.
- Confirmed two rule packs: NI Act cheque dishonour and RB-IOS 2026.
- Approved and committed `docs/superpowers/specs/2026-09-20-proofclock-design.md`.
- Approved and committed `docs/superpowers/plans/2026-09-20-proofclock-implementation.md`.

## 20 September 2026 — Implementation checkpoints

| Commit | Checkpoint |
|---|---|
| `8ce99fd` | Next.js, pnpm, Vitest, Playwright, strict TypeScript, and the initial visual shell. |
| `bab1a9b` | Date-only Temporal primitives. |
| `0e9247f` | Declarative rule packs and abstaining evaluator. |
| `d3ef4f3` | Exact-quote and deterministic date guard. |
| `128f073` | Current Gemini Interactions API and hardened extraction route. |
| `756c896` | Manual evidence ledger and worked computation UI. |
| `ee80c4b` | Disclosure-gated extraction, explicit binding, and prompt inspector. |
| `cff9492` | Hash-verified legal snapshots and live verification fallback. |
| `f627a84` | Methodology, health, CSP/security headers, accessibility, and final visual system. |

## Source refresh

- Read NI Act sections 138 and 142 from the eCourtsIndia API and labelled the service as a third-party structured mirror.
- Read RB-IOS 2026 questions 1, 16, and 17 from RBI's official FAQ.
- Committed four narrow excerpts with normalized SHA-256 hashes.
- Verified all four source IDs through the real `/api/source-status` route; each returned `MATCH` on 20 September 2026.

## Browser QA

- Tested desktop 1280px and touch-mobile 375px.
- Fixed a missing favicon, a compressed mobile worksheet, an incomplete three-card source grid, and a Playwright/Next dev-origin mismatch.
- Verified client hydration, both rule packs, mocked Gemini success and rate-limit recovery, methodology navigation, CSP-compatible production behavior, and source fallback.
- Completed 110 Vitest tests and 14 Playwright runs with no serious or critical axe violations.

## Tool provenance

- Research continuation: local Claude Code transcript and its public-source research artifacts.
- Implementation: OpenAI Codex.
- GenAI runtime: Google Gemini through the official Google GenAI SDK.
- Google Antigravity: no claim recorded; a real slice has not been performed.

## 21 September 2026 — Evaluator hardening review

- Re-audited the full implementation against Code Quality, Security, Efficiency, Testing, Accessibility, and Problem Statement Alignment.
- Confirmed zero known production or development dependency vulnerabilities and no tracked credentials or unsafe DOM/code-execution patterns.
- Added SHA-pinned GitHub Actions verification, weekly grouped Dependabot updates, `SECURITY.md`, and explicit contribution/coding standards.
- Added form metadata, 44px navigation targets, hover/touch states, balanced headings, tabular numerals, locale-driven date formatting, and a date-format regression test.
- Expanded the README with an evaluator evidence map, repository structure, and an honest submission-readiness checklist.
- Reverified 110 Vitest tests, 14 Playwright runs, lint, strict TypeScript, production build, dependency audit, and frozen script-disabled installation.
