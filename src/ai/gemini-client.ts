import { GoogleGenAI } from '@google/genai';

import type { GeminiPort, GeminiStructuredRequest } from './extract-service';

export type InteractionRequest = Readonly<{
  model: string;
  input: string;
  system_instruction: string;
  response_format: Readonly<{
    type: 'text';
    mime_type: 'application/json';
    schema: Readonly<Record<string, unknown>>;
  }>;
  generation_config: Readonly<{ thinking_level: 'low' }>;
  store: false;
}>;

export function buildInteractionRequest(
  request: Omit<GeminiStructuredRequest, 'signal' | 'thinkingLevel'>,
): InteractionRequest {
  return {
    model: request.model,
    input: request.userInput,
    system_instruction: request.systemInstruction,
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: request.responseJsonSchema,
    },
    generation_config: { thinking_level: 'low' },
    store: false,
  };
}

export class GeminiClientError extends Error {
  readonly code = 'MODEL_RESPONSE_REJECTED';

  constructor() {
    super('MODEL_RESPONSE_REJECTED');
    this.name = 'GeminiClientError';
  }
}

export function parseInteractionOutput(interaction: unknown): unknown {
  if (
    typeof interaction !== 'object' ||
    interaction === null ||
    !('output_text' in interaction) ||
    typeof interaction.output_text !== 'string' ||
    !interaction.output_text
  ) {
    throw new GeminiClientError();
  }
  try {
    return JSON.parse(interaction.output_text) as unknown;
  } catch {
    throw new GeminiClientError();
  }
}

export function createGeminiPort(apiKey: string): GeminiPort {
  const client = new GoogleGenAI({ apiKey });
  return {
    async createStructuredInteraction(request) {
      const interaction = await client.interactions.create(
        buildInteractionRequest(request),
        {
          ...(request.signal ? { signal: request.signal } : {}),
          retries: { strategy: 'none' },
          timeout_ms: 12_000,
        },
      );
      return parseInteractionOutput(interaction);
    },
  };
}
