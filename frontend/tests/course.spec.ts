import { test, expect } from '@playwright/test';

test('Mentora course access and logout', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await page.getByRole('link', { name: 'Sign In' }).click();

  await page
    .getByRole('textbox', { name: 'name@domain.com' })
    .fill('testuser@gmail.com');

  await page
    .getByRole('textbox', { name: '••••••••' })
    .fill('Test@123');

  await page.getByRole('button', { name: 'Sign In arrow_forward' }).click();

  await expect(page).toHaveURL(/dashboard/);

  await page.getByRole('link', { name: 'local_library Courses' }).click();

  await page.getByRole('link', { name: 'webhook Advanced Web' }).click();

  await page.getByRole('link', { name: 'Python Programming' }).click();

  await expect(page.getByText('ENROLLED')).toBeVisible();

  await page.getByRole('button', { name: 'logout Logout' }).click();

  await expect(page).toHaveURL(/login|\/$/);
});