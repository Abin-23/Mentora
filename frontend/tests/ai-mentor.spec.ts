import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Sign In' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).fill('raichalraichal06@gmail.com');
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill('123456');
  await page.getByRole('button', { name: 'Sign In arrow_forward' }).click();
  await page.getByRole('link', { name: 'local_library Courses' }).click();
  await page.getByRole('link', { name: 'psychology AI Mentor' }).click();
  await page.getByRole('textbox', { name: 'Ask about Python Programming' }).click();
  await page.getByRole('textbox', { name: 'Ask about Python Programming' }).fill('what is python');
  await page.getByRole('textbox', { name: 'Ask about Python Programming' }).press('Enter');
});