import { applyClockOperation, compareIsoDates, parseIsoDate } from './plain-date';
import type { ClockOperation, IsoDate } from './types';
import type { RulePack, StepDefinition } from '../rule-packs/types';
import { validateRulePack } from '../rule-packs/types';

export type AnchorValues = Readonly<Record<string, string | undefined>>;

type RowBase = Readonly<{
  id: string;
  label: string;
  provision: string;
  sourceRef: string;
  caveats: readonly string[];
}>;

export type EvaluationRow =
  | (RowBase &
      Readonly<{
        state: 'BOUND';
        inputs: readonly Readonly<{ ref: string; value: IsoDate }>[];
        operation: ClockOperation;
        value: IsoDate;
      }>)
  | (RowBase &
      Readonly<{
        state: 'UNBOUND';
        missingDependencies: readonly string[];
        missingEvidence: string;
      }>)
  | (RowBase &
      Readonly<{
        state: 'INVALID_INPUT';
        code: 'INVALID_ISO_DATE';
      }>)
  | (RowBase &
      Readonly<{
        state: 'COVERAGE_LIMIT';
        code: string;
        message: string;
      }>);

export type EvaluationCoverage =
  | Readonly<{ state: 'IN_SCOPE' }>
  | Readonly<{ state: 'COVERAGE_LIMIT'; code: string; message: string }>;

export type EvaluationResult = Readonly<{
  packId: RulePack['id'];
  coverage: EvaluationCoverage;
  rows: readonly EvaluationRow[];
}>;

export class RulePackInputError extends Error {
  readonly code: 'UNKNOWN_ANCHOR';

  constructor(code: 'UNKNOWN_ANCHOR') {
    super(code);
    this.name = 'RulePackInputError';
    this.code = code;
  }
}

function rowBase(step: StepDefinition): RowBase {
  return {
    id: step.id,
    label: step.label,
    provision: step.provision,
    sourceRef: step.sourceRef,
    caveats: step.caveats,
  };
}

function invalidRows(pack: RulePack): readonly EvaluationRow[] {
  return pack.steps.map((step) => ({
    ...rowBase(step),
    state: 'INVALID_INPUT',
    code: 'INVALID_ISO_DATE',
  }));
}

function coverageRows(
  pack: RulePack,
  coverage: Extract<EvaluationCoverage, { state: 'COVERAGE_LIMIT' }>,
): readonly EvaluationRow[] {
  return pack.steps.map((step) => ({
    ...rowBase(step),
    state: 'COVERAGE_LIMIT',
    code: coverage.code,
    message: coverage.message,
  }));
}

export function evaluateRulePack(
  inputPack: RulePack,
  anchors: AnchorValues,
): EvaluationResult {
  const pack = validateRulePack(inputPack);
  const knownAnchors = new Set(pack.anchors.map((anchor) => anchor.id));
  for (const id of Object.keys(anchors)) {
    if (!knownAnchors.has(id)) throw new RulePackInputError('UNKNOWN_ANCHOR');
  }

  const suppliedDates = Object.values(anchors).filter(
    (value): value is string => value !== undefined && value !== '',
  );
  if (suppliedDates.some((value) => !parseIsoDate(value).ok)) {
    return { packId: pack.id, coverage: { state: 'IN_SCOPE' }, rows: invalidRows(pack) };
  }

  if (pack.coverage) {
    const coverageValue = anchors[pack.coverage.anchorId];
    if (
      coverageValue &&
      compareIsoDates(coverageValue, pack.coverage.notBefore) < 0
    ) {
      const coverage: EvaluationCoverage = {
        state: 'COVERAGE_LIMIT',
        code: pack.coverage.code,
        message: pack.coverage.message,
      };
      return { packId: pack.id, coverage, rows: coverageRows(pack, coverage) };
    }
  }

  const values = new Map<string, IsoDate>();
  for (const [id, value] of Object.entries(anchors)) {
    if (value) values.set(id, value);
  }

  const rows: EvaluationRow[] = [];
  for (const step of pack.steps) {
    const missingRequired = step.inputs
      .filter((input) => input.required && !values.has(input.ref))
      .map((input) => input.ref);
    if (missingRequired.length > 0) {
      rows.push({
        ...rowBase(step),
        state: 'UNBOUND',
        missingDependencies: missingRequired,
        missingEvidence: step.missingEvidence,
      });
      continue;
    }

    const resolvedInputs = step.inputs.flatMap((input) => {
      const value = values.get(input.ref);
      return value ? [{ ref: input.ref, value }] : [];
    });
    const value = applyClockOperation(
      resolvedInputs.map((input) => input.value),
      step.operation,
    );
    values.set(step.id, value);
    rows.push({
      ...rowBase(step),
      state: 'BOUND',
      inputs: resolvedInputs,
      operation: step.operation,
      value,
    });
  }

  return { packId: pack.id, coverage: { state: 'IN_SCOPE' }, rows };
}

export function getEvaluationRow(
  result: EvaluationResult,
  id: string,
): EvaluationRow {
  const row = result.rows.find((candidate) => candidate.id === id);
  if (!row) throw new Error('UNKNOWN_EVALUATION_ROW');
  return row;
}
