import { z } from 'zod';

import type { IsoDate } from '@/domain/clock/types';

export const rawCandidateSchema = z
  .object({
    eventKind: z.string().min(1),
    evidenceQuote: z.string().min(1),
    occurrenceHint: z.number().int().nonnegative().optional(),
  })
  .strict();

export const rawExtractionResponseSchema = z
  .object({
    candidates: z.array(rawCandidateSchema).max(24),
  })
  .strict();

export type RawCandidate = z.infer<typeof rawCandidateSchema>;
export type RawExtractionResponse = z.infer<typeof rawExtractionResponseSchema>;

export type SourceRange = Readonly<{ start: number; end: number }>;

export type BindableCandidate = Readonly<{
  eventKind: string;
  evidenceQuote: string;
  range: SourceRange;
  normalizedDate: IsoDate;
  dateSourceText: string;
  bindable: true;
  requiresConfirmation: true;
}>;

export type OutOfScopeCandidate = Readonly<{
  eventKind: 'OUT_OF_SCOPE';
  evidenceQuote: string;
  range: SourceRange;
  bindable: false;
  requiresConfirmation: false;
}>;

export type GuardedCandidate = BindableCandidate | OutOfScopeCandidate;

export type CandidateRejectionReason =
  | 'UNKNOWN_EVENT_KIND'
  | 'QUOTE_NOT_FOUND'
  | 'QUOTE_AMBIGUOUS'
  | 'NO_DATE'
  | 'INVALID_DATE'
  | 'AMBIGUOUS_DATE'
  | 'INCOMPATIBLE_EVIDENCE';

export type RejectedCandidate = Readonly<{
  candidate: RawCandidate;
  reason: CandidateRejectionReason;
}>;

export type GuardResult = Readonly<{
  accepted: readonly GuardedCandidate[];
  rejected: readonly RejectedCandidate[];
}>;

export type ExtractionPrompt = Readonly<{
  version: string;
  systemInstruction: string;
  userInput: string;
  allowedEventKinds: readonly string[];
  responseJsonSchema: Readonly<Record<string, unknown>>;
}>;
