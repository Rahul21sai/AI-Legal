// @vitest-environment node

import type { SourceSnapshot } from './contracts';
import { verifySource } from './verify-source';

const snapshot: SourceSnapshot = {
  id: 'test-source',
  instrumentTitle: 'Test instrument',
  provision: 'Clauses A and B',
  excerpts: ['Clause A 30 days', 'Clause B 90 days'],
  sourceUrl: 'https://source.test/rule',
  sourceFormat: 'html',
  publisher: 'Test publisher',
  authority: 'official',
  retrievedAt: '2026-09-20',
  attribution: 'Test publisher',
  authorityNote: 'Test note',
  normalizedSha256: 'b15d8a1c993665d87c16fb1ea0ba0757a5e5d37404251082d91786f7d66f2472',
};

test('matches all reviewed excerpts inside live HTML', async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response('<main><p>Clause A 30 days</p><p>Clause B 90 days</p></main>');

  await expect(
    verifySource(snapshot, fetchImpl, AbortSignal.timeout(2_000)),
  ).resolves.toMatchObject({
    state: 'MATCH',
    sourceId: 'test-source',
    liveSha256: snapshot.normalizedSha256,
  });
});

test('extracts the section text from the documented mirror JSON shape', async () => {
  const fetchImpl: typeof fetch = async () =>
    Response.json({ section: { text: 'Clause A 30 days. Clause B 90 days.' } });

  await expect(
    verifySource(
      { ...snapshot, sourceFormat: 'ecourts-section-json' },
      fetchImpl,
      AbortSignal.timeout(2_000),
    ),
  ).resolves.toMatchObject({ state: 'MATCH' });
});

test('reports changed content without returning replacement text', async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response('<main>Clause A 60 days. Clause B 90 days.</main>');

  const status = await verifySource(snapshot, fetchImpl, AbortSignal.timeout(2_000));
  expect(status).toEqual({ state: 'CHANGED', sourceId: 'test-source' });
  expect(status).not.toHaveProperty('content');
});

test('maps aborted and failed requests to typed fallback states', async () => {
  const timeoutFetch: typeof fetch = async () => {
    throw new DOMException('aborted', 'AbortError');
  };
  const failedFetch: typeof fetch = async () => new Response('unavailable', { status: 503 });

  await expect(
    verifySource(snapshot, timeoutFetch, AbortSignal.timeout(2_000)),
  ).resolves.toEqual({ state: 'TIMEOUT', sourceId: 'test-source' });
  await expect(
    verifySource(snapshot, failedFetch, AbortSignal.timeout(2_000)),
  ).resolves.toEqual({
    state: 'UNREACHABLE',
    sourceId: 'test-source',
    httpStatus: 503,
  });
});
