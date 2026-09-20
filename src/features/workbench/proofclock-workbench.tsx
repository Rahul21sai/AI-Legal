'use client';

import { useMemo, useReducer } from 'react';

import { evaluateRulePack } from '@/domain/clock/evaluate';
import { getRulePack, rulePacks } from '@/domain/rule-packs/registry';
import { ManualEvidenceLedger } from '@/features/evidence/manual-evidence-ledger';
import { ComputationLedger } from '@/features/ledger/computation-ledger';
import { RuleSelector } from '@/features/rule-selector/rule-selector';
import { initialWorkbenchState, workbenchReducer } from './workbench-reducer';

export function ProofClockWorkbench() {
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
        <div className="workbench-grid">
          <ManualEvidenceLedger
            bindings={state.bindings}
            onChange={(anchorId, value) =>
              dispatch({ type: 'edit_manual_anchor', anchorId, value })
            }
            pack={pack}
          />
          <ComputationLedger pack={pack} result={result} />
        </div>
      )}
    </section>
  );
}
