# ProofClock GenAI Architecture

## Service and call site

ProofClock uses the official `@google/genai` JavaScript SDK version 2.23.0. `src/ai/gemini-client.ts` calls the current Interactions API:

- `client.interactions.create`
- `system_instruction`
- `response_format` with `type: text`, `mime_type: application/json`, and a JSON Schema
- `generation_config.thinking_level: low`
- `store: false`

The API key exists only in the server environment. Browser code calls the same-origin `/api/extract-events` route.

## Model input

The route accepts:

~~~json
{
  "rulePackId": "ni-act-138",
  "text": "Memo received 18 Jul 2026."
}
~~~

`text` is limited to 5,000 Unicode characters. It is untrusted evidence, not an instruction channel. The versioned system prompt tells the model to copy exact evidence quotes, use only the selected pack's event enum, preserve source order, use `OUT_OF_SCOPE` when necessary, and never infer receipt from dispatch.

## Model output

The only permitted candidate fields are:

- `eventKind` — a closed rule-pack enum or `OUT_OF_SCOPE`.
- `evidenceQuote` — text copied from the supplied evidence.
- `occurrenceHint` — an optional zero-based selector when the same quote repeats.

The schema has no field for a computed date, statute, section, citation, legal conclusion, recommendation, confidence score, or explanation.

## Deterministic post-model guard

`src/ai/guard.ts` prevents model output from binding directly:

1. Zod validates the response structure.
2. Event kinds outside the selected pack are rejected.
3. Exact quote resolution runs first; conservative Unicode quote and whitespace normalization runs second.
4. Missing or multiply ambiguous quotes are rejected.
5. A deterministic parser recognizes only ISO, Indian numeric, and English day-month-year date forms.
6. Zero-date, invalid-date, and multiple-date spans are rejected.
7. Pack-specific evidence requirements reject dispatch-only text labeled as receipt.
8. The browser receives `requiresConfirmation: true`; only a user action creates a binding.

The UI renders the original source slice and the deterministic normalization. It never renders a date taken from model-authored prose.

## Arithmetic boundary

Gemini is absent from `src/domain/`. The rule engine receives confirmed `YYYY-MM-DD` values and returns ordered rows with one of four states:

- `BOUND`
- `UNBOUND`
- `INVALID_INPUT`
- `COVERAGE_LIMIT`

All arithmetic uses `Temporal.PlainDate`. Calendar months are not converted to 30 days, and deployment timezone cannot shift a value.

## Request security and failure behavior

The extraction route provides:

- Production Origin/Host validation.
- JSON-only POST input.
- Closed rule-pack validation.
- A 10-request burst per 10-minute per-instance token bucket using a SHA-256 forwarding-address digest.
- A 12-second abort deadline.
- `Cache-Control: no-store`.
- No request-body or model-response logging.

Typed failures always preserve manual operation:

| Code | User recovery |
|---|---|
| `INVALID_INPUT` | Correct the selected pack or shorten evidence. |
| `INVALID_ORIGIN` | Use the ProofClock application origin. |
| `RATE_LIMITED` | Enter dates manually. |
| `EXTRACTION_UNAVAILABLE` | Enter dates manually. |
| `EXTRACTION_TIMEOUT` | Enter dates manually. |
| `MODEL_RESPONSE_REJECTED` | Review the evidence and enter dates manually. |

## Inspectability

After an extraction, the browser exposes:

- Prompt version.
- Model identifier.
- Thinking level.
- System instruction.
- Evidence text sent for that request.
- JSON schema.
- Raw structured response.
- Accepted candidates.
- Rejected candidates and guard reasons.

This surface satisfies the event's requirement to show the prompt and response while making the structural safety boundary falsifiable.
