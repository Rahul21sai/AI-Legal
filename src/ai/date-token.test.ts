// @vitest-environment node

import { parseSingleDateToken } from './date-token';

describe('deterministic date-token parsing', () => {
  test.each([
    ['Memo received on 18 Jul 2026.', '2026-07-18', '18 Jul 2026'],
    ['Memo received on 18 July 2026.', '2026-07-18', '18 July 2026'],
    ['Memo received on 18/07/2026.', '2026-07-18', '18/07/2026'],
    ['Memo received on 2026-07-18.', '2026-07-18', '2026-07-18'],
  ])('parses %s as an Indian date-only value', (quote, value, sourceText) => {
    expect(parseSingleDateToken(quote)).toMatchObject({
      state: 'parsed',
      value,
      sourceText,
    });
  });

  test('does not silently reinterpret an impossible date', () => {
    expect(parseSingleDateToken('Memo dated 31/02/2026.')).toMatchObject({
      state: 'invalid',
      sourceText: '31/02/2026',
    });
  });

  test('requires review when one quote contains two dates', () => {
    expect(
      parseSingleDateToken('Sent 2 Aug 2026 and delivered 5 Aug 2026.'),
    ).toMatchObject({ state: 'ambiguous' });
  });

  test('returns none when the grounded quote contains no date token', () => {
    expect(parseSingleDateToken('The memo arrived yesterday.')).toEqual({
      state: 'none',
    });
  });
});
