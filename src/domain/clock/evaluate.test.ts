// @vitest-environment node

import { evaluateRulePack, getEvaluationRow, RulePackInputError } from './evaluate';
import { niAct138 } from '../rule-packs/ni-act-138';
import { rbiOmbudsman2026 } from '../rule-packs/rbi-ombudsman-2026';
import { validateRulePack } from '../rule-packs/types';

function expectBoundValue(
  result: ReturnType<typeof evaluateRulePack>,
  id: string,
  value: string,
): void {
  expect(getEvaluationRow(result, id)).toMatchObject({ state: 'BOUND', value });
}

describe('NI Act section 138 chain', () => {
  test('computes the notice row but propagates a missing drawer receipt', () => {
    const result = evaluateRulePack(niAct138, {
      bank_information_received: '2026-07-18',
      demand_notice_dispatched: '2026-08-02',
    });

    expect(getEvaluationRow(result, 'notice_boundary')).toMatchObject({
      state: 'BOUND',
      value: '2026-08-17',
    });
    expect(getEvaluationRow(result, 'payment_period_boundary')).toMatchObject({
      state: 'UNBOUND',
      missingDependencies: ['demand_notice_received_by_drawer'],
    });
    expect(getEvaluationRow(result, 'cause_of_action_date').state).toBe('UNBOUND');
    expect(getEvaluationRow(result, 'complaint_boundary').state).toBe('UNBOUND');
  });

  test('computes all reviewed rows after receipt is explicitly bound', () => {
    const result = evaluateRulePack(niAct138, {
      bank_information_received: '2026-07-18',
      demand_notice_dispatched: '2026-08-02',
      demand_notice_received_by_drawer: '2026-08-20',
    });

    expectBoundValue(result, 'payment_period_boundary', '2026-09-04');
    expectBoundValue(result, 'cause_of_action_date', '2026-09-05');
    expectBoundValue(result, 'complaint_boundary', '2026-10-05');
  });

  test('never treats dispatch as proof of receipt', () => {
    const result = evaluateRulePack(niAct138, {
      demand_notice_dispatched: '2026-08-02',
    });

    expect(getEvaluationRow(result, 'payment_period_boundary')).toMatchObject({
      state: 'UNBOUND',
      missingDependencies: ['demand_notice_received_by_drawer'],
    });
  });
});

describe('RBI Ombudsman 2026 chain', () => {
  test('uses the later of the standard response boundary and last communication', () => {
    const result = evaluateRulePack(rbiOmbudsman2026, {
      complaint_to_regulated_entity: '2026-07-01',
      last_communication_from_entity: '2026-08-10',
    });

    expectBoundValue(result, 'standard_response_boundary', '2026-07-31');
    expectBoundValue(result, 'response_timeline_anchor', '2026-07-31');
    expectBoundValue(result, 'window_anchor', '2026-08-10');
    expectBoundValue(result, 'ombudsman_boundary', '2026-11-08');
  });

  test('uses a confirmed applicable timeline instead of the standard fallback', () => {
    const result = evaluateRulePack(rbiOmbudsman2026, {
      complaint_to_regulated_entity: '2026-07-01',
      applicable_response_timeline_end: '2026-08-15',
      last_communication_from_entity: '2026-08-10',
    });

    expectBoundValue(result, 'response_timeline_anchor', '2026-08-15');
    expectBoundValue(result, 'window_anchor', '2026-08-15');
    expectBoundValue(result, 'ombudsman_boundary', '2026-11-13');
  });

  test('uses the response boundary when no last communication is supplied', () => {
    const result = evaluateRulePack(rbiOmbudsman2026, {
      complaint_to_regulated_entity: '2026-07-01',
    });

    expectBoundValue(result, 'window_anchor', '2026-07-31');
    expectBoundValue(result, 'ombudsman_boundary', '2026-10-29');
  });

  test('stops rather than applying the 2026 pack before commencement', () => {
    const result = evaluateRulePack(rbiOmbudsman2026, {
      complaint_to_regulated_entity: '2026-06-30',
    });

    expect(result.coverage).toEqual({
      state: 'COVERAGE_LIMIT',
      code: 'PREDATES_RBI_IOS_2026',
      message: 'The reviewed RB-IOS 2026 pack starts on 1 July 2026.',
    });
    expect(result.rows.every((row) => row.state === 'COVERAGE_LIMIT')).toBe(true);
  });
});

describe('rule-pack input and policy guards', () => {
  test('rejects anchor ids that the selected rule pack does not define', () => {
    expect(() =>
      evaluateRulePack(niAct138, { unrelated_event: '2026-07-18' }),
    ).toThrowError(new RulePackInputError('UNKNOWN_ANCHOR'));
  });

  test('marks every row invalid when a supplied anchor is not a real ISO date', () => {
    const result = evaluateRulePack(niAct138, {
      bank_information_received: '2026-02-30',
    });

    expect(result.rows.every((row) => row.state === 'INVALID_INPUT')).toBe(true);
  });

  test('rejects cycles before a rule pack can be evaluated', () => {
    expect(() =>
      validateRulePack({
        ...niAct138,
        steps: [
          { ...niAct138.steps[0]!, id: 'first', inputs: [{ ref: 'second', required: true }] },
          { ...niAct138.steps[1]!, id: 'second', inputs: [{ ref: 'first', required: true }] },
        ],
      }),
    ).toThrowError(/STEP_DEPENDENCY_CYCLE/);
  });

  test('rejects second-person copy that would turn arithmetic into advice', () => {
    expect(() =>
      validateRulePack({
        ...niAct138,
        title: 'Your cheque deadline',
      }),
    ).toThrowError(/SECOND_PERSON_COPY/);
  });
});
