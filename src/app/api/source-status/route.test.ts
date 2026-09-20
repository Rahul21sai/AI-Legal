// @vitest-environment node

import { createSourceStatusHandler } from './route';
import type { SourceStatus } from '@/sources/contracts';

test('checks only a registered source id and returns cacheable status', async () => {
  const match: SourceStatus = {
    state: 'MATCH',
    sourceId: 'ni-act-138-b',
    liveSha256: 'hash',
    checkedAt: '2026-09-20T18:00:00.000Z',
  };
  const response = await createSourceStatusHandler({
    hasSource: (id) => id === 'ni-act-138-b',
    verify: async () => match,
  })(
    new Request(
      'https://proofclock.test/api/source-status?sourceId=ni-act-138-b',
    ),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe(
    'public, max-age=300, stale-while-revalidate=3600',
  );
  await expect(response.json()).resolves.toEqual(match);
});

test.each([
  'https://proofclock.test/api/source-status',
  'https://proofclock.test/api/source-status?sourceId=https://attacker.test',
])('rejects an absent or arbitrary source URL: %s', async (url) => {
  const response = await createSourceStatusHandler({
    hasSource: () => false,
    verify: async () => {
      throw new Error('must not fetch');
    },
  })(new Request(url));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    state: 'INVALID_SOURCE_ID',
  });
});
