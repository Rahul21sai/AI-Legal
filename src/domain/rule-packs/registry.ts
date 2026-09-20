import { niAct138 } from './ni-act-138';
import { rbiOmbudsman2026 } from './rbi-ombudsman-2026';
import type { RulePack, RulePackId } from './types';

const RULE_PACKS: Readonly<Record<RulePackId, RulePack>> = {
  'ni-act-138': niAct138,
  'rbi-ombudsman-2026': rbiOmbudsman2026,
};

export function getRulePack(id: RulePackId): RulePack {
  return RULE_PACKS[id];
}

export const rulePacks = Object.values(RULE_PACKS);
