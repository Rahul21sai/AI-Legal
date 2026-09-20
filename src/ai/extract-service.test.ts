// @vitest-environment node

import {
  extractEvents,
  ExtractionServiceError,
  type GeminiPort,
} from './extract-service';

test('returns a guarded trace from a structurally valid model response', async () => {
  let capturedModel = '';
  let capturedThinking = '';
  const fake: GeminiPort = {
    async createStructuredInteraction(request) {
      capturedModel = request.model;
      capturedThinking = request.thinkingLevel;
      return {
        candidates: [
          {
            eventKind: 'bank_information_received',
            evidenceQuote: 'Memo received 18 Jul 2026.',
          },
        ],
      };
    },
  };

  const trace = await extractEvents(
    {
      rulePackId: 'ni-act-138',
      text: 'Memo received 18 Jul 2026.',
    },
    { gemini: fake, model: 'gemini-3.8-flash' },
  );

  expect(trace.accepted[0]).toMatchObject({
    normalizedDate: '2026-07-18',
    requiresConfirmation: true,
  });
  expect(trace.prompt).toMatchObject({
    version: 'extract-events.v1',
    model: 'gemini-3.8-flash',
    thinkingLevel: 'low',
  });
  expect(capturedModel).toBe('gemini-3.8-flash');
  expect(capturedThinking).toBe('low');
});

test('rejects schema-compliant JSON of the wrong semantic shape', async () => {
  const fake: GeminiPort = {
    async createStructuredInteraction() {
      return { candidates: 'not-an-array' };
    },
  };

  await expect(
    extractEvents(
      { rulePackId: 'ni-act-138', text: 'Memo received 18 Jul 2026.' },
      { gemini: fake, model: 'gemini-3.8-flash' },
    ),
  ).rejects.toEqual(
    expect.objectContaining<Partial<ExtractionServiceError>>({
      code: 'MODEL_RESPONSE_REJECTED',
    }),
  );
});

test('maps an aborted interaction to a typed timeout without echoing input', async () => {
  const fake: GeminiPort = {
    async createStructuredInteraction() {
      throw new DOMException('The operation was aborted', 'AbortError');
    },
  };
  const input = 'Private memo received 18 Jul 2026.';

  let error: unknown;
  try {
    await extractEvents(
      { rulePackId: 'ni-act-138', text: input },
      { gemini: fake, model: 'gemini-3.8-flash' },
    );
  } catch (caught) {
    error = caught;
  }

  expect(error).toEqual(
    expect.objectContaining<Partial<ExtractionServiceError>>({
      code: 'EXTRACTION_TIMEOUT',
    }),
  );
  expect(String(error)).not.toContain(input);
});
