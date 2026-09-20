import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProofClockWorkbench } from './proofclock-workbench';

test('shows unbound receipt rows and recomputes after a manual receipt date', async () => {
  const user = userEvent.setup();
  render(<ProofClockWorkbench />);

  await user.click(screen.getByRole('radio', { name: /cheque dishonour/i }));
  fireEvent.change(screen.getByLabelText(/bank information received/i), {
    target: { value: '2026-07-18' },
  });
  fireEvent.change(screen.getByLabelText(/demand notice dispatched/i), {
    target: { value: '2026-08-02' },
  });

  expect(screen.getByText('17 Aug 2026')).toBeVisible();
  expect(screen.getAllByText('UNBOUND').length).toBeGreaterThan(0);
  expect(screen.getByText(/dispatch does not bind receipt/i)).toBeVisible();

  fireEvent.change(screen.getByLabelText(/demand notice received by drawer/i), {
    target: { value: '2026-08-20' },
  });

  expect(
    screen.getByRole('row', { name: /payment-period boundary.*04 sep 2026/i }),
  ).toBeVisible();
  expect(
    screen.getByRole('row', { name: /next-day cause-of-action date.*05 sep 2026/i }),
  ).toBeVisible();
  expect(
    screen.getByRole('row', { name: /complaint-period boundary.*05 oct 2026/i }),
  ).toBeVisible();
});

test('renders the RBI coverage limit instead of applying the pack retroactively', async () => {
  const user = userEvent.setup();
  render(<ProofClockWorkbench />);

  await user.click(screen.getByRole('radio', { name: /rbi ombudsman/i }));
  fireEvent.change(screen.getByLabelText(/complaint sent to regulated entity/i), {
    target: { value: '2026-06-30' },
  });

  expect(screen.getByText('COVERAGE LIMIT')).toBeVisible();
  expect(
    screen.getByText('The reviewed RB-IOS 2026 pack starts on 1 July 2026.'),
  ).toBeVisible();
  expect(screen.queryByText('29 Oct 2026')).not.toBeInTheDocument();
});

test('does not present date controls before a clock is selected', () => {
  render(<ProofClockWorkbench />);

  expect(screen.queryByLabelText(/bank information received/i)).not.toBeInTheDocument();
  expect(
    screen.getByText(/select a clock to reveal its named anchors/i),
  ).toBeVisible();
});
