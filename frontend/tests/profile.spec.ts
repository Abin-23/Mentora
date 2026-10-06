import { test, expect } from '@playwright/test';

test('Mentora user profile update', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Start Learning' }).click();
  await page.getByRole('link', { name: 'Sign In' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).fill('raichalraichal06@gmail.com');
  await page.getByRole('textbox', { name: 'name@domain.com' }).press('Tab');
  await page.getByRole('link', { name: 'Forgot?' }).press('Tab');
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill('123456');
  await page.getByRole('button', { name: 'Sign In arrow_forward' }).click();
  await page.getByRole('link', { name: 'person Profile' }).click();
  await page.getByLabel('Phone number country').selectOption('IN');
  await page.getByRole('textbox', { name: '+1 (555) 000-' }).click();
  await page.getByRole('textbox', { name: '+1 (555) 000-' }).fill('+91 99954 85726');
  await page.getByRole('button', { name: 'Save Changes' }).click();
});