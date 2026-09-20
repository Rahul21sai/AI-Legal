// @vitest-environment node

import {
  buildInteractionRequest,
  parseInteractionOutput,
} from './gemini-client';

test('maps extraction to the current non-persistent Interactions API surface', () => {
  const request = buildInteractionRequest({
    model: 'gemini-3.8-flash',
    systemInstruction: 'System boundary',
    userInput: 'Memo received 18 Jul 2026.',
    responseJsonSchema: { type: 'object' },
  });

  expect(request).toEqual({
    model: 'gemini-3.8-flash',
    input: 'Memo received 18 Jul 2026.',
    system_instruction: 'System boundary',
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: { type: 'object' },
    },
    generation_config: { thinking_level: 'low' },
    store: false,
  });
});

test('parses only the SDK output_text JSON payload', () => {
  expect(
    parseInteractionOutput({
      output_text: '{"candidates":[]}',
      outputs: [{ type: 'text', text: 'ignored' }],
    }),
  ).toEqual({ candidates: [] });
});

test.each([{ output_text: undefined }, { output_text: '' }, { output_text: 'not-json' }])(
  'rejects an unusable interaction output %#',
  (interaction) => {
    expect(() => parseInteractionOutput(interaction)).toThrowError(
      /MODEL_RESPONSE_REJECTED/,
    );
  },
);
