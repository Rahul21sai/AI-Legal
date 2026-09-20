'use client';

import { useMemo, useReducer } from 'react';

import { evaluateRulePack } from '@/domain/clock/evaluate';
import { getRulePack, rulePacks } from '@/domain/rule-packs/registry';
import { ManualEvidenceLedger } from '@/features/evidence/manual-evidence-ledger';
import { CandidateBindingList } from '@/features/evidence/candidate-binding-list';
import { ExtractEventsPanel } from '@/features/evidence/extract-events-panel';
import { ComputationLedger } from '@/features/ledger/computation-ledger';
import { PromptInspector } from '@/features/prompt-inspector/prompt-inspector';
import { SourcePanel } from '@/features/provenance/source-panel';
import type { SourceSnapshot } from '@/sources/contracts';
import { RuleSelector } from '@/features/rule-selector/rule-selector';
import { initialWorkbenchState, workbenchReducer } from './workbench-reducer';

export function ProofClockWorkbench({
  snapshotsByPack = {},
}: Readonly<{
  snapshotsByPack?: Readonly<Record<string, readonly SourceSnapshot[] | undefined>>;
}>) {
  const [state, dispatch] = useReducer(workbenchReducer, initialWorkbenchState);
  const pack = state.selectedPackId ? getRulePack(state.selectedPackId) : null;
  const result = useMemo(() => {
    if (!pack) return null;
    const anchors = Object.fromEntries(
      Object.entries(state.bindings).map(([id, binding]) => [id, binding?.date]),
    );
    return evaluateRulePack(pack, anchors);
  }, [pack, state.bindings]);

  return (
    <section className="starter-ledger" aria-labelledby="choose-clock">
      <div className="ledger-heading">
        <h2 id="choose-clock">Choose a statutory clock</h2>
        <p>No option is selected for you.</p>
      </div>
      <RuleSelector
        onSelect={(packId) => dispatch({ type: 'select_pack', packId })}
        packs={rulePacks}
        selected={state.selectedPackId}
      />

      {!pack || !result ? (
        <div className="empty-ledger" aria-label="No clock selected">
          <span className="binding-seam" aria-hidden="true" />
          <p>Select a clock to reveal its named anchors and worked rows.</p>
        </div>
      ) : (
        <>
          <div className="workbench-grid">
            <div className="evidence-column">
              <ManualEvidenceLedger
                bindings={state.bindings}
                onChange={(anchorId, value) =>
                  dispatch({ type: 'edit_manual_anchor', anchorId, value })
                }
                pack={pack}
              />
              <ExtractEventsPanel
                onFailure={(message) =>
                  dispatch({ type: 'extraction_failed', message })
                }
                onStart={() => dispatch({ type: 'extraction_started' })}
                onSuccess={(trace) =>
                  dispatch({ type: 'extraction_succeeded', trace })
                }
                packId={pack.id}
                status={state.extraction.status}
              />
              {state.extraction.status === 'success' && (
                <CandidateBindingList
                  bindings={state.bindings}
                  candidates={state.extraction.trace.accepted}
                  onConfirm={(candidate) =>
                    dispatch({ type: 'confirm_candidate', candidate })
                  }
                />
              )}
            </div>
            <ComputationLedger pack={pack} result={result} />
          </div>
          {state.extraction.status === 'success' && (
            <PromptInspector trace={state.extraction.trace} />
          )}
          {(snapshotsByPack[pack.id]?.length ?? 0) > 0 && (
            <SourcePanel snapshots={snapshotsByPack[pack.id] ?? []} />
          )}
        </>
      )}
    </section>
  );
}
