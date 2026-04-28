import { test, expect } from '@playwright/test';

test('invalid email shows inline error and does not navigate', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('#signup');
  await form.locator('input[type=email]').fill('not-an-email');
  await form.locator('button[type=submit]').click();
  await expect(form.locator('[data-helper]')).toHaveClass(/helper--error/);
  expect(page.url()).toMatch(/\/$/);
});

test('valid email POSTs to subscribe URL with UTM params and navigates to /thanks', async ({ page }) => {
  await page.route('**/form_submissions/**', async (route) => {
    const req = route.request();
    expect(req.method()).toBe('POST');
    const body = req.postData() ?? '';
    expect(body).toContain('email=test%40example.com');
    expect(body).toContain('utm_source=pinterest');
    await route.fulfill({ status: 200, body: 'ok' });
  });

  await page.goto('/?utm_source=pinterest&utm_medium=pin');
  const form = page.locator('#signup');
  await form.locator('input[type=email]').fill('test@example.com');
  await form.locator('button[type=submit]').click();

  await page.waitForURL('**/thanks', { timeout: 5000 });
  await expect(page.locator('h1')).toContainText('Check your email');
});

test('subscribe error keeps user on page with error helper', async ({ page }) => {
  await page.route('**/form_submissions/**', async (route) => {
    await route.fulfill({ status: 500, body: 'server error' });
  });

  await page.goto('/');
  const form = page.locator('#signup');
  await form.locator('input[type=email]').fill('test@example.com');
  await form.locator('button[type=submit]').click();

  await expect(form.locator('[data-helper]')).toHaveClass(/helper--error/, { timeout: 5000 });
  expect(page.url()).toMatch(/\/$/);
});
