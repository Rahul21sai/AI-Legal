import { z } from 'zod';

import { rawExtractionResponseSchema } from './contracts';
import type {
  GuardedCandidate,
  RawExtractionResponse,
  RejectedCandidate,
} from './contracts';
import { GeminiClientError } from './gemini-client';
import { guardCandidates } from './guard';
import { buildExtractionPrompt } from './prompts/extract-events.v1';
import { getRulePack } from '@/domain/rule-packs/registry';

export const extractionInputSchema = z
  .object({
    rulePackId: z.enum(['ni-act-138', 'rbi-ombudsman-2026']),
    text: z.string().min(1).max(5_000),
  })
  .strict();

export type ExtractionInput = z.infer<typeof extractionInputSchema>;

export type GeminiStructuredRequest = Readonly<{
  model: string;
  systemInstruction: string;
  userInput: string;
  responseJsonSchema: Readonly<Record<string, unknown>>;
  thinkingLevel: 'low';
  signal?: AbortSignal;
}>;

export interface GeminiPort {
  createStructuredInteraction(request: GeminiStructuredRequest): Promise<unknown>;
}

export type ExtractionTrace = Readonly<{
  prompt: Readonly<{
    version: string;
    model: string;
    thinkingLevel: 'low';
    systemInstruction: string;
    userInput: string;
    responseJsonSchema: Readonly<Record<string, unknown>>;
  }>;
  rawResponse: RawExtractionResponse;
  accepted: readonly GuardedCandidate[];
  rejected: readonly RejectedCandidate[];
}>;

export type ExtractionServiceErrorCode =
  | 'EXTRACTION_TIMEOUT'
  | 'RATE_LIMITED'
  | 'MODEL_RESPONSE_REJECTED'
  | 'EXTRACTION_UNAVAILABLE';

export class ExtractionServiceError extends Error {
  readonly code: ExtractionServiceErrorCode;

  constructor(code: ExtractionServiceErrorCode) {
    super(code);
    this.name = 'ExtractionServiceError';
    this.code = code;
  }
}

function classifyExternalError(error: unknown): ExtractionServiceError {
  if (error instanceof ExtractionServiceError) return error;
  if (
    error instanceof GeminiClientError ||
    (error instanceof Error && error.message === 'MODEL_RESPONSE_REJECTED')
  ) {
    return new ExtractionServiceError('MODEL_RESPONSE_REJECTED');
  }
  if (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'RequestTimeoutError')
  ) {
    return new ExtractionServiceError('EXTRACTION_TIMEOUT');
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 429
  ) {
    return new ExtractionServiceError('RATE_LIMITED');
  }
  return new ExtractionServiceError('EXTRACTION_UNAVAILABLE');
}

export async function extractEvents(
  input: ExtractionInput,
  dependencies: Readonly<{
    gemini: GeminiPort;
    model: string;
    signal?: AbortSignal;
  }>,
): Promise<ExtractionTrace> {
  const pack = getRulePack(input.rulePackId);
  const prompt = buildExtractionPrompt(pack, input.text);
  let unknownResponse: unknown;
  try {
    unknownResponse = await dependencies.gemini.createStructuredInteraction({
      model: dependencies.model,
      systemInstruction: prompt.systemInstruction,
      userInput: prompt.userInput,
      responseJsonSchema: prompt.responseJsonSchema,
      thinkingLevel: 'low',
      ...(dependencies.signal ? { signal: dependencies.signal } : {}),
    });
  } catch (error) {
    throw classifyExternalError(error);
  }

  const parsed = rawExtractionResponseSchema.safeParse(unknownResponse);
  if (!parsed.success) {
    throw new ExtractionServiceError('MODEL_RESPONSE_REJECTED');
  }
  const guarded = guardCandidates(input.text, parsed.data.candidates, pack);
  return {
    prompt: {
      version: prompt.version,
      model: dependencies.model,
      thinkingLevel: 'low',
      systemInstruction: prompt.systemInstruction,
      userInput: prompt.userInput,
      responseJsonSchema: prompt.responseJsonSchema,
    },
    rawResponse: parsed.data,
    accepted: guarded.accepted,
    rejected: guarded.rejected,
  };
}
