// @vitest-environment node

import { createHealthHandler } from './route';

test('reports public configuration and snapshot versions without exposing secrets', async () => {
  const response = await createHealthHandler({
    version: '0.1.0',
    environment: {
      GEMINI_API_KEY: 'secret-key-must-not-leak',
      GEMINI_MODEL: 'gemini-3.8-flash',
    },
    snapshots: [
      {
        id: 'ni-act-138-b',
        retrievedAt: '2026-09-20',
        normalizedSha256: 'abc123',
      },
    ],
  })();

  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const payload = await response.json();
  expect(payload).toEqual({
    status: 'ok',
    version: '0.1.0',
    gemini: { configured: true, model: 'gemini-3.8-flash' },
    snapshots: [
      { id: 'ni-act-138-b', retrievedAt: '2026-09-20', sha256: 'abc123' },
    ],
  });
  expect(JSON.stringify(payload)).not.toContain('secret-key-must-not-leak');
});

test('reports manual-only operation when the API key is absent', async () => {
  const payload = await (
    await createHealthHandler({
      version: '0.1.0',
      environment: { GEMINI_MODEL: undefined, GEMINI_API_KEY: undefined },
      snapshots: [],
    })()
  ).json();

  expect(payload.gemini).toEqual({
    configured: false,
    model: 'gemini-3.8-flash',
  });
});
