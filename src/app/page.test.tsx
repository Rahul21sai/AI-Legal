import { render, screen } from '@testing-library/react';

import Page from './page';

test('introduces ProofClock as arithmetic controlled by the user', () => {
  render(<Page />);

  expect(
    screen.getByRole('heading', { level: 1, name: 'ProofClock' }),
  ).toBeVisible();
  expect(screen.getByText(/you choose the trigger/i)).toBeVisible();
});
