// @vitest-environment node

import { createTokenBucket } from './token-bucket';

test('allows the configured burst and rejects the next request', () => {
  let now = 1_000;
  const bucket = createTokenBucket({
    capacity: 2,
    refillWindowMs: 10_000,
    maxEntries: 10,
    now: () => now,
  });

  expect(bucket.consume('client')).toBe(true);
  expect(bucket.consume('client')).toBe(true);
  expect(bucket.consume('client')).toBe(false);
  now += 5_000;
  expect(bucket.consume('client')).toBe(true);
});

test('evicts the oldest client when the bounded map is full', () => {
  let now = 0;
  const bucket = createTokenBucket({
    capacity: 1,
    refillWindowMs: 10_000,
    maxEntries: 2,
    now: () => now,
  });

  bucket.consume('oldest');
  now += 1;
  bucket.consume('middle');
  now += 1;
  bucket.consume('newest');

  expect(bucket.size()).toBe(2);
  expect(bucket.consume('oldest')).toBe(true);
});
