import { parseIsoDate } from '@/domain/clock/plain-date';
import type { IsoDate } from '@/domain/clock/types';

type DateMatch = Readonly<{
  value: IsoDate | undefined;
  sourceText: string;
  range: Readonly<{ start: number; end: number }>;
}>;

export type DateTokenResult =
  | Readonly<{
      state: 'parsed';
      value: IsoDate;
      sourceText: string;
      range: Readonly<{ start: number; end: number }>;
    }>
  | Readonly<{ state: 'none' }>
  | Readonly<{ state: 'invalid'; sourceText: string }>
  | Readonly<{ state: 'ambiguous'; matches: readonly DateMatch[] }>;

const MONTHS: Readonly<Record<string, number>> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function iso(year: number, month: number, day: number): IsoDate | undefined {
  const candidate = [
    year.toString().padStart(4, '0'),
    month.toString().padStart(2, '0'),
    day.toString().padStart(2, '0'),
  ].join('-');
  const parsed = parseIsoDate(candidate);
  return parsed.ok ? parsed.value : undefined;
}

function collectMatches(quote: string): DateMatch[] {
  const matches: DateMatch[] = [];
  const patterns: ReadonlyArray<{
    regex: RegExp;
    parts: (match: RegExpExecArray) => readonly [number, number, number] | undefined;
  }> = [
    {
      regex: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
      parts: (match) => [Number(match[1]), Number(match[2]), Number(match[3])],
    },
    {
      regex: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
      parts: (match) => [Number(match[3]), Number(match[2]), Number(match[1])],
    },
    {
      regex:
        /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/gi,
      parts: (match) => {
        const monthName = match[2]?.toLowerCase();
        const month = monthName ? MONTHS[monthName] : undefined;
        if (month === undefined) return undefined;
        return [Number(match[3]), month, Number(match[1])];
      },
    },
  ];

  for (const pattern of patterns) {
    for (const match of quote.matchAll(pattern.regex)) {
      const sourceText = match[0];
      const start = match.index;
      const parts = pattern.parts(match);
      if (start === undefined || parts === undefined) continue;
      matches.push({
        value: iso(parts[0], parts[1], parts[2]),
        sourceText,
        range: { start, end: start + sourceText.length },
      });
    }
  }
  return matches.sort((left, right) => left.range.start - right.range.start);
}

export function parseSingleDateToken(quote: string): DateTokenResult {
  const matches = collectMatches(quote);
  if (matches.length === 0) return { state: 'none' };
  if (matches.length > 1) return { state: 'ambiguous', matches };
  const match = matches[0];
  if (!match) return { state: 'none' };
  if (!match.value) return { state: 'invalid', sourceText: match.sourceText };
  return {
    state: 'parsed',
    value: match.value,
    sourceText: match.sourceText,
    range: match.range,
  };
}
