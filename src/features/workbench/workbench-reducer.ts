import type { BindableCandidate } from '@/ai/contracts';
import type { ExtractionTrace } from '@/ai/extract-service';
import type { IsoDate } from '@/domain/clock/types';
import type { RulePackId } from '@/domain/rule-packs/types';

export type ConfirmedBinding = Readonly<{
  date: IsoDate;
  origin: 'manual' | 'extracted';
  evidenceQuote?: string;
  range?: Readonly<{ start: number; end: number }>;
}>;

export type WorkbenchExtractionState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{
      status: 'success';
      trace: ExtractionTrace;
    }>
  | Readonly<{ status: 'error'; message: string }>;

export type WorkbenchState = Readonly<{
  selectedPackId: RulePackId | null;
  bindings: Readonly<Record<string, ConfirmedBinding | undefined>>;
  extraction: WorkbenchExtractionState;
}>;

export const initialWorkbenchState: WorkbenchState = {
  selectedPackId: null,
  bindings: {},
  extraction: { status: 'idle' },
};

export type WorkbenchAction =
  | Readonly<{ type: 'select_pack'; packId: RulePackId }>
  | Readonly<{ type: 'edit_manual_anchor'; anchorId: string; value: string }>
  | Readonly<{ type: 'confirm_candidate'; candidate: BindableCandidate }>
  | Readonly<{ type: 'clear_anchor'; anchorId: string }>
  | Readonly<{ type: 'extraction_started' }>
  | Readonly<{
      type: 'extraction_succeeded';
      trace: Extract<WorkbenchExtractionState, { status: 'success' }>['trace'];
    }>
  | Readonly<{ type: 'extraction_failed'; message: string }>;

function withoutBinding(
  bindings: WorkbenchState['bindings'],
  anchorId: string,
): WorkbenchState['bindings'] {
  return Object.fromEntries(
    Object.entries(bindings).filter(([id]) => id !== anchorId),
  );
}

export function workbenchReducer(
  state: WorkbenchState,
  action: WorkbenchAction,
): WorkbenchState {
  switch (action.type) {
    case 'select_pack':
      if (action.packId === state.selectedPackId) return state;
      return {
        selectedPackId: action.packId,
        bindings: {},
        extraction: { status: 'idle' },
      };
    case 'edit_manual_anchor':
      if (!action.value) {
        return { ...state, bindings: withoutBinding(state.bindings, action.anchorId) };
      }
      return {
        ...state,
        bindings: {
          ...state.bindings,
          [action.anchorId]: { date: action.value, origin: 'manual' },
        },
      };
    case 'confirm_candidate':
      return {
        ...state,
        bindings: {
          ...state.bindings,
          [action.candidate.eventKind]: {
            date: action.candidate.normalizedDate,
            origin: 'extracted',
            evidenceQuote: action.candidate.evidenceQuote,
            range: action.candidate.range,
          },
        },
      };
    case 'clear_anchor':
      return { ...state, bindings: withoutBinding(state.bindings, action.anchorId) };
    case 'extraction_started':
      return { ...state, extraction: { status: 'loading' } };
    case 'extraction_succeeded':
      return { ...state, extraction: { status: 'success', trace: action.trace } };
    case 'extraction_failed':
      return { ...state, extraction: { status: 'error', message: action.message } };
  }
}
