# ProofClock Browser QA Report

Date: 20 September 2026  
Target: local production build and Next.js development E2E server

## Summary

| Metric | Result |
|---|---:|
| Pages tested | 2 (`/`, `/method`) |
| API surfaces smoke-tested | 3 |
| Viewports | Desktop 1280px, touch-mobile 375px |
| Playwright project runs | 14 passed |
| Serious or critical axe violations | 0 |
| Remaining console errors | 0 |
| Remaining failed requests | 0 |
| Horizontal overflow | 0 viewports |

## Bugs found and resolved

### QA-1: Missing browser icon

- Actual: desktop Chrome requested `/favicon.ico` and logged one 404.
- Resolution: added local `src/app/icon.svg`; no remote asset or dependency.
- Verification: production browser rerun reported no console or network errors.

### QA-2: Computation table too compressed on mobile

- Actual: three columns squeezed legal labels and results below a readable width at 375px.
- Resolution: preserved semantic table markup while stacking Rule, Working, and Result inside each row below 46rem.
- Verification: touch-mobile screenshot review and no-overflow Playwright test.

### QA-3: Odd source grid left an empty desktop quadrant

- Actual: three source cards in a two-column grid left a large unused fourth cell.
- Resolution: the final odd card spans the desktop grid and returns to one column on mobile.

### QA-4: E2E host mismatch blocked client hydration

- Actual: Playwright used `127.0.0.1` while Next dev served `localhost`; Next 16 blocked the HMR origin, so native radio selection changed but React state did not.
- Resolution: aligned Playwright `baseURL` and web-server URL to `localhost`. Origin protection remains enabled.
- Verification: all 14 browser runs passed.

## Passed journeys

- Manual cheque chain: UNBOUND → receipt binding → local recomputation.
- RBI later-of selection and pre-commencement COVERAGE LIMIT.
- Mocked Gemini extraction remains unbound until review.
- Rate-limit failure leaves manual entry functional.
- Prompt inspector exposes current model, prompt, schema, raw response, and guard trace.
- Method navigation works by keyboard.
- Empty and UNBOUND states have no serious or critical axe violation.
- Production security headers and secret-safe `/api/health` payload verified.
