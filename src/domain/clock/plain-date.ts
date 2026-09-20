import { Temporal } from '@js-temporal/polyfill';

import type {
  ClockInputErrorCode,
  ClockOperation,
  IsoDate,
  PlainDateResult,
} from './types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ClockInputError extends Error {
  readonly code: ClockInputErrorCode;

  constructor(code: ClockInputErrorCode) {
    super(code);
    this.name = 'ClockInputError';
    this.code = code;
  }
}

export function parseIsoDate(value: string): PlainDateResult {
  if (!ISO_DATE_PATTERN.test(value)) {
    return { ok: false, code: 'INVALID_ISO_DATE' };
  }

  try {
    const parsed = Temporal.PlainDate.from(value, { overflow: 'reject' });
    return { ok: true, value: parsed.toString() };
  } catch {
    return { ok: false, code: 'INVALID_ISO_DATE' };
  }
}

function requirePlainDate(value: string): Temporal.PlainDate {
  const parsed = parseIsoDate(value);
  if (!parsed.ok) {
    throw new ClockInputError(parsed.code);
  }
  return Temporal.PlainDate.from(parsed.value);
}

function requireSingleInput(inputs: readonly string[]): Temporal.PlainDate {
  if (inputs.length !== 1) {
    throw new ClockInputError('WRONG_INPUT_COUNT');
  }
  const input = inputs[0];
  if (input === undefined) {
    throw new ClockInputError('WRONG_INPUT_COUNT');
  }
  return requirePlainDate(input);
}

function requireAmount(amount: number): void {
  if (!Number.isInteger(amount)) {
    throw new ClockInputError('NON_INTEGER_AMOUNT');
  }
  if (amount < 0) {
    throw new ClockInputError('NEGATIVE_AMOUNT');
  }
}

export function applyClockOperation(
  inputs: readonly string[],
  operation: ClockOperation,
): IsoDate {
  switch (operation.kind) {
    case 'add_days': {
      requireAmount(operation.amount);
      return requireSingleInput(inputs).add({ days: operation.amount }).toString();
    }
    case 'add_months': {
      requireAmount(operation.amount);
      return requireSingleInput(inputs)
        .add({ months: operation.amount }, { overflow: 'constrain' })
        .toString();
    }
    case 'next_day':
      return requireSingleInput(inputs).add({ days: 1 }).toString();
    case 'copy':
      return requireSingleInput(inputs).toString();
    case 'later_of': {
      if (inputs.length === 0) {
        throw new ClockInputError('WRONG_INPUT_COUNT');
      }
      const parsed = inputs.map(requirePlainDate);
      return parsed
        .reduce((later, candidate) =>
          Temporal.PlainDate.compare(candidate, later) > 0 ? candidate : later,
        )
        .toString();
    }
    case 'first_available': {
      if (inputs.length === 0) {
        throw new ClockInputError('WRONG_INPUT_COUNT');
      }
      const first = inputs[0];
      if (first === undefined) {
        throw new ClockInputError('WRONG_INPUT_COUNT');
      }
      return requirePlainDate(first).toString();
    }
  }
}

export function compareIsoDates(left: IsoDate, right: IsoDate): -1 | 0 | 1 {
  const comparison = Temporal.PlainDate.compare(
    requirePlainDate(left),
    requirePlainDate(right),
  );
  if (comparison < 0) return -1;
  if (comparison > 0) return 1;
  return 0;
}
