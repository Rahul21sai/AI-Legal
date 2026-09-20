# ProofClock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build and deploy a test-first Next.js legal-information application in which Gemini proposes grounded dated-event candidates, the user binds an event, and deterministic TypeScript computes transparent statutory clock worksheets.

**Architecture:** A dependency-free domain layer owns date-only arithmetic and rule-pack evaluation. React provides a client-side evidence ledger and computation worksheet; thin Next.js routes adapt the Gemini and live-source ports. Committed source snapshots and manual date entry remain functional when every external service is unavailable.

**Tech Stack:** Node.js 22.23.1, pnpm 11.19.0, Next.js 16.3.5, React 19.3.0, TypeScript 6.0.3, Zod 4.6.5, Google GenAI SDK 2.23.0, Temporal polyfill 0.5.1, Vitest 5.0.1, Testing Library, Playwright 1.63.0, vanilla CSS.

**Spec:** docs/superpowers/specs/2026-09-20-proofclock-design.md

## Global Constraints

- The target submission deadline is 26 September 2026 at 23:59 IST.
- The public GitHub repository must remain below 10 MB.
- The application must be reachable without login and must keep its core calculation functional without Gemini or network access.
- Gemini identifies grounded event candidates only. It must not choose triggers, perform arithmetic, emit authorities, or write legal conclusions.
- No extracted candidate binds without an explicit user action.
- Every legal date is a Temporal.PlainDate value represented at boundaries as YYYY-MM-DD; JavaScript Date is forbidden in the domain layer.
- Every missing dependency propagates UNBOUND. Dates outside a reviewed rule pack produce COVERAGE_LIMIT and never fall through to another regime.
- Manual inputs and optional extraction text are not persisted or logged.
- Legal source snapshots are primary; live requests have a two-second timeout and may verify but never mutate a rule at runtime.
- The UI uses neutral mechanical language and never calls a claim timely, late, valid, maintainable, open, or closed.
- The complete experience targets WCAG 2.2 AA with keyboard operation, visible focus, semantic status text, and no colour-only or hover-only information.
- Generated framework and configuration files are the sole non-behavioural TDD exception. Every production behaviour is introduced by a failing test.
- Existing research artifacts in the workspace remain untracked and must not be deleted, rewritten, or accidentally published.

---

## File Map

### Repository and tooling

- package.json: exact dependency and script contract.
- pnpm-lock.yaml: reproducible dependency graph.
- pnpm-workspace.yaml: pnpm 11 project settings using camelCase keys.
- .nvmrc: Node 22.23.1.
- .gitignore: excludes secrets, build output, test artifacts, and the pre-existing research corpus.
- .env.example: server environment names without values.
- tsconfig.json, next.config.ts, eslint.config.mjs: strict build and security-header configuration.
- vitest.config.ts, vitest.setup.ts: unit and component tests.
- playwright.config.ts: browser and accessibility tests.

### Application shell

- src/app/layout.tsx: metadata and global shell.
- src/app/page.tsx: server entry that renders ProofClockWorkbench.
- src/app/globals.css: complete design system and responsive rules.
- src/app/method/page.tsx: architecture, AI boundary, privacy, sources, and limitations.
- src/app/api/health/route.ts: non-secret runtime health.

### Domain

- src/domain/clock/types.ts: ISO date, operations, states, and row contracts.
- src/domain/clock/plain-date.ts: strict parsing, formatting, arithmetic, and comparison.
- src/domain/clock/evaluate.ts: ordered dependency evaluation and abstention propagation.
- src/domain/rule-packs/types.ts: rule-pack and source-reference contracts.
- src/domain/rule-packs/ni-act-138.ts: cheque dishonour anchors and steps.
- src/domain/rule-packs/rbi-ombudsman-2026.ts: RBI anchors, steps, and commencement guard.
- src/domain/rule-packs/registry.ts: closed rule-pack lookup.

### AI and extraction

- src/ai/contracts.ts: request, raw candidate, guarded candidate, trace, and error schemas.
- src/ai/prompts/extract-events.v1.ts: versioned closed-enum prompt builder.
- src/ai/date-token.ts: deterministic date token parsing from verified quotes.
- src/ai/guard.ts: exact quote resolution and candidate rejection.
- src/ai/gemini-client.ts: Interactions API adapter.
- src/ai/extract-service.ts: prompt, model call, schema validation, guard, and trace orchestration.
- src/app/api/extract-events/route.ts: same-origin validated HTTP adapter.

### Sources

- src/domain/rule-packs/snapshots/ni-act-138.json: narrow attributed provision snapshot.
- src/domain/rule-packs/snapshots/rbi-ios-2026.json: narrow official RBI snapshot.
- src/sources/contracts.ts: snapshot and live-status contracts.
- src/sources/normalise.ts: stable text normalization and SHA-256 hashing.
- src/sources/verify-source.ts: injected fetch, two-second abort, and status mapping.
- src/app/api/source-status/route.ts: closed source-id HTTP adapter.

### User experience

- src/features/workbench/workbench-reducer.ts: browser-only state transitions.
- src/features/workbench/proofclock-workbench.tsx: composition root.
- src/features/rule-selector/rule-selector.tsx: equal-weight rule-pack choice.
- src/features/evidence/manual-evidence-ledger.tsx: labelled manual date controls.
- src/features/evidence/extract-events-panel.tsx: disclosure and optional Gemini request.
- src/features/evidence/candidate-binding-list.tsx: source-order review and explicit confirmation.
- src/features/ledger/computation-ledger.tsx: worked rows and UNBOUND/COVERAGE_LIMIT states.
- src/features/provenance/source-panel.tsx: snapshot and live-status presentation.
- src/features/prompt-inspector/prompt-inspector.tsx: prompt, schema, response, and guard decisions.

### Tests

- Tests are co-located beside focused production modules as *.test.ts or *.test.tsx.
- tests/e2e/manual-cheque.spec.ts: missing evidence then local recomputation.
- tests/e2e/rbi-later-of.spec.ts: dynamic second rule pack.
- tests/e2e/extraction-recovery.spec.ts: mocked Gemini and manual fallback.
- tests/e2e/accessibility.spec.ts: axe and keyboard checks across major states.

---

### Task 1: Scaffold the strict, testable application shell

**Files:**
- Create: package.json
- Create: pnpm-lock.yaml
- Create: pnpm-workspace.yaml
- Create: .nvmrc
- Create: .gitignore
- Create: .env.example
- Create: tsconfig.json
- Create: next-env.d.ts
- Create: next.config.ts
- Create: eslint.config.mjs
- Create: vitest.config.ts
- Create: vitest.setup.ts
- Create: playwright.config.ts
- Create: src/app/layout.tsx
- Create: src/app/page.tsx
- Create: src/app/page.test.tsx
- Create: src/app/globals.css

**Interfaces:**
- Produces: pnpm scripts dev, build, lint, typecheck, test, test:watch, test:e2e, and verify.
- Produces: a server-rendered page whose main heading is ProofClock and whose first interactive affordance is manual rule selection.

- [ ] **Step 1: Add deterministic tool configuration**

Create package.json with exact versions:

~~~json
{
  "name": "proofclock",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.19.0",
  "engines": { "node": ">=22.23.1" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  },
  "dependencies": {
    "@google/genai": "2.23.0",
    "@js-temporal/polyfill": "0.5.1",
    "next": "16.3.5",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.63.0",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.7",
    "@types/node": "26.6.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "eslint": "9.39.5",
    "eslint-config-next": "16.3.5",
    "jsdom": "30.1.0",
    "typescript": "6.0.3",
    "vitest": "5.0.1"
  }
}
~~~

Set saveExact: true and engineStrict: true in pnpm-workspace.yaml, Node 22.23.1 in .nvmrc, and add research-artifact paths plus .env*, .next, node_modules, coverage, test-results, playwright-report, and blob-report to .gitignore. Keep .env.example tracked. Do not create .npmrc because this project has no registry credentials.

- [ ] **Step 2: Install and record the exact graph**

Run: pnpm install

Expected: pnpm-lock.yaml is created; pnpm install --frozen-lockfile succeeds immediately afterward.

- [ ] **Step 3: Write the failing shell test**

~~~tsx
import { render, screen } from '@testing-library/react';
import Page from './page';

test('introduces ProofClock as arithmetic controlled by the user', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1, name: 'ProofClock' })).toBeVisible();
  expect(screen.getByText(/you choose the trigger/i)).toBeVisible();
});
~~~

- [ ] **Step 4: Run the shell test and verify RED**

Run: pnpm vitest run src/app/page.test.tsx

Expected: FAIL because src/app/page.tsx does not exist.

- [ ] **Step 5: Implement the minimal shell**

Create a semantic layout and page with a skip link, header, main element, h1 ProofClock, the sentence You choose the trigger. Code computes the dates., and a disabled-looking static rule selector placeholder containing the two approved pack names. Add only the CSS needed for readable fonts, focus visibility, a 70ch content width, and light/dark system colours.

- [ ] **Step 6: Verify the scaffold**

Run: pnpm vitest run src/app/page.test.tsx && pnpm lint && pnpm typecheck && pnpm build

Expected: PASS with no warnings.

- [ ] **Step 7: Commit**

~~~powershell
git add package.json pnpm-lock.yaml pnpm-workspace.yaml .nvmrc .gitignore .env.example tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs vitest.config.ts vitest.setup.ts playwright.config.ts src/app
git commit -m "chore: scaffold ProofClock application"
~~~

---

### Task 2: Build the date-only clock primitives

**Files:**
- Create: src/domain/clock/types.ts
- Create: src/domain/clock/plain-date.ts
- Create: src/domain/clock/plain-date.test.ts

**Interfaces:**
- Produces: parseIsoDate(value: string): PlainDateResult
- Produces: applyClockOperation(inputs: readonly string[], operation: ClockOperation): IsoDate
- Produces: compareIsoDates(left: IsoDate, right: IsoDate): -1 | 0 | 1
- Produces: ClockOperation union add_days, add_months, next_day, later_of, first_available, and copy.

- [ ] **Step 1: Write failing primitive tests**

~~~ts
import { applyClockOperation, parseIsoDate } from './plain-date';

test('adds calendar days without including the anchor day', () => {
  expect(applyClockOperation(['2026-07-18'], { kind: 'add_days', amount: 30 }))
    .toBe('2026-08-17');
});

test('adds a calendar month rather than thirty days', () => {
  expect(applyClockOperation(['2026-01-31'], { kind: 'add_months', amount: 1 }))
    .toBe('2026-02-28');
});

test('chooses the later confirmed anchor mechanically', () => {
  expect(applyClockOperation(['2026-07-31', '2026-08-10'], { kind: 'later_of' }))
    .toBe('2026-08-10');
});

test('rejects timestamps and impossible dates', () => {
  expect(parseIsoDate('2026-02-30').ok).toBe(false);
  expect(parseIsoDate('2026-07-18T00:00:00Z').ok).toBe(false);
});
~~~

- [ ] **Step 2: Verify RED**

Run: pnpm vitest run src/domain/clock/plain-date.test.ts

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Implement strict date-only arithmetic**

Use Temporal.PlainDate.from with overflow reject. Return strings only through toString. Throw a typed ClockInputError for the wrong input count, invalid dates, negative operation amounts, or an empty later_of input. Do not import React, fetch, environment values, or JavaScript Date.

~~~ts
export type ClockOperation =
  | { readonly kind: 'add_days'; readonly amount: number }
  | { readonly kind: 'add_months'; readonly amount: number }
  | { readonly kind: 'next_day' }
  | { readonly kind: 'later_of' }
  | { readonly kind: 'first_available' }
  | { readonly kind: 'copy' };
~~~

- [ ] **Step 4: Add edge tests**

Cover leap day, 30-day month, year boundary, equal later_of inputs, copy, next_day, negative amounts, and wrong arity.

- [ ] **Step 5: Verify GREEN**

Run: pnpm vitest run src/domain/clock/plain-date.test.ts && pnpm typecheck

Expected: PASS.

- [ ] **Step 6: Commit**

~~~powershell
git add src/domain/clock
git commit -m "feat: add date-only clock primitives"
~~~

---

### Task 3: Define and evaluate the two statutory rule packs

**Files:**
- Create: src/domain/rule-packs/types.ts
- Create: src/domain/rule-packs/ni-act-138.ts
- Create: src/domain/rule-packs/rbi-ombudsman-2026.ts
- Create: src/domain/rule-packs/registry.ts
- Create: src/domain/clock/evaluate.ts
- Create: src/domain/clock/evaluate.test.ts

**Interfaces:**
- Consumes: ClockOperation and ISO-date helpers from Task 2.
- Produces: evaluateRulePack(pack: RulePack, anchors: AnchorValues): EvaluationResult
- Produces: getRulePack(id: RulePackId): RulePack
- Produces: ordered EvaluationRow objects with BOUND, UNBOUND, INVALID_INPUT, or COVERAGE_LIMIT.

- [ ] **Step 1: Write the failing cheque-chain tests**

~~~ts
test('propagates missing drawer receipt through dependent rows', () => {
  const result = evaluateRulePack(niAct138, {
    bank_information_received: '2026-07-18',
    demand_notice_dispatched: '2026-08-02'
  });
  expect(result.row('notice_boundary')).toMatchObject({ state: 'BOUND', value: '2026-08-17' });
  expect(result.row('payment_period_boundary')).toMatchObject({ state: 'UNBOUND' });
  expect(result.row('complaint_boundary')).toMatchObject({ state: 'UNBOUND' });
});

test('computes the reviewed chain after receipt is bound', () => {
  const result = evaluateRulePack(niAct138, {
    bank_information_received: '2026-07-18',
    demand_notice_received_by_drawer: '2026-08-20'
  });
  expect(result.row('payment_period_boundary').value).toBe('2026-09-04');
  expect(result.row('cause_of_action_date').value).toBe('2026-09-05');
  expect(result.row('complaint_boundary').value).toBe('2026-10-05');
});
~~~

- [ ] **Step 2: Write the failing RBI tests**

~~~ts
test('uses the later available RBI anchor before adding ninety days', () => {
  const result = evaluateRulePack(rbiOmbudsman2026, {
    complaint_to_regulated_entity: '2026-07-01',
    last_communication_from_entity: '2026-08-10'
  });
  expect(result.row('standard_response_boundary').value).toBe('2026-07-31');
  expect(result.row('window_anchor').value).toBe('2026-08-10');
  expect(result.row('ombudsman_boundary').value).toBe('2026-11-08');
});

test('stops outside the reviewed commencement period', () => {
  const result = evaluateRulePack(rbiOmbudsman2026, {
    complaint_to_regulated_entity: '2026-06-30'
  });
  expect(result.coverage).toEqual({ state: 'COVERAGE_LIMIT', code: 'PREDATES_RBI_IOS_2026' });
  expect(result.rows.every((row) => row.state === 'COVERAGE_LIMIT')).toBe(true);
});
~~~

- [ ] **Step 3: Verify RED**

Run: pnpm vitest run src/domain/clock/evaluate.test.ts

Expected: FAIL because rule-pack evaluation is absent.

- [ ] **Step 4: Implement the declarative evaluator**

Evaluate steps in declared order. Resolve each dependency from confirmed anchors or earlier rows. If a dependency is absent or non-BOUND, emit UNBOUND with the exact missing anchor ids and do not invoke arithmetic. Apply pack coverage before evaluating steps. Freeze exported pack objects in development tests so UI code cannot mutate them.

~~~ts
export type StepDefinition = Readonly<{
  id: string;
  label: string;
  provision: string;
  sourceRef: string;
  dependencies: readonly string[];
  operation: ClockOperation;
  missingEvidence: string;
  caveats: readonly string[];
}>;
~~~

Encode the NI Act steps in notice, payment-period, next-day, calendar-month order. Encode the RBI steps as 30 days, later_of, 90 days. The dispatch anchor is displayed but is not a dependency of the receipt step.

- [ ] **Step 5: Add invariant tests**

Assert deterministic row order, unknown anchor rejection, dependency-cycle rejection during pack validation, sourceRef presence, no second-person wording in labels/caveats, and that demand_notice_dispatched can never populate demand_notice_received_by_drawer.

- [ ] **Step 6: Verify GREEN**

Run: pnpm vitest run src/domain && pnpm typecheck

Expected: PASS.

- [ ] **Step 7: Commit**

~~~powershell
git add src/domain/clock src/domain/rule-packs
git commit -m "feat: add statutory rule-pack evaluator"
~~~

---

### Task 4: Guard Gemini candidates with exact source evidence

**Files:**
- Create: src/ai/contracts.ts
- Create: src/ai/prompts/extract-events.v1.ts
- Create: src/ai/date-token.ts
- Create: src/ai/date-token.test.ts
- Create: src/ai/guard.ts
- Create: src/ai/guard.test.ts

**Interfaces:**
- Consumes: event enums from RulePack.
- Produces: buildExtractionPrompt(pack, text): PromptTrace
- Produces: guardCandidates(inputText, rawCandidates, pack): GuardResult
- Produces: parseSingleDateToken(quote): parsed, none, or ambiguous.

- [ ] **Step 1: Write failing deterministic date-token tests**

Cover 18 Jul 2026, 18 July 2026, 18/07/2026, 2026-07-18, an impossible 31/02/2026, and a quote containing two dates. Only a single unambiguous token may become a candidate.

~~~ts
expect(parseSingleDateToken('Memo received on 18 Jul 2026.')).toEqual({
  state: 'parsed',
  value: '2026-07-18',
  sourceText: '18 Jul 2026'
});
expect(parseSingleDateToken('Sent 2 Aug 2026, received 5 Aug 2026.').state).toBe('ambiguous');
~~~

- [ ] **Step 2: Write failing quote-guard tests**

~~~ts
test('accepts an exact quote and retains the original source slice', () => {
  const text = 'The return memo was received on 18 Jul 2026.';
  const result = guardCandidates(text, [{
    eventKind: 'bank_information_received',
    evidenceQuote: 'The return memo was received on 18 Jul 2026.'
  }], niAct138);
  expect(result.accepted[0]).toMatchObject({
    eventKind: 'bank_information_received',
    normalizedDate: '2026-07-18',
    requiresConfirmation: true,
    range: { start: 0, end: text.length }
  });
});

test('rejects an invented or duplicate quote', () => {
  const invented = guardCandidates('Memo received yesterday.', [{
    eventKind: 'bank_information_received', evidenceQuote: 'Memo received on 18 Jul 2026.'
  }], niAct138);
  expect(invented.rejected[0].reason).toBe('QUOTE_NOT_FOUND');
});
~~~

- [ ] **Step 3: Verify RED**

Run: pnpm vitest run src/ai/date-token.test.ts src/ai/guard.test.ts

Expected: FAIL because the extraction boundary does not exist.

- [ ] **Step 4: Implement the closed contracts and parser**

Use Zod discriminated unions for accepted and rejected results. Parse only the four documented date shapes. Resolve exact source matches first; allow a second pass that normalizes Unicode normalization form, non-breaking spaces, and repeated whitespace while retaining a reversible original range. Reject multiple normalized matches.

- [ ] **Step 5: Implement prompt version 1**

The system prompt must state all of the following literally: copy evidenceQuote from the supplied text; use only the allowed event enum; return every plausible candidate in source order; use OUT_OF_SCOPE when no enum fits; do not select a legal trigger; do not compute, rewrite, advise, cite, or explain; do not infer a receipt date from dispatch.

Expose PROMPT_VERSION = extract-events.v1 and a JSON schema generated from the Zod raw-candidate contract.

- [ ] **Step 6: Add adversarial guard tests**

Cover smart quotes, non-breaking spaces, repeated text, unknown event enums, OUT_OF_SCOPE, no date, two dates, a model-normalized date absent from the quote, and a dispatch quote mislabeled as receipt. The last case must be rejected by a pack-specific compatibility guard.

- [ ] **Step 7: Verify GREEN**

Run: pnpm vitest run src/ai && pnpm typecheck

Expected: PASS.

- [ ] **Step 8: Commit**

~~~powershell
git add src/ai
git commit -m "feat: guard AI event extraction"
~~~

---

### Task 5: Add the Gemini service and hardened extraction route

**Files:**
- Create: src/ai/gemini-client.ts
- Create: src/ai/gemini-client.test.ts
- Create: src/ai/extract-service.ts
- Create: src/ai/extract-service.test.ts
- Create: src/server/request-security.ts
- Create: src/server/request-security.test.ts
- Create: src/server/token-bucket.ts
- Create: src/app/api/extract-events/route.ts
- Create: src/app/api/extract-events/route.test.ts

**Interfaces:**
- Consumes: prompt, raw schema, guard, and rule registry.
- Produces: GeminiPort.createStructuredInteraction(request): Promise<unknown>
- Produces: extractEvents(request, dependencies): Promise<ExtractionTrace>
- Produces: POST /api/extract-events with typed success and failure payloads.

- [ ] **Step 1: Write failing service tests with an injected fake**

Test that the service passes model, low thinking level, prompt version, and JSON schema; validates model JSON; applies the guard; includes rejected candidates in the trace; and never includes the API key or full input in an error.

~~~ts
const fake: GeminiPort = {
  createStructuredInteraction: vi.fn().mockResolvedValue({
    candidates: [{ eventKind: 'bank_information_received', evidenceQuote: 'Memo received 18 Jul 2026.' }]
  })
};
const trace = await extractEvents({ rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' }, { gemini: fake });
expect(trace.accepted[0].normalizedDate).toBe('2026-07-18');
~~~

- [ ] **Step 2: Write failing route security tests**

Test POST-only behaviour, content type, 5,000-character limit, unknown pack, missing Origin in production, mismatched Origin/Host, unavailable API key, service timeout, 429 mapping, malformed model output, and successful safe JSON. Assert console methods never receive the submitted text.

- [ ] **Step 3: Verify RED**

Run: pnpm vitest run src/ai/extract-service.test.ts src/app/api/extract-events/route.test.ts

Expected: FAIL because the service and route do not exist.

- [ ] **Step 4: Implement the official SDK adapter**

Instantiate GoogleGenAI only on the server. Call client.interactions.create with the environment-selected model, response_format using application/json and the extraction schema, and generation_config.thinking_level set to low. Normalize the SDK response inside this adapter so no other module depends on SDK response shapes.

Use GEMINI_MODEL when present and gemini-3.8-flash otherwise. Reject an empty interaction output as MODEL_RESPONSE_REJECTED.

- [ ] **Step 5: Implement the route and best-effort limiter**

Use a per-instance token bucket keyed by a one-way SHA-256 digest of the forwarding address, capped at 10 extraction requests per 10 minutes with a bounded 1,000-entry map. Do not store the raw address. Abort the model request after 12 seconds. Return Cache-Control: no-store on every extraction response.

Typed HTTP mapping:

- 400 INVALID_INPUT.
- 403 INVALID_ORIGIN.
- 429 RATE_LIMITED.
- 503 EXTRACTION_UNAVAILABLE.
- 504 EXTRACTION_TIMEOUT.
- 502 MODEL_RESPONSE_REJECTED.

- [ ] **Step 6: Verify GREEN and inspect the SDK types**

Run: pnpm vitest run src/ai src/server src/app/api/extract-events && pnpm typecheck

Expected: PASS. Confirm the compiled adapter uses interactions.create, response_format, and generation_config.thinking_level from @google/genai 2.23.0 rather than a legacy generateContent surface.

- [ ] **Step 7: Commit**

~~~powershell
git add src/ai src/server src/app/api/extract-events
git commit -m "feat: add secure Gemini extraction route"
~~~

---

### Task 6: Build the manual evidence ledger and computation UI

**Files:**
- Create: src/features/workbench/workbench-reducer.ts
- Create: src/features/workbench/workbench-reducer.test.ts
- Create: src/features/workbench/proofclock-workbench.tsx
- Create: src/features/workbench/proofclock-workbench.test.tsx
- Create: src/features/rule-selector/rule-selector.tsx
- Create: src/features/evidence/manual-evidence-ledger.tsx
- Create: src/features/ledger/computation-ledger.tsx
- Modify: src/app/page.tsx

**Interfaces:**
- Consumes: rule registry and evaluateRulePack.
- Produces: browser-only WorkbenchState with selectedPackId, manualAnchors, candidates, confirmedAnchors, extractionTrace, and source statuses.
- Produces: actions select_pack, edit_manual_anchor, confirm_candidate, clear_anchor, extraction_started, extraction_succeeded, and extraction_failed.

- [ ] **Step 1: Write failing reducer tests**

Assert pack changes clear incompatible anchors and AI traces; editing an anchor recalculates locally; confirming a candidate copies only its normalized date and provenance; clearing a required anchor makes dependents UNBOUND; and no reducer action mutates previous state.

- [ ] **Step 2: Write the failing manual workflow component test**

~~~tsx
test('shows unbound receipt rows and recomputes after a manual receipt date', async () => {
  const user = userEvent.setup();
  render(<ProofClockWorkbench />);
  await user.click(screen.getByRole('radio', { name: /cheque dishonour/i }));
  await user.type(screen.getByLabelText(/bank information received/i), '2026-07-18');
  expect(screen.getByText('17 Aug 2026')).toBeVisible();
  expect(screen.getAllByText('UNBOUND').length).toBeGreaterThan(0);
  await user.type(screen.getByLabelText(/drawer received the demand notice/i), '2026-08-20');
  expect(screen.getByText('05 Oct 2026')).toBeVisible();
});
~~~

- [ ] **Step 3: Verify RED**

Run: pnpm vitest run src/features/workbench

Expected: FAIL because the workbench does not exist.

- [ ] **Step 4: Implement semantic manual controls**

Use fieldset and legend for pack selection and anchors. Use native input type=date, preserve ISO values, and show the exact legal phrase and evidence examples under each anchor. Do not prefill dates. The dispatch input must remain visually distinct from the receipt input and include Dispatch does not bind receipt.

- [ ] **Step 5: Implement the worked ledger**

Render a real table on wide screens and the same semantic table with responsive CSS on narrow screens. Each row displays provision, input expression, operation, result, source reference, and caveat. UNBOUND rows show the missing evidence text. COVERAGE_LIMIT replaces every RBI row for pre-1-July-2026 complaints.

Format display dates with Intl.DateTimeFormat using UTC components derived from the ISO date, never by parsing into a local JavaScript Date.

- [ ] **Step 6: Verify GREEN**

Run: pnpm vitest run src/features src/app/page.test.tsx && pnpm typecheck

Expected: PASS.

- [ ] **Step 7: Commit**

~~~powershell
git add src/features src/app/page.tsx src/app/page.test.tsx
git commit -m "feat: add manual evidence and clock ledger"
~~~

---

### Task 7: Add optional extraction, explicit binding, and prompt inspection

**Files:**
- Create: src/features/evidence/extract-events-panel.tsx
- Create: src/features/evidence/extract-events-panel.test.tsx
- Create: src/features/evidence/candidate-binding-list.tsx
- Create: src/features/evidence/candidate-binding-list.test.tsx
- Create: src/features/prompt-inspector/prompt-inspector.tsx
- Create: src/features/prompt-inspector/prompt-inspector.test.tsx
- Modify: src/features/workbench/proofclock-workbench.tsx

**Interfaces:**
- Consumes: POST /api/extract-events trace.
- Produces: a disclosure-gated optional request and source-order candidate list.
- Produces: prompt inspector over only the current in-memory trace.

- [ ] **Step 1: Write failing extraction UI tests**

Test that no request occurs before disclosure acknowledgement; input over 5,000 characters is blocked; accepted candidates display their original quote and normalized date; no candidate is selected by default; confirm is a button; rejected candidates are summarized; and a failed request leaves manual controls enabled.

- [ ] **Step 2: Write failing inspector tests**

Test collapsed-by-default details, keyboard toggle, prompt version, model, thinking level, schema, raw structured response, accepted decisions, rejected reasons, and absence of any API key field.

- [ ] **Step 3: Verify RED**

Run: pnpm vitest run src/features/evidence src/features/prompt-inspector

Expected: FAIL because the extraction experience does not exist.

- [ ] **Step 4: Implement the optional request flow**

Use fetch with POST, same-origin relative URL, application/json, and AbortController at 13 seconds. Announce extracting, success, and failure in an aria-live polite region. Copy no state to storage. A retry sends only the current text after a fresh acknowledgement checkbox action.

- [ ] **Step 5: Implement explicit candidate binding**

List candidates by source range. Each card shows event label, exact quote, parsed date, and Review and bind button. If another candidate already occupies that anchor, confirmation replaces it only after a second Replace binding action. OUT_OF_SCOPE candidates never show a bind control.

- [ ] **Step 6: Implement the inspector**

Use details and summary. Render structured objects with JSON.stringify in a pre element; never use raw HTML. Provide copy buttons with visible success text and no hover-only affordance.

- [ ] **Step 7: Verify GREEN**

Run: pnpm vitest run src/features && pnpm typecheck

Expected: PASS.

- [ ] **Step 8: Commit**

~~~powershell
git add src/features
git commit -m "feat: add reviewable Gemini event binding"
~~~

---

### Task 8: Add narrow legal snapshots and live verification fallback

**Files:**
- Create: src/domain/rule-packs/snapshots/ni-act-138.json
- Create: src/domain/rule-packs/snapshots/rbi-ios-2026.json
- Create: src/sources/contracts.ts
- Create: src/sources/normalise.ts
- Create: src/sources/normalise.test.ts
- Create: src/sources/verify-source.ts
- Create: src/sources/verify-source.test.ts
- Create: src/app/api/source-status/route.ts
- Create: src/app/api/source-status/route.test.ts
- Create: src/features/provenance/source-panel.tsx
- Create: src/features/provenance/source-panel.test.tsx
- Modify: src/domain/rule-packs/ni-act-138.ts
- Modify: src/domain/rule-packs/rbi-ombudsman-2026.ts
- Modify: src/features/workbench/proofclock-workbench.tsx

**Interfaces:**
- Produces: getSnapshot(sourceId): SourceSnapshot
- Produces: verifySource(snapshot, fetchImpl, signal): Promise<SourceStatus>
- Produces: GET /api/source-status?sourceId= with MATCH, TIMEOUT, UNREACHABLE, or CHANGED.

- [ ] **Step 1: Capture and review the exact source excerpts**

For NI Act, store only sections 138(b), 138(c), and 142(1)(b) excerpts needed by the operations, with retrieval date, source identity, attribution, URL, and normalized SHA-256. For RBI, store the official 2026 FAQ or scheme clauses for the 30-day prerequisite, later-of anchor, 90-day period, commencement, and replacement statement. Record no case law and no unrelated provisions.

Before committing, manually compare each excerpt to the linked source and have the snapshot test assert that every rule-pack sourceRef resolves.

- [ ] **Step 2: Write failing normalization and verification tests**

Cover CRLF, non-breaking spaces, repeated whitespace, matching content, two-second abort, HTTP failure, and changed content. Assert that CHANGED never returns replacement rule text.

~~~ts
expect(await verifySource(snapshot, matchingFetch, AbortSignal.timeout(2000)))
  .toMatchObject({ state: 'MATCH' });
expect(await verifySource(snapshot, changedFetch, AbortSignal.timeout(2000)))
  .toMatchObject({ state: 'CHANGED', sourceId: snapshot.id });
~~~

- [ ] **Step 3: Verify RED**

Run: pnpm vitest run src/sources src/app/api/source-status

Expected: FAIL because source verification is absent.

- [ ] **Step 4: Implement the verifier and closed route**

The route accepts only source ids from the snapshot registry, uses GET, emits Cache-Control public, max-age=300, stale-while-revalidate=3600, and never proxies arbitrary URLs. Use AbortSignal.timeout(2000). Map timeout and network failure to HTTP 200 typed fallback states so the UI can continue from the snapshot.

- [ ] **Step 5: Implement provenance UI**

Display source identity, official or third-party-mirror label, retrieval date, excerpt, link, attribution, and optional live status. TIMEOUT and UNREACHABLE say Snapshot retained. CHANGED says Source changed; reviewed snapshot not replaced. Do not call a third-party mirror official.

- [ ] **Step 6: Verify offline behaviour**

Run all source tests with fetch forced to throw, then render both rule packs and confirm source excerpts and calculations remain present.

Run: pnpm vitest run src/sources src/domain src/features/provenance

Expected: PASS.

- [ ] **Step 7: Commit**

~~~powershell
git add src/domain/rule-packs src/sources src/app/api/source-status src/features/provenance src/features/workbench/proofclock-workbench.tsx
git commit -m "feat: add verified legal source snapshots"
~~~

---

### Task 9: Finish the methodology, security headers, visual system, and health surface

**Files:**
- Create: src/app/method/page.tsx
- Create: src/app/method/page.test.tsx
- Create: src/app/api/health/route.ts
- Create: src/app/api/health/route.test.ts
- Modify: src/app/layout.tsx
- Modify: src/app/globals.css
- Modify: next.config.ts
- Modify: src/features/workbench/proofclock-workbench.tsx

**Interfaces:**
- Produces: public explanation of the AI boundary, privacy, sources, limitations, and GenAI file map.
- Produces: health JSON with version, Gemini configured boolean, model id, snapshot versions, and no secrets.

- [ ] **Step 1: Write failing method and health tests**

Assert the method page names extract, bind, compute; states no retention; names Google Gemini as optional; lists both snapshots and the third-party-mirror warning; and links back to the calculator. Assert health omits every environment value except the non-secret model id and configured boolean.

- [ ] **Step 2: Verify RED**

Run: pnpm vitest run src/app/method src/app/api/health

Expected: FAIL because these routes do not exist.

- [ ] **Step 3: Implement the visual system**

Use CSS custom properties for paper, ink, muted ink, indigo, amber, red, green, border, focus, and hatched background. Use a serif display face from the system stack and a sans-serif interface stack; load no remote font. Constrain prose to 70ch and the workbench to 1180px. Add a sticky but non-obscuring source/method nav, ledger row alignment, mobile stacking at 760px, reduced motion, dark-system colours, and print rules that preserve the worksheet while hiding controls.

- [ ] **Step 4: Add security headers**

Configure:

- Content-Security-Policy limiting default-src to self, connect-src to self, img-src to self and data, style-src to self and unsafe-inline only for Next.js style output, script-src to self with the Next.js-required production policy, object-src none, base-uri self, form-action self, frame-ancestors none.
- Referrer-Policy strict-origin-when-cross-origin.
- X-Content-Type-Options nosniff.
- Permissions-Policy disabling camera, microphone, geolocation, payment, and USB.

Run the production build and browser test the CSP; do not ship a header that blocks Next.js hydration.

- [ ] **Step 5: Add application-wide accessibility assertions**

Test skip link, one h1, focus order, 44-pixel controls, labels, legends, table headers, non-colour state text, live regions, details controls, and reduced-motion media query. Add no hover-only content.

- [ ] **Step 6: Verify GREEN**

Run: pnpm lint && pnpm typecheck && pnpm test && pnpm build

Expected: PASS without warnings.

- [ ] **Step 7: Commit**

~~~powershell
git add src/app src/features/workbench/proofclock-workbench.tsx next.config.ts
git commit -m "feat: finish ProofClock trust and accessibility surfaces"
~~~

---

### Task 10: Prove the complete story and prepare public delivery

**Files:**
- Create: tests/e2e/manual-cheque.spec.ts
- Create: tests/e2e/rbi-later-of.spec.ts
- Create: tests/e2e/extraction-recovery.spec.ts
- Create: tests/e2e/accessibility.spec.ts
- Create: README.md
- Create: docs/GENAI-ARCHITECTURE.md
- Create: docs/DEMO-SCRIPT.md
- Create: docs/BUILD-LOG.md
- Modify: playwright.config.ts
- Modify: package.json

**Interfaces:**
- Consumes: the complete application.
- Produces: repeatable browser evidence and the five-item submission narrative inputs.

- [ ] **Step 1: Write the failing browser journeys**

Manual cheque test:

1. Open /.
2. Select cheque dishonour.
3. Enter bank receipt 2026-07-18 and dispatch 2026-08-02.
4. Assert 2026-08-17 and UNBOUND downstream.
5. Enter drawer receipt 2026-08-20.
6. Assert 2026-09-04, 2026-09-05, and 2026-10-05 without a network request.

RBI test:

1. Select RBI Ombudsman.
2. Enter complaint 2026-07-01 and last communication 2026-08-10.
3. Assert later-of anchor 2026-08-10 and boundary 2026-11-08.
4. Replace complaint with 2026-06-30 and assert COVERAGE LIMIT.

Extraction recovery test intercepts /api/extract-events once with a guarded success and once with RATE_LIMITED; it confirms explicit binding and manual recovery.

Accessibility test runs axe on empty, UNBOUND, BOUND, inspector-open, and error states and completes the manual workflow with keyboard only.

- [ ] **Step 2: Run the browser suite as final story verification**

Run the app in production mode and run: pnpm test:e2e

Expected: journeys already driven by unit and component tests may pass immediately. If a journey fails, confirm the failure is a real cross-layer mismatch before changing production code.

- [ ] **Step 3: Make the browser suite GREEN**

Add stable accessible names and data-independent selectors only where role and label are insufficient. Fix product behaviour, not assertions, when a journey exposes a mismatch with the approved spec.

- [ ] **Step 4: Write the public documentation**

README must contain:

- One-sentence problem and safety boundary.
- Live URL and under-four-minute video slots omitted until real URLs exist; do not publish dead links.
- Local setup with Node, pnpm, and GEMINI_API_KEY.
- Architecture diagram in text.
- Exact Gemini integration table naming prompt, SDK adapter, route, and inspector files.
- Manual fallback and no-retention claim.
- Legal source provenance and third-party warning.
- Test commands and current counts copied from the final run.
- Deployment protection and repository-size checks.
- Google Antigravity disclosure limited to the implementation slice actually used.

GENAI-ARCHITECTURE.md maps each model input and output field and lists structural prohibitions. DEMO-SCRIPT.md contains the eight approved scenes with a 220-second target. BUILD-LOG.md records dated design and implementation decisions without secrets or private prompt content.

- [ ] **Step 5: Run full local verification**

Run:

~~~powershell
pnpm verify
pnpm test:e2e
git status --short
git count-objects -vH
~~~

Expected: every command passes; only intentional untracked research artifacts remain; tracked repository data stays far below 10 MB.

- [ ] **Step 6: Perform live deployment checks**

Deploy to Vercel, then from a signed-out client verify /, /method, /api/health, a successful Gemini extraction, a forced manual path, source timeout fallback, and both rule packs. Confirm the clean production URL returns HTTP 200 and does not redirect to _vercel/sso. Keep deployment protection disabled through 28 September.

- [ ] **Step 7: Commit**

~~~powershell
git add tests README.md docs/GENAI-ARCHITECTURE.md docs/DEMO-SCRIPT.md docs/BUILD-LOG.md playwright.config.ts package.json
git commit -m "test: verify ProofClock end to end"
~~~

---

## Plan Self-Review Results

- Spec coverage: every requirement in sections 2 through 17 maps to Tasks 1 through 10.
- Scope: one application, one engine, two data-defined rule packs, one optional AI operation, and no database or authentication.
- Type consistency: RulePack, AnchorValues, ClockOperation, EvaluationResult, ExtractionTrace, SourceSnapshot, and SourceStatus are introduced before consumers.
- Safety consistency: manual mode remains independent; AI candidates never bind automatically; runtime sources never mutate rules; missing anchors remain UNBOUND.
- Delivery consistency: exact dependency versions are pinned; every behavioural task contains a RED and GREEN command; each task ends in an independently reviewable commit.
