import type { RulePack } from '@/domain/rule-packs/types';
import type { ConfirmedBinding } from '@/features/workbench/workbench-reducer';

export function ManualEvidenceLedger({
  pack,
  bindings,
  onChange,
}: Readonly<{
  pack: RulePack;
  bindings: Readonly<Record<string, ConfirmedBinding | undefined>>;
  onChange: (anchorId: string, value: string) => void;
}>) {
  return (
    <section className="evidence-ledger" aria-labelledby="evidence-heading">
      <div className="section-heading">
        <div>
          <p>Evidence ledger</p>
          <h3 id="evidence-heading">Bind dates manually</h3>
        </div>
        <span>Nothing is inferred</span>
      </div>
      <div className="anchor-list">
        {pack.anchors.map((anchor) => {
          const helpId = `${pack.id}-${anchor.id}-help`;
          const inputId = `${pack.id}-${anchor.id}`;
          return (
            <div className="anchor-row" key={anchor.id}>
              <label htmlFor={inputId}>
                <span>{anchor.label}</span>
                {!anchor.required && <small>Optional</small>}
              </label>
              <input
                aria-describedby={helpId}
                id={inputId}
                max="9999-12-31"
                min="1900-01-01"
                onChange={(event) => onChange(anchor.id, event.currentTarget.value)}
                type="date"
                value={bindings[anchor.id]?.date ?? ''}
              />
              <div className="anchor-help" id={helpId}>
                <p>{anchor.legalPhrase}</p>
                <p>Evidence: {anchor.evidenceExamples.join('; ')}</p>
                {anchor.id === 'demand_notice_dispatched' && (
                  <strong>Dispatch does not bind receipt.</strong>
                )}
                {bindings[anchor.id]?.origin === 'extracted' && (
                  <strong>Confirmed from extracted evidence.</strong>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
