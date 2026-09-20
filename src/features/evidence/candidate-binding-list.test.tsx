import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { GuardedCandidate } from '@/ai/contracts';
import { CandidateBindingList } from './candidate-binding-list';

const candidate: GuardedCandidate = {
  eventKind: 'bank_information_received',
  evidenceQuote: 'Memo received 18 Jul 2026.',
  range: { start: 0, end: 27 },
  normalizedDate: '2026-07-18',
  dateSourceText: '18 Jul 2026',
  bindable: true,
  requiresConfirmation: true,
};

test('shows grounded evidence without binding it automatically', async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(
    <CandidateBindingList
      bindings={{}}
      candidates={[candidate]}
      onConfirm={onConfirm}
    />,
  );

  expect(screen.getByText('Memo received 18 Jul 2026.')).toBeVisible();
  expect(screen.getByText('18 Jul 2026')).toBeVisible();
  expect(onConfirm).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: /review and bind/i }));
  expect(onConfirm).toHaveBeenCalledWith(candidate);
});

test('never offers a bind action for out-of-scope evidence', () => {
  render(
    <CandidateBindingList
      bindings={{}}
      candidates={[
        {
          eventKind: 'OUT_OF_SCOPE',
          evidenceQuote: 'A phone call happened yesterday.',
          range: { start: 0, end: 32 },
          bindable: false,
          requiresConfirmation: false,
        },
      ]}
      onConfirm={() => undefined}
    />,
  );

  expect(screen.getByText('Outside this clock')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('requires a second action before replacing an existing binding', async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(
    <CandidateBindingList
      bindings={{
        bank_information_received: { date: '2026-07-17', origin: 'manual' },
      }}
      candidates={[candidate]}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole('button', { name: /replace binding/i }));
  expect(onConfirm).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: /confirm replacement/i }));
  expect(onConfirm).toHaveBeenCalledWith(candidate);
});
