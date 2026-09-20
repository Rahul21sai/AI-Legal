// @vitest-environment node

import { guardCandidates } from './guard';
import { niAct138 } from '@/domain/rule-packs/ni-act-138';

describe('grounded extraction guard', () => {
  test('accepts an exact quote and preserves its original range', () => {
    const text = 'The return memo was received on 18 Jul 2026.';
    const result = guardCandidates(
      text,
      [
        {
          eventKind: 'bank_information_received',
          evidenceQuote: 'The return memo was received on 18 Jul 2026.',
        },
      ],
      niAct138,
    );

    expect(result.accepted[0]).toMatchObject({
      eventKind: 'bank_information_received',
      evidenceQuote: text,
      normalizedDate: '2026-07-18',
      range: { start: 0, end: text.length },
      bindable: true,
      requiresConfirmation: true,
    });
    expect(result.rejected).toEqual([]);
  });

  test('rejects a quote the user did not supply', () => {
    const result = guardCandidates(
      'The memo arrived yesterday.',
      [
        {
          eventKind: 'bank_information_received',
          evidenceQuote: 'The memo arrived on 18 Jul 2026.',
        },
      ],
      niAct138,
    );

    expect(result.rejected[0]).toMatchObject({ reason: 'QUOTE_NOT_FOUND' });
  });

  test('resolves conservative quote and whitespace normalization to original text', () => {
    const text = 'Tracking says “delivered”\u00a0on 5 Aug 2026.';
    const result = guardCandidates(
      text,
      [
        {
          eventKind: 'demand_notice_received_by_drawer',
          evidenceQuote: 'Tracking says "delivered" on 5 Aug 2026.',
        },
      ],
      niAct138,
    );

    expect(result.accepted[0]).toMatchObject({
      evidenceQuote: text,
      normalizedDate: '2026-08-05',
      range: { start: 0, end: text.length },
    });
  });

  test('rejects an ambiguous repeated quote without an occurrence hint', () => {
    const quote = 'Memo received on 18 Jul 2026.';
    const result = guardCandidates(
      `${quote} Later note: ${quote}`,
      [{ eventKind: 'bank_information_received', evidenceQuote: quote }],
      niAct138,
    );

    expect(result.rejected[0]).toMatchObject({ reason: 'QUOTE_AMBIGUOUS' });
  });

  test('uses a valid zero-based occurrence hint for repeated evidence', () => {
    const quote = 'Memo received on 18 Jul 2026.';
    const text = `${quote} Later note: ${quote}`;
    const result = guardCandidates(
      text,
      [
        {
          eventKind: 'bank_information_received',
          evidenceQuote: quote,
          occurrenceHint: 1,
        },
      ],
      niAct138,
    );

    expect(result.accepted[0]?.range.start).toBe(text.lastIndexOf(quote));
  });

  test('rejects event kinds outside the selected rule pack', () => {
    const result = guardCandidates(
      'Court order dated 18 Jul 2026.',
      [{ eventKind: 'court_order_date', evidenceQuote: 'Court order dated 18 Jul 2026.' }],
      niAct138,
    );

    expect(result.rejected[0]).toMatchObject({ reason: 'UNKNOWN_EVENT_KIND' });
  });

  test('retains out-of-scope evidence without offering a binding action', () => {
    const text = 'A phone call happened yesterday.';
    const result = guardCandidates(
      text,
      [{ eventKind: 'OUT_OF_SCOPE', evidenceQuote: text }],
      niAct138,
    );

    expect(result.accepted[0]).toMatchObject({
      eventKind: 'OUT_OF_SCOPE',
      bindable: false,
      requiresConfirmation: false,
    });
  });

  test('rejects a bindable quote with no deterministic date', () => {
    const text = 'The return memo arrived yesterday.';
    const result = guardCandidates(
      text,
      [{ eventKind: 'bank_information_received', evidenceQuote: text }],
      niAct138,
    );

    expect(result.rejected[0]).toMatchObject({ reason: 'NO_DATE' });
  });

  test('rejects dispatch-only evidence mislabeled as receipt', () => {
    const text = 'The notice was dispatched on 2 Aug 2026.';
    const result = guardCandidates(
      text,
      [{ eventKind: 'demand_notice_received_by_drawer', evidenceQuote: text }],
      niAct138,
    );

    expect(result.rejected[0]).toMatchObject({ reason: 'INCOMPATIBLE_EVIDENCE' });
  });
});
