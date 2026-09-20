# Contributing to ProofClock

## Architectural boundaries

- `src/domain/` is pure TypeScript. It must not import React, Next.js, network clients, environment variables, browser storage, or JavaScript `Date` for legal arithmetic.
- `src/ai/` may classify exact user evidence but must not calculate dates, generate authorities, select a legal trigger, or bypass the deterministic guard.
- `src/app/api/` contains thin HTTP adapters. Validation, model orchestration, hashing, and rate limiting belong in focused modules outside route files.
- `src/features/` owns presentation and user-controlled state. It consumes domain results and never reimplements clock arithmetic.
- Runtime source checks may verify reviewed snapshots; they must never mutate rule-pack operations or silently replace legal text.

## TypeScript and naming

- Keep `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` enabled.
- Use descriptive domain names such as `ConfirmedBinding`, `ClockOperation`, and `EvaluationResult`; avoid untyped dictionaries at public module boundaries.
- Represent legal dates as validated `YYYY-MM-DD` strings and `Temporal.PlainDate` internally.
- Prefer discriminated unions for states and errors. Handle every state explicitly.
- Keep files focused; split a module when it gains a second unrelated reason to change.

## Test standard

- Introduce behavior with a failing test, observe the expected failure, implement the minimum change, and rerun the focused and full suites.
- Derive expected dates independently as literal fixtures; never compute expected values with the production helper under test.
- Mock only external operations such as Gemini and live sources. Domain and UI behavior should exercise real code.
- Add Playwright coverage for cross-layer workflows and axe coverage for materially new UI states.

## Accessibility and content

- Use semantic HTML before ARIA. Every control needs a visible or programmatic label, keyboard operation, visible focus, and at least a 44px target.
- Never communicate BOUND, UNBOUND, INVALID INPUT, or COVERAGE LIMIT through colour alone.
- Use neutral arithmetic language. Do not introduce second-person legal conclusions, rankings, advice, or filing recommendations.

## Dependency and security policy

- Use pnpm 11.19.0 with exact versions and the committed lockfile.
- Verify a package's provenance before adding it. Avoid dependencies for trivial functionality.
- Never commit `.env` files, keys, tokens, case documents, or real personal legal data.
- Run `pnpm audit:security`, `pnpm verify`, and `pnpm test:e2e` before proposing a merge.
