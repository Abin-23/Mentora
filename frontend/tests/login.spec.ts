import { test, expect } from '@playwright/test';

test('Mentora user can login', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Sign In' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).fill('raichalraichal06@gmail.com');
  await page.getByRole('textbox', { name: 'name@domain.com' }).press('Tab');
  await page.getByRole('link', { name: 'Forgot?' }).press('Tab');
  await page.getByRole('textbox', { name: '••••••••' }).fill('123456');
  await page.getByRole('button', { name: 'Sign In arrow_forward' }).click();
});