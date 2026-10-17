import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Per-course settings, the four layouts and the phone tab bar.

const sampleCourse = fileURLToPath(new URL('../../examples/sample-course.json', import.meta.url));

async function importSample(page: Page) {
  await page.goto('./#/import');
  await page.locator('input[type="file"]').setInputFiles(sampleCourse);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('main').getByText('Imported “Networking basics”.')).toBeVisible();
}

test('a course can have its own learning settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await importSample(page);

  await page.goto('./#/unit/networking-basics/m1');
  await page.getByRole('link', { name: 'Course settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings for Networking basics' })).toBeVisible();
  // Only learning options in course scope: no appearance or backup section.
  await expect(page.getByText('Appearance')).toHaveCount(0);
  await page.getByLabel('Recall before seeing the options').check();
  await expect(page.getByText('Own setting for this course')).toBeVisible();

  // The app settings are unchanged.
  await page.getByLabel('Settings for').selectOption('');
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByLabel('Recall before seeing the options')).not.toBeChecked();
  await expect(page.getByText('1 own setting')).toBeVisible();

  // Inside the course the options stay hidden until recalled.
  await page.goto('./#/exercise/networking-basics/m1-l1');
  for (let i = 0; i < 6; i += 1) {
    const prompt = (await page.locator('.question-prompt').first().innerText()).trim();
    if (prompt.includes('Netzwerkkarte')) break;
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Show the options' })).toBeVisible();

  // Back to following the app settings.
  await page.goto('./#/settings/networking-basics');
  await page.getByRole('button', { name: 'Use the app setting' }).click();
  await expect(page.getByLabel('Recall before seeing the options')).not.toBeChecked();
  await expect(page.getByText('Own setting for this course')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('layouts change what the screens show', async ({ page }) => {
  await importSample(page);

  await page.goto('./#/settings');
  await page.locator('.cf-layout-choice', { hasText: 'Simple' }).click();
  await page.goto('./#/home');
  await expect(page.getByText(/Course mastery: \d+%/)).toBeVisible();
  await expect(page.locator('.cf-profile-band')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Main screens' })).toBeVisible();
  await expect(page.locator('.cf-with-nav > .cf-learner-nav')).toBeHidden();
  await page.goto('./#/unit/networking-basics/m1');
  await expect(page.locator('.mastery-legend')).toHaveCount(0);

  await page.goto('./#/settings');
  await page.locator('.cf-layout-choice', { hasText: 'Detailed' }).click();
  await page.goto('./#/home');
  await expect(page.getByRole('list', { name: 'Today in numbers' })).toBeVisible();
  await page.goto('./#/unit/networking-basics/m1');
  await expect(page.getByText(/questions, about \d+ min of reading/)).toBeVisible();

  await page.goto('./#/settings');
  await page.locator('.cf-layout-choice', { hasText: 'Compact' }).click();
  await expect(page.getByText('Choose how much each screen shows')).toBeHidden();
  await page.goto('./#/home');
  await expect(page.locator('.cf-profile-band')).toHaveCount(0);
  await expect(page.locator('.cf-streakbar')).toBeVisible();
});

test('phones get a tab bar and no sideways scrolling', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await importSample(page);
  for (const hash of ['#/home', '#/library', '#/review', '#/stats', '#/settings', '#/unit/networking-basics/m1', '#/course/networking-basics/m1-l1']) {
    await page.goto('./' + hash);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, hash).toBeLessThanOrEqual(0);
  }
  await page.goto('./#/home');
  const tabs = page.getByRole('navigation', { name: 'Main screens' });
  await tabs.getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'Progress', exact: true })).toBeVisible();
  // Fields are at least 16px so the iPhone does not zoom in when one is tapped.
  await page.goto('./#/library');
  const size = await page.locator('#course-search').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
});
