// @vitest-environment node

import { hashSourceExcerpts, normaliseSourceText } from './normalise';

test('normalises transport formatting without changing legal words', () => {
  expect(normaliseSourceText('  Clause\r\nA\u00a0\u00a0thirty   days  ')).toBe(
    'Clause A thirty days',
  );
});

test('produces the standard SHA-256 digest for a known value', () => {
  expect(hashSourceExcerpts(['abc'])).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});
