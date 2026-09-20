'use client';

import { useState } from 'react';

import { extractionTraceSchema } from '@/ai/contracts';
import type { ExtractionTrace } from '@/ai/extract-service';
import type { RulePackId } from '@/domain/rule-packs/types';

const MALFORMED_MESSAGE =
  'The extraction response could not be verified. Continue with manual entry.';

export function ExtractEventsPanel({
  packId,
  status,
  onStart,
  onSuccess,
  onFailure,
}: Readonly<{
  packId: RulePackId;
  status: 'idle' | 'loading' | 'success' | 'error';
  onStart: () => void;
  onSuccess: (trace: ExtractionTrace) => void;
  onFailure: (message: string) => void;
}>) {
  const [text, setText] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState('');
  const overLimit = text.length > 5_000;
  const loading = status === 'loading';

  const fail = (failureMessage: string): void => {
    setMessage(failureMessage);
    onFailure(failureMessage);
  };

  const submit = async (): Promise<void> => {
    if (!text || overLimit || !acknowledged || loading) return;
    onStart();
    setMessage('Extracting candidate events. No date will bind automatically.');
    try {
      const response = await fetch('/api/extract-events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rulePackId: packId, text }),
        signal: AbortSignal.timeout(13_000),
      });
      const payload = (await response.json()) as unknown;
      if (
        !response.ok ||
        typeof payload !== 'object' ||
        payload === null ||
        !('ok' in payload) ||
        payload.ok !== true ||
        !('trace' in payload)
      ) {
        const apiMessage =
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof payload.error === 'object' &&
          payload.error !== null &&
          'message' in payload.error &&
          typeof payload.error.message === 'string'
            ? payload.error.message
            : MALFORMED_MESSAGE;
        fail(apiMessage);
        return;
      }
      const parsed = extractionTraceSchema.safeParse(payload.trace);
      if (!parsed.success) {
        fail(MALFORMED_MESSAGE);
        return;
      }
      setMessage(
        parsed.data.accepted.length > 0
          ? 'Candidate events are ready for review.'
          : 'No bindable dated event passed the guard. Manual entry remains available.',
      );
      onSuccess(parsed.data as ExtractionTrace);
    } catch (error) {
      fail(
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Extraction timed out. Continue with manual date entry.'
          : 'Extraction is unavailable. Continue with manual date entry.',
      );
    } finally {
      setAcknowledged(false);
    }
  };

  return (
    <section className="extract-panel" aria-labelledby="extract-heading">
      <div className="extract-heading">
        <div>
          <p>Optional Gemini extraction</p>
          <h4 id="extract-heading">Find candidate dates in short evidence</h4>
        </div>
        <span>Manual entry always works</span>
      </div>
      <label htmlFor={`${packId}-evidence-text`}>Short evidence text</label>
      <textarea
        id={`${packId}-evidence-text`}
        onChange={(event) => setText(event.currentTarget.value)}
        rows={5}
        value={text}
      />
      <div className="character-count">
        <span>{text.length.toLocaleString('en-IN')} / 5,000</span>
        {overLimit && <strong>Limit evidence text to 5,000 characters.</strong>}
      </div>
      <label className="gemini-disclosure">
        <input
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.currentTarget.checked)}
          type="checkbox"
        />
        <span>
          Send this text to Google Gemini for this request. ProofClock does not retain it.
        </span>
      </label>
      <button
        className="primary-action"
        disabled={!text || overLimit || !acknowledged || loading}
        onClick={() => void submit()}
        type="button"
      >
        {loading ? 'Extracting…' : 'Extract dated events'}
      </button>
      <p aria-live="polite" className="extraction-status">
        {message}
      </p>
    </section>
  );
}
