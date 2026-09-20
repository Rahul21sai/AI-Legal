import {
  applyClockOperation,
  ClockInputError,
  compareIsoDates,
  parseIsoDate,
} from './plain-date';

describe('date-only parsing', () => {
  test('accepts a real ISO calendar date without creating a timestamp', () => {
    expect(parseIsoDate('2026-02-28')).toEqual({ ok: true, value: '2026-02-28' });
  });

  test.each(['2026-02-30', '2026-7-18', '2026-07-18T00:00:00Z', '18/07/2026', '']) (
    'rejects non-ISO or impossible input %j',
    (value) => {
      expect(parseIsoDate(value)).toEqual({ ok: false, code: 'INVALID_ISO_DATE' });
    },
  );
});

describe('date-only arithmetic', () => {
  test('adds calendar days while excluding the anchor day', () => {
    expect(
      applyClockOperation(['2026-07-18'], { kind: 'add_days', amount: 30 }),
    ).toBe('2026-08-17');
  });

  test('uses calendar-month arithmetic instead of converting a month to days', () => {
    expect(
      applyClockOperation(['2026-01-31'], { kind: 'add_months', amount: 1 }),
    ).toBe('2026-02-28');
  });

  test('keeps leap-day arithmetic in the date-only calendar', () => {
    expect(
      applyClockOperation(['2028-02-28'], { kind: 'add_days', amount: 1 }),
    ).toBe('2028-02-29');
  });

  test('derives the next calendar day across a year boundary', () => {
    expect(applyClockOperation(['2026-12-31'], { kind: 'next_day' })).toBe(
      '2027-01-01',
    );
  });

  test('copies a date without altering it', () => {
    expect(applyClockOperation(['2026-07-18'], { kind: 'copy' })).toBe(
      '2026-07-18',
    );
  });

  test('selects the later confirmed anchor regardless of input order', () => {
    expect(
      applyClockOperation(['2026-08-10', '2026-07-31'], { kind: 'later_of' }),
    ).toBe('2026-08-10');
  });

  test('returns the same value when later-of inputs are equal', () => {
    expect(
      applyClockOperation(['2026-08-10', '2026-08-10'], { kind: 'later_of' }),
    ).toBe('2026-08-10');
  });

  test('rejects negative operation amounts', () => {
    expect(() =>
      applyClockOperation(['2026-07-18'], { kind: 'add_days', amount: -1 }),
    ).toThrowError(new ClockInputError('NEGATIVE_AMOUNT'));
  });

  test('rejects fractional amounts instead of rounding a legal period', () => {
    expect(() =>
      applyClockOperation(['2026-07-18'], { kind: 'add_days', amount: 1.5 }),
    ).toThrowError(new ClockInputError('NON_INTEGER_AMOUNT'));
  });

  test.each([
    { inputs: [] as string[], operation: { kind: 'copy' as const } },
    {
      inputs: ['2026-07-18', '2026-07-19'],
      operation: { kind: 'next_day' as const },
    },
    { inputs: [] as string[], operation: { kind: 'later_of' as const } },
  ])('rejects wrong input arity for $operation.kind', ({ inputs, operation }) => {
    expect(() => applyClockOperation(inputs, operation)).toThrow(ClockInputError);
  });
});

describe('date-only comparison', () => {
  test.each([
    ['2026-07-18', '2026-07-19', -1],
    ['2026-07-19', '2026-07-19', 0],
    ['2026-07-20', '2026-07-19', 1],
  ] as const)('compares %s with %s as %i', (left, right, expected) => {
    expect(compareIsoDates(left, right)).toBe(expected);
  });
});
