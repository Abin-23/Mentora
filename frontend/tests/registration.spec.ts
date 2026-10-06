import { test, expect } from '@playwright/test';

test('Mentora user registration', async ({ page }) => {
  const email = `testuser${Date.now()}@gmail.com`;

  await page.goto('http://localhost:5173/');

  await page.getByRole('link', { name: 'Sign In' }).click();

  await page.getByRole('link', { name: 'Create Account' }).click();

  await page
    .getByRole('textbox', { name: 'Jane Doe' })
    .fill('Test User');

  await page
    .getByRole('textbox', { name: 'name@domain.com' })
    .fill(email);

  await page
    .getByRole('textbox', { name: '••••••••' })
    .first()
    .fill('Test@123');

  await page
    .getByRole('textbox', { name: '••••••••' })
    .nth(1)
    .fill('Test@123');

  await page
    .getByRole('button', { name: 'Initialize ID person_add' })
    .click();

  await expect(page).not.toHaveURL(/register|signup/);
});