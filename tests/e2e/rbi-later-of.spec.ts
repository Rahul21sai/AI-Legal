import { expect, test } from '@playwright/test';

test('uses the later RBI anchor and stops before the 2026 commencement date', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /RBI Ombudsman/i }).click();
  await page.getByLabel(/Complaint sent to regulated entity/i).fill('2026-07-01');
  await page.getByLabel(/Last communication from regulated entity/i).fill('2026-08-10');

  await expect(
    page.getByRole('row', { name: /Later available window anchor.*10 Aug 2026/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: /RB-IOS 2026 period boundary.*08 Nov 2026/i }),
  ).toBeVisible();

  await page.getByLabel(/Complaint sent to regulated entity/i).fill('2026-06-30');
  await expect(page.getByText('COVERAGE LIMIT')).toBeVisible();
  await expect(
    page.getByText('The reviewed RB-IOS 2026 pack starts on 1 July 2026.'),
  ).toBeVisible();
  await expect(page.getByText('08 Nov 2026')).toHaveCount(0);
});
