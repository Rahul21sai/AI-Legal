import type { ClockOperation, IsoDate } from '../clock/types';

export type RulePackId = 'ni-act-138' | 'rbi-ombudsman-2026';

export type StepInput = Readonly<{
  ref: string;
  required: boolean;
}>;

export type AnchorDefinition = Readonly<{
  id: string;
  eventKind: string;
  label: string;
  legalPhrase: string;
  evidenceExamples: readonly string[];
  required: boolean;
  candidateGuard?: Readonly<{
    requiredAny: readonly string[];
  }>;
}>;

export type StepDefinition = Readonly<{
  id: string;
  label: string;
  provision: string;
  sourceRef: string;
  inputs: readonly StepInput[];
  operation: ClockOperation;
  missingEvidence: string;
  caveats: readonly string[];
}>;

export type CoverageDefinition = Readonly<{
  anchorId: string;
  notBefore: IsoDate;
  code: string;
  message: string;
}>;

export type RulePack = Readonly<{
  id: RulePackId;
  version: string;
  title: string;
  jurisdiction: string;
  scope: string;
  warning: string;
  anchors: readonly AnchorDefinition[];
  steps: readonly StepDefinition[];
  sourceRefs: readonly string[];
  caveats: readonly string[];
  coverage?: CoverageDefinition;
}>;

const SECOND_PERSON_PATTERN = /\b(?:you|your|yours|yourself)\b/i;

function assertNeutralCopy(pack: RulePack): void {
  const copy = [
    pack.title,
    pack.scope,
    pack.warning,
    ...pack.caveats,
    ...pack.anchors.flatMap((anchor) => [
      anchor.label,
      anchor.legalPhrase,
      ...anchor.evidenceExamples,
    ]),
    ...pack.steps.flatMap((step) => [
      step.label,
      step.missingEvidence,
      ...step.caveats,
    ]),
  ];
  if (copy.some((value) => SECOND_PERSON_PATTERN.test(value))) {
    throw new Error('SECOND_PERSON_COPY');
  }
}

function assertAcyclic(pack: RulePack): void {
  const steps = new Map(pack.steps.map((step) => [step.id, step]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error('STEP_DEPENDENCY_CYCLE');
    if (visited.has(id)) return;
    const step = steps.get(id);
    if (!step) return;
    visiting.add(id);
    for (const input of step.inputs) {
      if (steps.has(input.ref)) visit(input.ref);
    }
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of steps.keys()) visit(id);
}

export function validateRulePack(pack: RulePack): RulePack {
  const anchorIds = new Set(pack.anchors.map((anchor) => anchor.id));
  const stepIds = new Set(pack.steps.map((step) => step.id));
  if (anchorIds.size !== pack.anchors.length || stepIds.size !== pack.steps.length) {
    throw new Error('DUPLICATE_RULE_ID');
  }
  for (const step of pack.steps) {
    if (!step.sourceRef || !pack.sourceRefs.includes(step.sourceRef)) {
      throw new Error('UNKNOWN_SOURCE_REF');
    }
    for (const input of step.inputs) {
      if (!anchorIds.has(input.ref) && !stepIds.has(input.ref)) {
        throw new Error('UNKNOWN_STEP_INPUT');
      }
    }
  }
  if (pack.coverage && !anchorIds.has(pack.coverage.anchorId)) {
    throw new Error('UNKNOWN_COVERAGE_ANCHOR');
  }
  assertNeutralCopy(pack);
  assertAcyclic(pack);
  return pack;
}
