export type IsoDate = string;

export type ClockOperation =
  | Readonly<{ kind: 'add_days'; amount: number }>
  | Readonly<{ kind: 'add_months'; amount: number }>
  | Readonly<{ kind: 'next_day' }>
  | Readonly<{ kind: 'later_of' }>
  | Readonly<{ kind: 'first_available' }>
  | Readonly<{ kind: 'copy' }>;

export type PlainDateResult =
  | Readonly<{ ok: true; value: IsoDate }>
  | Readonly<{ ok: false; code: 'INVALID_ISO_DATE' }>;

export type ClockInputErrorCode =
  | 'INVALID_ISO_DATE'
  | 'NEGATIVE_AMOUNT'
  | 'NON_INTEGER_AMOUNT'
  | 'WRONG_INPUT_COUNT';
