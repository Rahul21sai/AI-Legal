import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ExtractionTrace } from '@/ai/extract-service';

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

test('binds a reviewed Gemini candidate and keeps the manual field editable', async () => {
  const user = userEvent.setup();
  const trace: ExtractionTrace = {
    prompt: {
      version: 'extract-events.v1',
      model: 'gemini-3.8-flash',
      thinkingLevel: 'low',
      systemInstruction: 'Boundary',
      userInput: 'Memo received 18 Jul 2026.',
      responseJsonSchema: { type: 'object' },
    },
    rawResponse: { candidates: [] },
    accepted: [
      {
        eventKind: 'bank_information_received',
        evidenceQuote: 'Memo received 18 Jul 2026.',
        range: { start: 0, end: 27 },
        normalizedDate: '2026-07-18',
        dateSourceText: '18 Jul 2026',
        bindable: true,
        requiresConfirmation: true,
      },
    ],
    rejected: [],
  };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, requestId: 'req-3', trace }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
  render(<ProofClockWorkbench />);
  await user.click(screen.getByRole('radio', { name: /cheque dishonour/i }));
  await user.type(
    screen.getByLabelText(/short evidence text/i),
    'Memo received 18 Jul 2026.',
  );
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: /extract dated events/i }));
  await user.click(screen.getByRole('button', { name: /review and bind/i }));

  expect(screen.getByLabelText(/bank information received/i)).toHaveValue('2026-07-18');
  expect(screen.getByText(/confirmed from extracted evidence/i)).toBeVisible();
  vi.unstubAllGlobals();
});
