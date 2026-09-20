import { randomUUID } from 'node:crypto';

import {
  extractEvents,
  extractionInputSchema,
  ExtractionServiceError,
  type ExtractionInput,
  type ExtractionTrace,
} from '@/ai/extract-service';
import { createGeminiPort } from '@/ai/gemini-client';
import {
  digestForwardedAddress,
  validateRequestOrigin,
} from '@/server/request-security';
import { createTokenBucket } from '@/server/token-bucket';

type RouteErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_ORIGIN'
  | 'RATE_LIMITED'
  | 'EXTRACTION_UNAVAILABLE'
  | 'EXTRACTION_TIMEOUT'
  | 'MODEL_RESPONSE_REJECTED';

export type ExtractRouteDependencies = Readonly<{
  configured: boolean;
  isProduction: boolean;
  limiter: Readonly<{ consume(key: string): boolean }>;
  extract(input: ExtractionInput, signal: AbortSignal): Promise<ExtractionTrace>;
  createRequestId(): string;
  now(): number;
  log(entry: Readonly<{ requestId: string; outcome: string; durationMs: number }>): void;
}>;

const MESSAGES: Readonly<Record<RouteErrorCode, string>> = {
  INVALID_INPUT: 'Check the selected clock and keep evidence text within 5,000 characters.',
  INVALID_ORIGIN: 'This extraction request did not originate from ProofClock.',
  RATE_LIMITED: 'Extraction is temporarily rate-limited. Manual date entry remains available.',
  EXTRACTION_UNAVAILABLE: 'Gemini extraction is unavailable. Continue with manual date entry.',
  EXTRACTION_TIMEOUT: 'Gemini extraction took too long. Continue with manual date entry.',
  MODEL_RESPONSE_REJECTED: 'The model response did not pass ProofClock guards. Use manual entry.',
};

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function failure(requestId: string, code: RouteErrorCode, status: number): Response {
  return json(
    {
      ok: false,
      requestId,
      error: { code, message: MESSAGES[code] },
    },
    status,
  );
}

function statusFor(code: RouteErrorCode): number {
  if (code === 'INVALID_INPUT') return 400;
  if (code === 'INVALID_ORIGIN') return 403;
  if (code === 'RATE_LIMITED') return 429;
  if (code === 'EXTRACTION_TIMEOUT') return 504;
  if (code === 'MODEL_RESPONSE_REJECTED') return 502;
  return 503;
}

export function createExtractEventsHandler(dependencies: ExtractRouteDependencies) {
  return async function handle(request: Request): Promise<Response> {
    const requestId = dependencies.createRequestId();
    const startedAt = dependencies.now();
    const complete = (outcome: string): void => {
      dependencies.log({
        requestId,
        outcome,
        durationMs: Math.max(0, dependencies.now() - startedAt),
      });
    };

    const origin = validateRequestOrigin(request, dependencies.isProduction);
    if (!origin.ok) {
      complete(origin.code);
      return failure(requestId, origin.code, statusFor(origin.code));
    }
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      complete('INVALID_INPUT');
      return failure(requestId, 'INVALID_INPUT', 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      complete('INVALID_INPUT');
      return failure(requestId, 'INVALID_INPUT', 400);
    }
    const parsed = extractionInputSchema.safeParse(body);
    if (!parsed.success) {
      complete('INVALID_INPUT');
      return failure(requestId, 'INVALID_INPUT', 400);
    }
    if (!dependencies.configured) {
      complete('EXTRACTION_UNAVAILABLE');
      return failure(requestId, 'EXTRACTION_UNAVAILABLE', 503);
    }

    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const key = await digestForwardedAddress(forwarded || 'unknown');
    if (!dependencies.limiter.consume(key)) {
      complete('RATE_LIMITED');
      return failure(requestId, 'RATE_LIMITED', 429);
    }

    try {
      const trace = await dependencies.extract(parsed.data, AbortSignal.timeout(12_000));
      complete('SUCCESS');
      return json({ ok: true, requestId, trace }, 200);
    } catch (error) {
      const code: RouteErrorCode =
        error instanceof ExtractionServiceError
          ? error.code
          : 'EXTRACTION_UNAVAILABLE';
      complete(code);
      return failure(requestId, code, statusFor(code));
    }
  };
}

const limiter = createTokenBucket({
  capacity: 10,
  refillWindowMs: 10 * 60 * 1_000,
  maxEntries: 1_000,
  now: Date.now,
});

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const gemini = apiKey ? createGeminiPort(apiKey) : undefined;
  return createExtractEventsHandler({
    configured: Boolean(gemini),
    isProduction: process.env.NODE_ENV === 'production',
    limiter,
    extract: async (input, signal) => {
      if (!gemini) throw new ExtractionServiceError('EXTRACTION_UNAVAILABLE');
      return extractEvents(input, { gemini, model, signal });
    },
    createRequestId: randomUUID,
    now: Date.now,
    log: (entry) => console.info('proofclock.extract', entry),
  })(request);
}
