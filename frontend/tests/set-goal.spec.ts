import { test, expect } from '@playwright/test';

test('Mentora student can view dashboard and set a new learning goal', async ({ page }) => {
  // 1. Log In
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Sign In' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).fill('raichalraichal06@gmail.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('123456');
  await page.getByRole('button', { name: 'Sign In arrow_forward' }).click();

  // 2. Go to My Learning (since you are already enrolled!)
  await page.getByRole('link', { name: 'My Learning' }).click();
  
  // 3. Click "Continue Learning" on the first enrolled course
  await page.getByRole('button', { name: 'Continue Learning' }).first().click();

  // 4. Click the "Progress" or "Dashboard" tab in the course player
  // (Assuming there is a way to reach the Intelligence Dashboard from the Course Player)
  // If the Dashboard is located somewhere else, you can adjust this click.
  await page.getByRole('button', { name: 'Dashboard' }).click(); 

  // Verify we reached the Intelligence Dashboard
  await expect(page.getByRole('heading', { name: 'Intelligence Dashboard' })).toBeVisible();

  // 5. Create a new Learning Goal
  await page.getByRole('button', { name: '+ Add Goal' }).click();
  
  // Verify Modal opens
  await expect(page.getByRole('heading', { name: 'Create Learning Goal' })).toBeVisible();

  // 6. Fill out the Goal Form
  // Select "Complete Course" goal type
  await page.locator('select[name="goal_type"]').selectOption('COMPLETE_COURSE');
  
  // Fill Target Value
  await page.locator('input[name="target_value"]').fill('1');

  // Submit
  await page.getByRole('button', { name: 'Create Goal' }).click();

  // 7. Verify the goal appears in the list
  // The modal should close, so we verify the heading is gone
  await expect(page.getByRole('heading', { name: 'Create Learning Goal' })).not.toBeVisible();
  
  // Verify the newly created goal is rendered on the page
  await expect(page.getByText('COMPLETE COURSE').first()).toBeVisible();
});
