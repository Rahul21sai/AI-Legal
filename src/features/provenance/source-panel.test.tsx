import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SourceSnapshot } from '@/sources/contracts';
import { SourcePanel } from './source-panel';

const mirror: SourceSnapshot = {
  id: 'ni-act-138-b',
  instrumentTitle: 'The Negotiable Instruments Act, 1881',
  provision: 'Section 138(b)',
  excerpts: ['within thirty days of receipt of information from the bank'],
  sourceUrl: 'https://indiacode.ecourtsindia.com/api/v1/ni-act/section/138',
  sourceFormat: 'ecourts-section-json',
  publisher: 'eCourtsIndia',
  authority: 'third-party-mirror',
  retrievedAt: '2026-09-20',
  attribution: 'IndiaCode by eCourtsIndia, CC BY 4.0',
  authorityNote: 'The Gazette of India or official text prevails.',
  normalizedSha256: 'hash',
};

afterEach(() => vi.unstubAllGlobals());

test('labels third-party provenance and keeps the reviewed excerpt visible', () => {
  render(<SourcePanel snapshots={[mirror]} />);

  expect(screen.getByText('Third-party structured mirror')).toBeVisible();
  expect(screen.getByText(mirror.excerpts[0]!)).toBeVisible();
  expect(screen.getByText(/gazette of india or official text prevails/i)).toBeVisible();
  expect(screen.getByRole('link', { name: /open source/i })).toHaveAttribute(
    'href',
    mirror.sourceUrl,
  );
});

test('reports changed live content without replacing the snapshot', async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({ state: 'CHANGED', sourceId: 'ni-act-138-b' }),
    ),
  );
  render(<SourcePanel snapshots={[mirror]} />);

  await user.click(screen.getByRole('button', { name: /check live source/i }));

  expect(
    await screen.findByText(/source changed; reviewed snapshot not replaced/i),
  ).toBeVisible();
  expect(screen.getByText(mirror.excerpts[0]!)).toBeVisible();
});

test('retains the snapshot when the live source times out', async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({ state: 'TIMEOUT', sourceId: 'ni-act-138-b' }),
    ),
  );
  render(<SourcePanel snapshots={[mirror]} />);

  await user.click(screen.getByRole('button', { name: /check live source/i }));
  expect(await screen.findByText(/snapshot retained/i)).toBeVisible();
});
