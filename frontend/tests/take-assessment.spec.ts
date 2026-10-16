import { test, expect } from '@playwright/test';

test('Mentora student can take and submit an assessment', async ({ page, context, browserName }) => {
  // Firefox and WebKit don't support automated camera permissions via Playwright's API.
  test.skip(browserName !== 'chromium', 'Camera/Mic permissions are only supported in Chromium');

  // Grant camera/mic permissions to the test context
  await context.grantPermissions(['camera', 'microphone']);

  // 1. Perform Login First
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Sign In' }).click();
  await page.getByRole('textbox', { name: 'name@domain.com' }).fill('raichalraichal06@gmail.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('123456');
  await page.getByRole('button', { name: 'Sign In arrow_forward' }).click();

  // Wait to ensure we are logged in
  await expect(page.getByText('Welcome back')).toBeVisible();

  // 2. Navigate Directly to the Valid Assessment!
  await page.goto('http://localhost:5173/assessments/3/take');

  // 3. Handle Assessment Setup
  // If the assessment was already started previously, it skips the setup screen.
  // We check if the "Submit Assessment" button is already visible.
  const submitButton = page.getByRole('button', { name: 'Submit Assessment' });
  
  try {
    // Wait for either the Setup screen OR the Submit button to appear
    await expect(submitButton.or(page.getByRole('heading', { name: 'Assessment Setup' }))).toBeVisible({ timeout: 15000 });
  } catch (e) {
    const pageText = await page.locator('body').innerText();
    console.log("❌ PAGE FAILED TO LOAD EXPECTED ELEMENTS!");
    console.log("Here is what the page is actually displaying:");
    console.log("-------------------------------------------");
    console.log(pageText);
    console.log("-------------------------------------------");
    throw new Error("Assessment screen didn't load properly. Check the terminal output above to see what is on the screen!");
  }

  const isAlreadyStarted = await submitButton.isVisible();

  if (!isAlreadyStarted) {
    const allowButton = page.getByRole('button', { name: 'Allow Camera & Microphone' });
    if (await allowButton.isVisible()) {
      await allowButton.click();
    }
    const startButton = page.getByRole('button', { name: 'Start Assessment' });
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    await startButton.click();
  }

  // Wait for the questions to be ready
  await expect(submitButton).toBeVisible();

  // 4. Answer a Question
  const firstRadio = page.locator('input[type="radio"]').first();
  await firstRadio.check();

  // 5. Handle the Confirmation Dialog (window.confirm)
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('Are you sure you want to submit');
    await dialog.accept();
  });

  // 6. Submit the Assessment
  await page.getByRole('button', { name: 'Submit Assessment' }).click();

  // 7. Wait for the Processing Pipeline to finish
  await expect(page.getByText('Assessment Analysis Complete', { exact: false })).toBeVisible({ timeout: 15000 });
  
  // Verify that the "Continue Learning" button appears
  await expect(page.getByRole('button', { name: 'Continue Learning' })).toBeVisible();
});
