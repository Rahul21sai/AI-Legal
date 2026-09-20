'use client';

import { useState } from 'react';

import type { BindableCandidate, GuardedCandidate } from '@/ai/contracts';
import { formatIsoDate } from '@/features/ledger/computation-ledger';
import type { ConfirmedBinding } from '@/features/workbench/workbench-reducer';

function labelFor(eventKind: string): string {
  return eventKind
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function CandidateBindingList({
  candidates,
  bindings,
  onConfirm,
}: Readonly<{
  candidates: readonly GuardedCandidate[];
  bindings: Readonly<Record<string, ConfirmedBinding | undefined>>;
  onConfirm: (candidate: BindableCandidate) => void;
}>) {
  const [pendingReplacement, setPendingReplacement] = useState<string | null>(null);
  if (candidates.length === 0) return null;

  return (
    <section className="candidate-section" aria-labelledby="candidate-heading">
      <h4 id="candidate-heading">Review candidates</h4>
      <p>Gemini suggestions remain unbound until the review action is used.</p>
      <ol className="candidate-list">
        {candidates.map((candidate, index) => {
          const key = `${candidate.eventKind}-${candidate.range.start}-${index}`;
          if (!candidate.bindable) {
            return (
              <li className="candidate-card candidate-out" key={key}>
                <strong>Outside this clock</strong>
                <q>{candidate.evidenceQuote}</q>
              </li>
            );
          }
          const replacing = Boolean(bindings[candidate.eventKind]);
          const awaitingConfirmation = pendingReplacement === key;
          return (
            <li className="candidate-card" key={key}>
              <span>{labelFor(candidate.eventKind)}</span>
              <q>{candidate.evidenceQuote}</q>
              <strong>{formatIsoDate(candidate.normalizedDate)}</strong>
              <button
                onClick={() => {
                  if (replacing && !awaitingConfirmation) {
                    setPendingReplacement(key);
                    return;
                  }
                  onConfirm(candidate);
                  setPendingReplacement(null);
                }}
                type="button"
              >
                {awaitingConfirmation
                  ? 'Confirm replacement'
                  : replacing
                    ? 'Replace binding'
                    : 'Review and bind'}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
