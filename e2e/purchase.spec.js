import { expect, test } from '@playwright/test';

// আগে `npm run seed:shop` ও `npm run seed:levels` চালানো থাকতে হবে
test('register, add to cart, check out, see the order', async ({ page }) => {
  const stamp = Date.now();
  await page.goto('/');

  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Mobile').fill(`017${String(stamp).slice(-8)}`);
  await page.getByLabel('Email address').fill(`e2e-${stamp}@example.com`);
  await page.getByLabel('Address').fill('Kushtia, Khulna');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByLabel('Confirm password').fill('password123');
  await page.getByRole('button', { name: /Create Client Account/ }).click();

  // রেজিস্টারের পর Home-এ, Dashboard বাটনসহ
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

  await page.goto('/shop');
  await page.getByRole('button', { name: 'Add To Cart' }).first().click();
  await page.getByRole('link', { name: /Continue to checkout/ }).click();

  await expect(page).toHaveURL(/\/checkout/);
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page).toHaveURL(/\/orders\/BSS-/);
  await expect(page.getByText('Cash on delivery', { exact: false }).first()).toBeVisible();
});

test('a logged-out visitor is sent to the login page from the dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
