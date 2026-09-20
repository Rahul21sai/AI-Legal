// @vitest-environment node

import { digestForwardedAddress, validateRequestOrigin } from './request-security';

test('accepts a matching production origin and forwarded host', () => {
  const request = new Request('https://internal.vercel.app/api/extract-events', {
    headers: {
      origin: 'https://proofclock.vercel.app',
      'x-forwarded-host': 'proofclock.vercel.app',
      'x-forwarded-proto': 'https',
    },
  });

  expect(validateRequestOrigin(request, true)).toEqual({ ok: true });
});

test.each([
  new Request('https://proofclock.test/api/extract-events'),
  new Request('https://proofclock.test/api/extract-events', {
    headers: { origin: 'https://attacker.test' },
  }),
])('rejects a missing or mismatched production origin', (request) => {
  expect(validateRequestOrigin(request, true)).toEqual({
    ok: false,
    code: 'INVALID_ORIGIN',
  });
});

test('allows a missing origin outside production for local API testing', () => {
  expect(
    validateRequestOrigin(
      new Request('http://localhost:3000/api/extract-events'),
      false,
    ),
  ).toEqual({ ok: true });
});

test('hashes the forwarding address without retaining the raw value', async () => {
  const digest = await digestForwardedAddress('203.0.113.42');
  expect(digest).toMatch(/^[a-f0-9]{64}$/);
  expect(digest).not.toContain('203.0.113.42');
});
