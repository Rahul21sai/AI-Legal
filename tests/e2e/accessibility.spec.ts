import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
}

test('has no serious accessibility violations in empty and unbound states', async ({
  page,
}) => {
  await page.goto('/');
  await expectNoSeriousAxeViolations(page);
  await page.getByRole('radio', { name: /Cheque dishonour/i }).click();
  await page.getByLabel(/Bank information received/i).fill('2026-07-18');
  await expectNoSeriousAxeViolations(page);
});

test('method page is accessible and navigation remains keyboard reachable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /Skip to calculator/i })).toBeFocused();
  await page.getByRole('link', { name: 'Method' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: /How ProofClock separates AI from arithmetic/i }),
  ).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});

test('has no horizontal overflow at 375 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('radio', { name: /Cheque dishonour/i }).click();
  await page.getByLabel(/Bank information received/i).fill('2026-07-18');
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});
