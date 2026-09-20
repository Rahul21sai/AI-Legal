import { parseSingleDateToken } from './date-token';
import type {
  CandidateRejectionReason,
  GuardResult,
  RawCandidate,
  SourceRange,
} from './contracts';
import type { AnchorDefinition, RulePack } from '@/domain/rule-packs/types';

type NormalizedText = Readonly<{
  text: string;
  originalIndexes: readonly number[];
}>;

function canonicalCharacter(character: string): string {
  if (/\s/u.test(character)) return ' ';
  if (character === '“' || character === '”') return '"';
  if (character === '‘' || character === '’') return "'";
  return character;
}

function normalizeWithMap(value: string): NormalizedText {
  let text = '';
  const originalIndexes: number[] = [];
  let previousWasSpace = false;
  for (let index = 0; index < value.length; index += 1) {
    const original = value[index];
    if (original === undefined) continue;
    const canonical = canonicalCharacter(original);
    if (canonical === ' ') {
      if (previousWasSpace) continue;
      previousWasSpace = true;
    } else {
      previousWasSpace = false;
    }
    text += canonical;
    originalIndexes.push(index);
  }
  return { text, originalIndexes };
}

function allIndexes(haystack: string, needle: string): number[] {
  if (!needle) return [];
  const indexes: number[] = [];
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) break;
    indexes.push(index);
    from = index + 1;
  }
  return indexes;
}

function chooseOccurrence(
  indexes: readonly number[],
  hint: number | undefined,
): number | undefined {
  if (indexes.length === 1) return indexes[0];
  if (hint !== undefined && hint < indexes.length) return indexes[hint];
  return undefined;
}

function resolveQuote(
  input: string,
  quote: string,
  occurrenceHint: number | undefined,
):
  | { state: 'found'; range: SourceRange }
  | { state: 'missing' }
  | { state: 'ambiguous' } {
  const exact = allIndexes(input, quote);
  const exactStart = chooseOccurrence(exact, occurrenceHint);
  if (exactStart !== undefined) {
    return { state: 'found', range: { start: exactStart, end: exactStart + quote.length } };
  }
  if (exact.length > 1) return { state: 'ambiguous' };

  const normalizedInput = normalizeWithMap(input);
  const normalizedQuote = normalizeWithMap(quote).text;
  const normalizedIndexes = allIndexes(normalizedInput.text, normalizedQuote);
  const normalizedStart = chooseOccurrence(normalizedIndexes, occurrenceHint);
  if (normalizedStart === undefined) {
    return { state: normalizedIndexes.length > 1 ? 'ambiguous' : 'missing' };
  }
  const originalStart = normalizedInput.originalIndexes[normalizedStart];
  const originalLast = normalizedInput.originalIndexes[
    normalizedStart + normalizedQuote.length - 1
  ];
  if (originalStart === undefined || originalLast === undefined) return { state: 'missing' };
  return { state: 'found', range: { start: originalStart, end: originalLast + 1 } };
}

function compatible(anchor: AnchorDefinition, quote: string): boolean {
  if (!anchor.candidateGuard) return true;
  const lowered = quote.toLocaleLowerCase('en-IN');
  return anchor.candidateGuard.requiredAny.some((term) => lowered.includes(term));
}

export function guardCandidates(
  inputText: string,
  candidates: readonly RawCandidate[],
  pack: RulePack,
): GuardResult {
  const anchors = new Map(pack.anchors.map((anchor) => [anchor.eventKind, anchor]));
  const accepted: GuardResult['accepted'][number][] = [];
  const rejected: GuardResult['rejected'][number][] = [];

  const reject = (candidate: RawCandidate, reason: CandidateRejectionReason): void => {
    rejected.push({ candidate, reason });
  };

  for (const candidate of candidates) {
    const isOutOfScope = candidate.eventKind === 'OUT_OF_SCOPE';
    const anchor = anchors.get(candidate.eventKind);
    if (!isOutOfScope && !anchor) {
      reject(candidate, 'UNKNOWN_EVENT_KIND');
      continue;
    }

    const resolved = resolveQuote(
      inputText,
      candidate.evidenceQuote,
      candidate.occurrenceHint,
    );
    if (resolved.state === 'missing') {
      reject(candidate, 'QUOTE_NOT_FOUND');
      continue;
    }
    if (resolved.state === 'ambiguous') {
      reject(candidate, 'QUOTE_AMBIGUOUS');
      continue;
    }

    const evidenceQuote = inputText.slice(resolved.range.start, resolved.range.end);
    if (isOutOfScope) {
      accepted.push({
        eventKind: 'OUT_OF_SCOPE',
        evidenceQuote,
        range: resolved.range,
        bindable: false,
        requiresConfirmation: false,
      });
      continue;
    }
    if (!anchor || !compatible(anchor, evidenceQuote)) {
      reject(candidate, 'INCOMPATIBLE_EVIDENCE');
      continue;
    }

    const parsed = parseSingleDateToken(evidenceQuote);
    if (parsed.state === 'none') {
      reject(candidate, 'NO_DATE');
      continue;
    }
    if (parsed.state === 'invalid') {
      reject(candidate, 'INVALID_DATE');
      continue;
    }
    if (parsed.state === 'ambiguous') {
      reject(candidate, 'AMBIGUOUS_DATE');
      continue;
    }
    accepted.push({
      eventKind: candidate.eventKind,
      evidenceQuote,
      range: resolved.range,
      normalizedDate: parsed.value,
      dateSourceText: parsed.sourceText,
      bindable: true,
      requiresConfirmation: true,
    });
  }

  return { accepted, rejected };
}
