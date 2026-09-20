'use client';

import { useState } from 'react';

import {
  sourceStatusSchema,
  type SourceSnapshot,
  type SourceStatus,
} from '@/sources/contracts';

function statusMessage(status: SourceStatus | undefined): string {
  if (!status) return 'Snapshot is the current read path.';
  if (status.state === 'MATCH') return `Live source matched at ${status.checkedAt}.`;
  if (status.state === 'CHANGED') return 'Source changed; reviewed snapshot not replaced.';
  if (status.state === 'TIMEOUT') return 'Live check timed out; snapshot retained.';
  return 'Live source unreachable; snapshot retained.';
}

export function SourcePanel({
  snapshots,
}: Readonly<{ snapshots: readonly SourceSnapshot[] }>) {
  const [statuses, setStatuses] = useState<
    Readonly<Record<string, SourceStatus | undefined>>
  >({});
  const [checking, setChecking] = useState<string | null>(null);

  const check = async (snapshot: SourceSnapshot): Promise<void> => {
    setChecking(snapshot.id);
    try {
      const response = await fetch(
        `/api/source-status?sourceId=${encodeURIComponent(snapshot.id)}`,
      );
      const parsed = sourceStatusSchema.safeParse(await response.json());
      const status: SourceStatus = parsed.success
        ? parsed.data
        : { state: 'UNREACHABLE', sourceId: snapshot.id };
      setStatuses((current) => ({ ...current, [snapshot.id]: status }));
    } catch {
      setStatuses((current) => ({
        ...current,
        [snapshot.id]: { state: 'UNREACHABLE', sourceId: snapshot.id },
      }));
    } finally {
      setChecking(null);
    }
  };

  return (
    <section className="source-panel" aria-labelledby="sources-heading">
      <div className="ledger-heading source-heading">
        <h2 id="sources-heading">Reviewed sources</h2>
        <p>Local excerpts first; live checks never rewrite a rule.</p>
      </div>
      <div className="source-list">
        {snapshots.map((snapshot) => {
          const status = statuses[snapshot.id];
          return (
            <article className="source-card" key={snapshot.id}>
              <div className="source-meta">
                <span>
                  {snapshot.authority === 'official'
                    ? 'Official source'
                    : 'Third-party structured mirror'}
                </span>
                <span>Retrieved {snapshot.retrievedAt}</span>
              </div>
              <h3>{snapshot.instrumentTitle}</h3>
              <p>{snapshot.provision}</p>
              {snapshot.excerpts.map((excerpt) => (
                <blockquote key={excerpt}>{excerpt}</blockquote>
              ))}
              <p className="authority-note">{snapshot.authorityNote}</p>
              <p>{snapshot.attribution}</p>
              <div className="source-actions">
                <a href={snapshot.sourceUrl} rel="noopener noreferrer" target="_blank">
                  Open source
                </a>
                <button
                  disabled={checking === snapshot.id}
                  onClick={() => void check(snapshot)}
                  type="button"
                >
                  {checking === snapshot.id ? 'Checking…' : 'Check live source'}
                </button>
              </div>
              <p aria-live="polite" className="source-status">
                {statusMessage(status)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
