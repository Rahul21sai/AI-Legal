import { render, screen } from '@testing-library/react';

import MethodPage from './page';

test('explains the extract-bind-compute boundary and privacy model', () => {
  render(<MethodPage />);

  expect(
    screen.getByRole('heading', {
      level: 1,
      name: /how proofclock separates ai from arithmetic/i,
    }),
  ).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Extract' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Bind' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Compute' })).toBeVisible();
  expect(screen.getByText(/gemini is optional/i)).toBeVisible();
  expect(screen.getByText(/proofclock does not retain case data/i)).toBeVisible();
  expect(screen.getByText(/third-party structured mirror/i)).toBeVisible();
  expect(screen.getByRole('link', { name: /open the calculator/i })).toHaveAttribute(
    'href',
    '/',
  );
});

test('maps Gemini integration to inspectable source files', () => {
  render(<MethodPage />);

  expect(screen.getByText('src/ai/prompts/extract-events.v1.ts')).toBeVisible();
  expect(screen.getByText('src/ai/gemini-client.ts')).toBeVisible();
  expect(screen.getByText('src/ai/guard.ts')).toBeVisible();
  expect(screen.getByText('src/app/api/extract-events/route.ts')).toBeVisible();
});
