# ProofClock Design Specification

Date: 20 September 2026  
Target: PromptWars: Virtual (Exclusive Edition)  
Submission deadline: 26 September 2026, 23:59 IST

## 1. Product decision

ProofClock is a legal-information tool that produces transparent statutory clock worksheets. It does not decide which law governs a dispute, select a legal trigger, declare a claim valid or time-barred, recommend a remedy, draft legal text, or replace an advocate.

The product separates three responsibilities:

1. Gemini extracts candidate dated events from text supplied by the user and grounds every candidate to an exact quote.
2. The user chooses which candidate occupies a named statutory anchor.
3. Pure TypeScript functions perform date-only arithmetic and render every step with its source provision.

The first-class negative result is UNBOUND. When a required anchor lacks a user-confirmed date, downstream calculations stop and the interface names the missing evidence. A missing delivery record therefore produces a useful result instead of a guessed receipt date.

The initial release supports two rule packs:

- Cheque dishonour under Negotiable Instruments Act 1881 sections 138 and 142.
- Reserve Bank - Integrated Ombudsman Scheme 2026 complaint timing.

The cheque workflow is the primary demonstration. The RBI workflow proves that the same engine is dynamic and highlights a current rule that replaced widely repeated older guidance.

## 2. Goals and success criteria

The product succeeds when a user can:

- Choose either supported rule pack.
- Enter dates manually without using AI.
- Optionally enter a short passage from a bank memo, notice, tracking record, complaint, or reply and ask Gemini to identify candidate dated events.
- See every accepted AI candidate beside the exact user-authored quote that supports it.
- Explicitly bind a candidate or manual date to a named anchor.
- See a step-by-step computation in which every date is produced by deterministic code.
- See an UNBOUND result and the required evidence when an anchor is absent.
- Inspect the Gemini prompt, response schema, model name, grounded candidates, and rejected candidates.
- Open the source used for each rule and distinguish a local snapshot from live verification.
- Complete the primary workflow using keyboard navigation and on a 360-pixel-wide screen.

The release is submission-ready when:

- The application is publicly reachable without authentication.
- The core calculation works with Gemini disabled and with the network unavailable.
- Tests cover the date engine, both rule packs, extraction guards, source fallback, API validation, and the two main browser journeys.
- No server log or persistent store contains user text or dates.
- The repository remains below the event's 10 MB GitHub size limit.
- The README maps Gemini integration to exact files and describes the deterministic boundary.
- The clean Vercel production domain returns HTTP 200 from a signed-out client with deployment protection disabled during evaluation.

## 3. Non-goals

The initial release will not:

- Determine a cause of action or choose a legal provision for the user.
- Say that a remedy is open, closed, valid, maintainable, timely, late, or guaranteed.
- Rank candidate provisions or candidate trigger events.
- Generate citations, statutory text, demand notices, complaints, pleadings, or legal advice.
- Upload, retain, or OCR PDFs.
- Search case law or interpret judgments.
- File on a government portal or advertise, rate, match, or recommend advocates.
- Add authentication, accounts, a database, notifications, voice input, multilingual output, payments, or analytics.
- Treat the eCourtsIndia mirror as an official government source.
- Depend on a live external source to complete a calculation.

These cuts protect the six-day schedule, the public-repository size limit, user privacy, demo reliability, and the legal-information boundary.

## 4. User-facing language

The interface uses neutral, mechanical language.

Permitted examples:

- Section 138(b) states 30 days from receipt of information from the bank.
- Selected anchor: bank-information receipt, 18 July 2026.
- Calculated boundary: 17 August 2026.
- UNBOUND: no user-confirmed date for receipt of the demand notice by the drawer.
- The selected as-of date falls after the calculated boundary.

Prohibited examples:

- Your deadline is 17 August.
- You are still in time.
- Your case is barred.
- This is the correct provision.
- You should file now.

Every calculation view displays: Legal information, not legal advice. The tool performs arithmetic only on the rule and trigger you select. Verify the rule, trigger, court calendar, and any extension or condonation with a qualified professional.

## 5. Experience architecture

### 5.1 Routes

- / is the complete calculator experience.
- /method explains the architecture, AI boundary, source provenance, privacy model, and limitations.
- /api/extract-events accepts short text and returns guarded candidate events.
- /api/source-status checks a configured live source with a two-second deadline and returns verification metadata, never replacement legal rules.
- /api/health reports application version, configured Gemini availability, snapshot versions, and no secret values.

There is no login or onboarding flow. The landing section leads directly to the rule-pack selector.

### 5.2 Main page sequence

1. Product statement and legal-information boundary.
2. Rule-pack selector with two equally weighted choices.
3. Evidence ledger with manual date entry as the default path.
4. Optional Extract from text panel with a clear Google Gemini disclosure.
5. Candidate binding panel. Each anchor shows all compatible candidates in source order; none is preselected.
6. Worked computation ledger.
7. Sources and provenance panel.
8. Prompt and response inspector.
9. Methodology and privacy links.

The visual language resembles an evidence ledger rather than a chatbot: restrained paper and ink colours, strong tabular alignment, high-contrast status labels, visible arithmetic, and no conversational bubbles. UNBOUND uses a hatched treatment plus text and icon, never colour alone.

### 5.3 Manual and AI paths

Manual mode is always available and contains one date field per anchor. A user may complete the entire product without sending data to Google.

AI extraction is progressive enhancement. Before sending text, the interface states:

- The text is sent to the configured Google Gemini API.
- ProofClock does not persist it.
- Gemini proposes event labels only; it does not choose the legal trigger or calculate a date.
- The user must review and confirm every date.

If Gemini is unavailable, misconfigured, rate-limited, slow, or produces unusable output, the panel returns to manual entry without disabling the clock engine.

## 6. Domain model

### 6.1 Core types

RulePack contains:

- id and version.
- title, jurisdiction, plain-language scope, and legal-information warning.
- ordered anchors.
- ordered calculation steps.
- source snapshots.
- pack-specific caveats.

AnchorDefinition contains:

- id.
- event kind accepted from the extraction enum.
- neutral label.
- exact legal phrase describing the event.
- evidence examples.
- whether the anchor is required.

ConfirmedAnchor contains:

- anchor id.
- ISO date-only value in YYYY-MM-DD form.
- origin: manual or extracted.
- optional source quote and character range.
- explicit confirmation timestamp held only in browser memory.

ClockOperation is one of:

- add calendar days.
- add calendar months.
- add one day to create the next-day event.
- choose the later of two confirmed anchors.
- choose the first available anchor in a declared fallback order.
- copy an anchor for display.

ClockStep contains:

- id and label.
- cited provision identifier.
- verbatim source excerpt reference.
- dependencies.
- operation.
- result label.
- explanation template containing typed slots only.
- evidence required when a dependency is missing.
- caveats that must accompany the row.

EvaluationResult contains an ordered row for every step with state BOUND, UNBOUND, INVALID_INPUT, or COVERAGE_LIMIT. A row includes its inputs, operation, output date when present, source reference, and named reason when absent. COVERAGE_LIMIT means the selected dates fall outside the reviewed rule pack; it never falls back to another legal regime.

### 6.2 Date semantics

All legal dates are date-only values. Time zones and JavaScript Date objects are excluded from the domain layer. The engine uses Temporal.PlainDate through the Temporal polyfill so deployment location cannot shift a date.

The engine supports calendar days and calendar months as distinct operations. A calendar month is never converted to 30 days. Month-end behaviour follows Temporal calendar arithmetic and is covered explicitly by tests.

The engine does not automatically adjust for weekends, court holidays, extensions, condonation, limitation exclusions, stays, or emergency orders. Relevant caveats are displayed beside the calculated boundary. The user may choose an as-of date, but the comparison is labelled only before, on, or after the calculated boundary.

## 7. Rule packs

### 7.1 Cheque dishonour pack

Named anchors:

- cheque_date: date shown on the cheque, informational in the initial computation.
- bank_information_received: date the payee received information from the bank regarding dishonour.
- demand_notice_dispatched: date the demand notice was dispatched, shown as evidence but never substituted for receipt.
- demand_notice_received_by_drawer: date the drawer received the demand notice.

Computed rows:

1. Section 138(b) notice boundary: bank_information_received plus 30 calendar days.
2. Section 138(c) payment-period boundary: demand_notice_received_by_drawer plus 15 calendar days.
3. Cause-of-action date: the day after the payment period expires.
4. Section 142 complaint boundary: one calendar month from the cause-of-action date, using the first-day exclusion described in the rule-pack notes.

If demand_notice_received_by_drawer is absent, rows 2 through 4 are UNBOUND. The interface states that dispatch is not receipt and names India Post tracking, acknowledgement of service, or another receipt record as examples of evidence. It does not infer receipt from dispatch.

The pack also displays two non-computational checks:

- The amount demanded in the notice must be reviewed against the cheque amount; ProofClock does not compare or validate amounts in the initial release.
- Cheque presentation validity is governed by a separate RBI direction and is not calculated by this release.

This narrowed scope avoids presenting an incomplete RBI validity rule as part of the statutory chain.

### 7.2 RBI Ombudsman pack

Named anchors:

- complaint_to_regulated_entity: date the complaint was submitted to the bank or other regulated entity.
- applicable_response_timeline_end: a manually confirmed date when a different applicable response timeline governs; otherwise the engine displays the standard 30-day calculation separately.
- last_communication_from_entity: date of the last communication from the regulated entity, optional.

Computed rows:

1. Standard response-period boundary: complaint_to_regulated_entity plus 30 calendar days.
2. Window anchor: the later of the applicable response-period boundary and last_communication_from_entity when both exist; otherwise the confirmed available anchor.
3. RB-IOS 2026 boundary: window anchor plus 90 calendar days.

The source panel states that the 2026 scheme took effect on 1 July 2026 and replaced RB-IOS 2021. The product does not silently apply the 2026 pack to events before that commencement date. For earlier events it shows COVERAGE LIMIT: this release contains no earlier-scheme calculation.

## 8. Gemini extraction boundary

### 8.1 Model and API

The server uses the official Google GenAI JavaScript SDK and the current Interactions API through client.interactions.create. The model is set by GEMINI_MODEL and defaults to the stable gemini-3.8-flash identifier documented during project research. Extraction uses thinking_level low and structured JSON output. The API key is server-only.

The request schema accepts:

- rulePackId.
- text between 1 and 5,000 Unicode characters.
- locale fixed to en-IN for the initial release.

The response schema contains candidates with:

- eventKind from the rule pack's closed enum.
- evidenceQuote copied from the supplied text.
- occurrenceHint when the same quote occurs more than once.
- no computed date, legal conclusion, section number, source citation, recommendation, or free-form explanation.

OUT_OF_SCOPE is a mandatory event kind. The prompt instructs the model to preserve quotes exactly and to return all plausible candidates in source order without ranking them.

### 8.2 Post-model guard

No Gemini result reaches the UI directly. The server:

1. Validates the JSON shape with Zod.
2. Rejects event kinds not allowed by the selected rule pack.
3. Resolves each evidence quote back to the original input using exact matching first and conservative Unicode and whitespace normalization second.
4. Rejects unresolved or multiply ambiguous quotes.
5. Extracts date tokens from the verified source span with deterministic parsing.
6. Rejects spans with zero or multiple unresolved date interpretations.
7. Returns the original source slice, character range, normalized date candidate, event kind, and a mandatory requiresConfirmation flag.

The UI never renders a date taken from model-authored prose. It renders the original user quote and a deterministic normalization that the user must confirm. A candidate cannot bind automatically.

### 8.3 Prompt inspector

The inspector shows:

- Prompt version.
- Model identifier and thinking level.
- System instruction with secret values absent.
- User input sent in the current browser session.
- JSON schema.
- Raw structured candidate response.
- Accepted and rejected candidates with guard reasons.

The inspector is collapsed by default but keyboard accessible. It exists both for trust and for the event's requirement to show the prompt and response.

## 9. Legal sources and provenance

Each rule pack ships a narrow JSON snapshot containing only:

- instrument title.
- provision identifier.
- required verbatim excerpt.
- source URL.
- publisher or mirror identity.
- retrieval date.
- licence or attribution where applicable.
- normalized-content SHA-256 hash.

The snapshot is the primary read path and keeps the calculator functional offline. It remains far below the repository size limit.

Source hierarchy:

- RBI material uses RBI's own 2026 FAQ or scheme document as the primary source.
- NI Act provision text uses an attributed narrow snapshot with an official India Code or Gazette link when reliably obtainable. If the eCourtsIndia API supplies the machine-readable text, the UI labels it IndiaCode by eCourtsIndia, third-party structured mirror; Gazette or official text prevails.

The live source-status endpoint has a two-second abort deadline. It normalizes fetched text and compares its hash with the committed snapshot:

- MATCH displays Live source matched with the check time.
- TIMEOUT or UNREACHABLE displays Snapshot from retrieval date; calculation remains available.
- CHANGED displays Source content changed; snapshot not silently replaced. The methodology page explains that a human must review and version the rule pack.

Runtime content never changes an operation, period, anchor, or citation automatically.

## 10. Server boundaries and security

The application has no database and writes no user data to disk.

The extraction route:

- Accepts POST only with application/json.
- Enforces same-origin requests using Origin and Host checks in production.
- Validates body size, Unicode length, rule-pack id, and schema before model invocation.
- Uses a server-side timeout and returns typed errors.
- Applies a best-effort per-instance token bucket to reduce accidental abuse without adding an external datastore.
- Never logs request bodies, model responses, dates, source quotes, or API keys.
- Emits only request id, duration, outcome class, model id, and token counts.

Security headers include a restrictive Content-Security-Policy, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, and frame restrictions. The UI does not use raw HTML injection. Links opened in a new tab use rel=noopener noreferrer.

Environment validation fails clearly when GEMINI_API_KEY is absent, while the browser keeps manual mode available. Public health output reports Gemini configured: true or false and never exposes the key.

Typed API errors are:

- INVALID_INPUT.
- EXTRACTION_UNAVAILABLE.
- EXTRACTION_TIMEOUT.
- RATE_LIMITED.
- MODEL_RESPONSE_REJECTED.
- SOURCE_TIMEOUT.
- SOURCE_UNREACHABLE.
- SOURCE_CHANGED.

Every error has an accessible user message and a manual-mode recovery action.

## 11. State and privacy

All case state lives in React state in the current tab. Refresh clears it. No localStorage, cookies, analytics, telemetry SDK, database, share link, or server session is used in the initial release.

Only optional extraction text leaves the browser, after the disclosure is acknowledged for that request. Manual dates and calculated results stay client-side. The privacy claim is therefore narrow and testable: ProofClock itself does not retain case data. The methodology page separately identifies Google as the processor for optional extraction and links its applicable API data terms.

## 12. Accessibility and responsive behaviour

The application targets WCAG 2.2 AA:

- Semantic headings, fieldsets, legends, labels, tables, and status regions.
- Complete keyboard operation and visible focus.
- No hover-only information.
- Status communicated by text and icon as well as colour.
- Minimum 44 by 44 pixel interactive targets.
- High contrast in light and dark system themes.
- Error summary linked to invalid fields.
- aria-live polite for extraction progress and calculation updates.
- Reduced-motion support; animations are decorative and nonessential.
- A linear table representation of every computation at all breakpoints.

On narrow screens, anchors and rows stack vertically without horizontal page scrolling. Long statutory excerpts wrap, and the prompt inspector uses an internally scrollable preformatted region with a copy control.

## 13. Testing strategy

Implementation follows test-driven development.

Unit tests cover:

- Date-only parsing and rejection.
- Calendar-day and calendar-month arithmetic.
- Leap years and month ends.
- First-day exclusion and next-day derivation.
- Later-of-two-anchor selection.
- Propagation of UNBOUND through dependent steps.
- NI Act 30-day, 15-day, next-day, and one-calendar-month rows.
- Dispatch never binding the receipt anchor.
- RBI 30-day, later-of, and 90-day rows.
- Pre-commencement RBI coverage limit.
- Pure before, on, and after comparisons.

Guard tests cover:

- Exact and normalized quote resolution.
- Duplicate quote ambiguity.
- Rejected invented quotes.
- Closed event enums.
- Zero-date and multiple-date spans.
- The invariant that no candidate binds without explicit confirmation.
- The invariant that rendered statutory text and citations come only from local rule packs.

API tests cover validation, missing configuration, timeouts, malformed model JSON, rejected candidates, safe errors, origin enforcement, and body limits with the Gemini client injected as a test double.

Component tests cover keyboard binding, UNBOUND presentation, error summaries, prompt inspector disclosure, and source badges.

Playwright tests cover:

1. Manual cheque workflow with missing receipt evidence, followed by binding the receipt date and observing client-side recomputation.
2. RBI workflow with two anchors and deterministic later-of selection.
3. Optional extraction with a mocked structured response and explicit user confirmation.
4. Manual recovery after extraction failure.
5. Mobile viewport and keyboard-only completion.

Automated accessibility checks run on the empty state, UNBOUND state, completed ledger, and error state.

## 14. Planned module boundaries

The implementation will use these focused areas:

- src/domain/clock for date types, operations, evaluation, and comparisons.
- src/domain/rule-packs for the two reviewed rule definitions and snapshots.
- src/features/evidence for manual entry, extraction candidates, and binding.
- src/features/ledger for computation rows and abstention states.
- src/features/provenance for source status and citations.
- src/features/prompt-inspector for inspectable AI requests and guarded responses.
- src/ai for the Gemini port, prompt version, schemas, and post-model guard.
- src/app/api for thin HTTP adapters.
- tests mirroring the production boundaries.

The domain layer has no React, network, SDK, or environment dependencies. The AI and source clients are injected behind interfaces so tests never call external services.

## 15. Deployment and evaluation operations

The production target is Vercel using the clean project domain. Gemini is the declared Google service. Google Antigravity will be used for a real, documented implementation slice and credited in the README and submission because the standing PromptWars page describes it as required, even though the event-specific record does not.

Deployment checks:

- Node.js 22 and pnpm 11 are pinned.
- GEMINI_API_KEY and GEMINI_MODEL are server-only environment variables.
- Function duration accommodates the model timeout, while manual mode never waits on the server.
- Deployment Protection is disabled from 26 through 28 September.
- The clean production domain is checked from a signed-out, cookieless client.
- The live application, health endpoint, Gemini path, manual path, and both source fallbacks are checked on the morning of 27 September.
- GitHub's reported repository size remains comfortably below 10,240 KB.

Before relying on the event deadline, Rahul must confirm that vision.hack2skill.com exposes an editable submission form for this invite. Registration closed on 13 September; an invitation alone does not prove registration.

## 16. Four-minute demonstration shape

The product is designed for a demonstration under 240 seconds:

1. State the extraction-versus-computation boundary.
2. Choose cheque dishonour and type the memo and dispatch dates.
3. Leave delivery receipt absent and show UNBOUND blocking the dependent rows.
4. Add a delivery date and show immediate client-side recomputation without a second model call.
5. Open one worked row and its source.
6. Open the prompt inspector to show the prompt, schema, grounded quote, and guard decision.
7. Switch to RBI, enter two short dates, and show later-of selection plus the 90-day computation.
8. Briefly show the methodology and test summary.

The recording shows both a success state and an edge state, two dynamic inputs, the prompt and response, and the explicit GenAI integration without relying on long document entry or live-source latency.

## 17. Final acceptance criteria

- No date appears in a ledger unless it originates from a manual user value, deterministic parsing of a verified user quote, or deterministic clock output.
- No extracted event is selected automatically.
- Removing a required confirmed anchor makes every dependent row UNBOUND.
- Adding the missing anchor recomputes locally without Gemini.
- Dispatch date cannot satisfy the drawer-receipt anchor.
- Every row includes a provision and source snapshot reference.
- Live-source failure never prevents manual calculation.
- Source changes never mutate rules silently.
- Gemini failure never prevents manual calculation.
- No model output can supply statutory text, citations, arithmetic, or recommendations.
- User text is not persisted or logged.
- The app has no claim, feature, or control that files legal documents or recommends an advocate.
- Automated tests and accessibility checks pass before deployment.
