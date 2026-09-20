// @vitest-environment node

import { formatIsoDate } from './computation-ledger';

test('formats a date-only value with the en-IN locale without timezone drift', () => {
  expect(formatIsoDate('2026-09-04')).toBe('04 Sep 2026');
});

test('leaves an invalid boundary value visible instead of inventing a date', () => {
  expect(formatIsoDate('not-a-date')).toBe('not-a-date');
  expect(formatIsoDate('2026-02-30')).toBe('2026-02-30');
});
