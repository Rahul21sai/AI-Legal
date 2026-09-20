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

const sourceRangeSchema = z
  .object({ start: z.number().int().nonnegative(), end: z.number().int().positive() })
  .strict();

const bindableCandidateSchema = z
  .object({
    eventKind: z.string().min(1),
    evidenceQuote: z.string().min(1),
    range: sourceRangeSchema,
    normalizedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateSourceText: z.string().min(1),
    bindable: z.literal(true),
    requiresConfirmation: z.literal(true),
  })
  .strict();

const outOfScopeCandidateSchema = z
  .object({
    eventKind: z.literal('OUT_OF_SCOPE'),
    evidenceQuote: z.string().min(1),
    range: sourceRangeSchema,
    bindable: z.literal(false),
    requiresConfirmation: z.literal(false),
  })
  .strict();

const rejectionReasonSchema = z.enum([
  'UNKNOWN_EVENT_KIND',
  'QUOTE_NOT_FOUND',
  'QUOTE_AMBIGUOUS',
  'NO_DATE',
  'INVALID_DATE',
  'AMBIGUOUS_DATE',
  'INCOMPATIBLE_EVIDENCE',
]);

export const extractionTraceSchema = z
  .object({
    prompt: z
      .object({
        version: z.string().min(1),
        model: z.string().min(1),
        thinkingLevel: z.literal('low'),
        systemInstruction: z.string().min(1),
        userInput: z.string(),
        responseJsonSchema: z.record(z.string(), z.unknown()),
      })
      .strict(),
    rawResponse: rawExtractionResponseSchema,
    accepted: z.array(z.union([bindableCandidateSchema, outOfScopeCandidateSchema])),
    rejected: z.array(
      z
        .object({ candidate: rawCandidateSchema, reason: rejectionReasonSchema })
        .strict(),
    ),
  })
  .strict();
