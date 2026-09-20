import { expect, test } from '@playwright/test';

test('keeps missing receipt unbound, then recomputes entirely in the browser', async ({
  page,
}) => {
  const extractionRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/extract-events')) extractionRequests.push(request.url());
  });

  await page.goto('/');
  await page.getByRole('radio', { name: /Cheque dishonour/i }).click();
  await page.getByLabel(/Bank information received/i).fill('2026-07-18');
  await page.getByLabel(/Demand notice dispatched/i).fill('2026-08-02');

  await expect(
    page.getByRole('row', { name: /Notice-period boundary.*17 Aug 2026/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: /Payment-period boundary.*UNBOUND/i }),
  ).toBeVisible();

  await page.getByLabel(/Demand notice received by drawer/i).fill('2026-08-20');

  await expect(
    page.getByRole('row', { name: /Payment-period boundary.*04 Sep 2026/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: /Next-day cause-of-action date.*05 Sep 2026/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: /Complaint-period boundary.*05 Oct 2026/i }),
  ).toBeVisible();
  expect(extractionRequests).toEqual([]);
});
