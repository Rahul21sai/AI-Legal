import type { EvaluationResult, EvaluationRow } from '@/domain/clock/evaluate';
import type { ClockOperation } from '@/domain/clock/types';
import type { RulePack } from '@/domain/rule-packs/types';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatIsoDate(value: string): string {
  const [year, month, day] = value.split('-');
  const monthName = month ? MONTHS[Number(month) - 1] : undefined;
  if (!year || !monthName || !day) return value;
  return `${day} ${monthName} ${year}`;
}

function describeOperation(operation: ClockOperation): string {
  if (operation.kind === 'add_days') return `+ ${operation.amount} calendar days`;
  if (operation.kind === 'add_months') return `+ ${operation.amount} calendar month`;
  if (operation.kind === 'next_day') return '+ 1 next day';
  if (operation.kind === 'later_of') return 'later confirmed date';
  if (operation.kind === 'first_available') return 'confirmed value or standard fallback';
  return 'copied value';
}

function ResultCell({ row }: Readonly<{ row: EvaluationRow }>) {
  if (row.state === 'BOUND') {
    return (
      <div className="bound-result">
        <strong>{formatIsoDate(row.value)}</strong>
        <span>{describeOperation(row.operation)}</span>
      </div>
    );
  }
  if (row.state === 'UNBOUND') {
    return (
      <div className="unbound-result">
        <strong>UNBOUND</strong>
        <span>{row.missingEvidence}</span>
      </div>
    );
  }
  if (row.state === 'INVALID_INPUT') {
    return (
      <div className="invalid-result">
        <strong>INVALID DATE</strong>
        <span>Use a real date in YYYY-MM-DD form.</span>
      </div>
    );
  }
  return <span>Outside reviewed pack</span>;
}

export function ComputationLedger({
  pack,
  result,
}: Readonly<{ pack: RulePack; result: EvaluationResult }>) {
  const coverage = result.coverage.state === 'COVERAGE_LIMIT' ? result.coverage : null;
  return (
    <section className="computation-section" aria-labelledby="computation-heading">
      <div className="section-heading">
        <div>
          <p>Worked computation</p>
          <h3 id="computation-heading">{pack.title}</h3>
        </div>
        <span>{pack.version}</span>
      </div>

      {coverage && (
        <div className="coverage-limit" role="status">
          <strong>COVERAGE LIMIT</strong>
          <p>{coverage.message}</p>
        </div>
      )}

      <div className="table-scroll">
        <table className="computation-table">
          <caption className="sr-only">
            Ordered statutory clock calculation for {pack.title}
          </caption>
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col">Working</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr className={`row-${row.state.toLowerCase()}`} key={row.id}>
                <th scope="row">
                  <span>{row.label}</span>
                  <small>{row.provision}</small>
                </th>
                <td data-label="Working">
                  {row.state === 'BOUND' ? (
                    <span>
                      {row.inputs.map((input) => formatIsoDate(input.value)).join(' / ')}
                    </span>
                  ) : (
                    <span>Calculation stopped</span>
                  )}
                </td>
                <td data-label="Result">
                  <ResultCell row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pack-warning">{pack.warning}</p>
    </section>
  );
}
