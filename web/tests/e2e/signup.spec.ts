import { test, expect } from '@playwright/test';

test('hero CTA links to Beehiiv subscribe page', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('#signup a[data-signup-link]').first();
  const href = await cta.getAttribute('href');
  expect(href).toMatch(/^https:\/\/stockupdinners\.beehiiv\.com\/subscribe/);
});

test('UTM params on page URL are appended to the subscribe link', async ({ page }) => {
  await page.goto('/?utm_source=pinterest&utm_medium=pin&utm_campaign=launch');
  const cta = page.locator('#signup a[data-signup-link]').first();
  // Wait briefly for the DOMContentLoaded UTM append to run
  await expect.poll(async () => await cta.getAttribute('href')).toMatch(/utm_source=pinterest/);
  const href = await cta.getAttribute('href');
  expect(href).toContain('utm_medium=pin');
  expect(href).toContain('utm_campaign=launch');
  expect(href).toContain('https://stockupdinners.beehiiv.com/subscribe');
});

test('closing CTA also links to Beehiiv subscribe page', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('#signup-closing a[data-signup-link]').first();
  const href = await cta.getAttribute('href');
  expect(href).toMatch(/^https:\/\/stockupdinners\.beehiiv\.com\/subscribe/);
});
