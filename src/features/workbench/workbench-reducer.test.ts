// @vitest-environment node

import type { BindableCandidate } from '@/ai/contracts';
import {
  initialWorkbenchState,
  workbenchReducer,
} from './workbench-reducer';

test('switching rule packs clears incompatible bindings and extraction state', () => {
  const populated = {
    ...initialWorkbenchState,
    selectedPackId: 'ni-act-138' as const,
    bindings: {
      bank_information_received: {
        date: '2026-07-18',
        origin: 'manual' as const,
      },
    },
    extraction: { status: 'error' as const, message: 'Rate limited' },
  };

  const next = workbenchReducer(populated, {
    type: 'select_pack',
    packId: 'rbi-ombudsman-2026',
  });

  expect(next).toEqual({
    selectedPackId: 'rbi-ombudsman-2026',
    bindings: {},
    extraction: { status: 'idle' },
  });
  expect(populated.bindings).toHaveProperty('bank_information_received');
});

test('manual edits bind valid browser values and empty edits clear them', () => {
  const selected = workbenchReducer(initialWorkbenchState, {
    type: 'select_pack',
    packId: 'ni-act-138',
  });
  const bound = workbenchReducer(selected, {
    type: 'edit_manual_anchor',
    anchorId: 'bank_information_received',
    value: '2026-07-18',
  });
  const cleared = workbenchReducer(bound, {
    type: 'edit_manual_anchor',
    anchorId: 'bank_information_received',
    value: '',
  });

  expect(bound.bindings.bank_information_received).toEqual({
    date: '2026-07-18',
    origin: 'manual',
  });
  expect(cleared.bindings).not.toHaveProperty('bank_information_received');
});

test('explicit candidate confirmation copies only guarded provenance', () => {
  const candidate: BindableCandidate = {
    eventKind: 'bank_information_received',
    evidenceQuote: 'Memo received 18 Jul 2026.',
    range: { start: 0, end: 27 },
    normalizedDate: '2026-07-18',
    dateSourceText: '18 Jul 2026',
    bindable: true,
    requiresConfirmation: true,
  };

  const next = workbenchReducer(
    { ...initialWorkbenchState, selectedPackId: 'ni-act-138' },
    { type: 'confirm_candidate', candidate },
  );

  expect(next.bindings.bank_information_received).toEqual({
    date: '2026-07-18',
    origin: 'extracted',
    evidenceQuote: 'Memo received 18 Jul 2026.',
    range: { start: 0, end: 27 },
  });
});
