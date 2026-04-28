import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', expect: 'Two cook days' },
  { path: '/about', expect: 'About' },
  { path: '/thanks', expect: 'Check your email' },
  { path: '/privacy', expect: 'Privacy policy' },
  { path: '/terms', expect: 'Terms of use' },
];

for (const r of ROUTES) {
  test(`${r.path} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(r.path);
    await expect(page.locator('h1')).toContainText(r.expect);
    expect(errors).toEqual([]);
  });
}

test('404 page renders for unknown routes', async ({ page }) => {
  const res = await page.goto('/this-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText("isn't on the menu");
});

test('homepage has OG and canonical meta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /Stock Up Dinners/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /og-default\.png$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /stockupdinners\.com/,
  );
});

test('sitemap is reachable', async ({ request }) => {
  const res = await request.get('/sitemap-index.xml');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain('<sitemapindex');
});

test('robots.txt is reachable', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain('Sitemap:');
});
