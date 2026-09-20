// @vitest-environment node

import {
  createExtractEventsHandler,
  type ExtractRouteDependencies,
} from './route';
import type { ExtractionTrace } from '@/ai/extract-service';
import { ExtractionServiceError } from '@/ai/extract-service';

const successTrace: ExtractionTrace = {
  prompt: {
    version: 'extract-events.v1',
    model: 'gemini-3.8-flash',
    thinkingLevel: 'low',
    systemInstruction: 'Boundary',
    userInput: 'Memo received 18 Jul 2026.',
    responseJsonSchema: { type: 'object' },
  },
  rawResponse: { candidates: [] },
  accepted: [],
  rejected: [],
};

function dependencies(
  overrides: Partial<ExtractRouteDependencies> = {},
): ExtractRouteDependencies {
  return {
    configured: true,
    isProduction: true,
    limiter: { consume: () => true },
    extract: async () => successTrace,
    createRequestId: () => 'request-123',
    now: () => 100,
    log: () => undefined,
    ...overrides,
  };
}

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://proofclock.test/api/extract-events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://proofclock.test',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test('returns a safe no-store success envelope', async () => {
  const handler = createExtractEventsHandler(dependencies());
  const response = await handler(
    request({ rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  await expect(response.json()).resolves.toMatchObject({
    ok: true,
    requestId: 'request-123',
    trace: successTrace,
  });
});

test.each([
  {
    name: 'wrong content type',
    make: () =>
      request(
        { rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' },
        { 'content-type': 'text/plain' },
      ),
  },
  {
    name: 'unknown pack',
    make: () => request({ rulePackId: 'unknown', text: 'Memo received 18 Jul 2026.' }),
  },
  {
    name: 'oversized text',
    make: () => request({ rulePackId: 'ni-act-138', text: 'a'.repeat(5_001) }),
  },
])('returns INVALID_INPUT for $name', async ({ make }) => {
  const response = await createExtractEventsHandler(dependencies())(make());
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    ok: false,
    error: { code: 'INVALID_INPUT' },
  });
});

test('rejects a production cross-origin request before extraction', async () => {
  let called = false;
  const handler = createExtractEventsHandler(
    dependencies({
      extract: async () => {
        called = true;
        return successTrace;
      },
    }),
  );
  const response = await handler(
    request(
      { rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' },
      { origin: 'https://attacker.test' },
    ),
  );

  expect(response.status).toBe(403);
  expect(called).toBe(false);
});

test('returns a manual-mode recovery when Gemini is not configured', async () => {
  const response = await createExtractEventsHandler(
    dependencies({ configured: false }),
  )(request({ rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' }));

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({
    error: { code: 'EXTRACTION_UNAVAILABLE' },
  });
});

test('rate limits without invoking extraction', async () => {
  let called = false;
  const response = await createExtractEventsHandler(
    dependencies({
      limiter: { consume: () => false },
      extract: async () => {
        called = true;
        return successTrace;
      },
    }),
  )(request({ rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' }));

  expect(response.status).toBe(429);
  expect(called).toBe(false);
});

test.each([
  ['EXTRACTION_TIMEOUT', 504],
  ['MODEL_RESPONSE_REJECTED', 502],
] as const)('maps %s to its safe HTTP status', async (code, status) => {
  const response = await createExtractEventsHandler(
    dependencies({
      extract: async () => {
        throw new ExtractionServiceError(code);
      },
    }),
  )(request({ rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' }));

  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toMatchObject({
    ok: false,
    error: { code },
  });
});

test('logs outcome metadata without logging submitted text', async () => {
  const logs: unknown[] = [];
  const privateText = 'Private memo received 18 Jul 2026.';
  const response = await createExtractEventsHandler(
    dependencies({ log: (entry) => logs.push(entry), now: () => 140 }),
  )(request({ rulePackId: 'ni-act-138', text: privateText }));

  expect(response.status).toBe(200);
  expect(JSON.stringify(logs)).not.toContain(privateText);
  expect(logs).toEqual([
    { requestId: 'request-123', outcome: 'SUCCESS', durationMs: 0 },
  ]);
});
