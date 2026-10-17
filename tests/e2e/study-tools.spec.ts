import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Study tools: the learning settings (study styles), recall before options, the brain dump and
// "explain it simply" after a lesson, and the calibration card on Progress.

const sampleCourse = fileURLToPath(new URL('../../examples/sample-course.json', import.meta.url));

async function importSample(page: Page) {
  await page.goto('./#/import');
  await page.locator('input[type="file"]').setInputFiles(sampleCourse);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('main').getByText('Imported “Networking basics”.')).toBeVisible();
}

test('study styles set the learning options, and recall-first hides the options', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await importSample(page);

  await page.goto('./#/settings');
  await expect(page.getByRole('group', { name: 'Study style' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Balanced' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Exam prep' }).click();
  await expect(page.getByRole('button', { name: 'Exam prep' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Recall before seeing the options')).toBeChecked();
  await expect(page.getByLabel('Offer hints and the full solution')).not.toBeChecked();

  // Practise: the multiple-choice options stay hidden until "Show the options".
  await page.goto('./#/exercise/networking-basics/m1-l1');
  for (let i = 0; i < 6; i += 1) {
    const prompt = (await page.locator('.question-prompt').first().innerText()).trim();
    if (prompt.includes('Netzwerkkarte')) break;
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await expect(page.getByRole('radio', { name: 'MAC-Adresse', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Get a hint' })).toHaveCount(0);
  await page.getByPlaceholder('Your answer from memory (optional)').fill('MAC');
  await page.getByRole('button', { name: 'Show the options' }).click();
  await page.getByRole('radio', { name: 'MAC-Adresse', exact: true }).click();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByText('From memory you wrote: MAC')).toBeVisible();
  expect(errors).toEqual([]);
});

test('brain dump and explain it simply after a lesson', async ({ page }) => {
  const errors: string[] = [];
  // WebKit reports the lesson's YouTube preview being cut off by the reload as a NetworkError.
  page.on('pageerror', (err) => {
    if (!err.message.startsWith('NetworkError')) errors.push(err.message);
  });
  await importSample(page);
  await page.goto('./#/course/networking-basics/m1-l1');

  const card = page.locator('.cf-reflect');
  await expect(card.getByRole('heading', { name: 'Reflect on this lesson' })).toBeVisible();
  await card.getByPlaceholder('Everything you remember...').fill('A MAC address is hardware, used for local delivery.');
  await card.getByRole('button', { name: 'Compare with the key points' }).click();
  await expect(card.getByText(/You remembered 1 of 2 key points/)).toBeVisible();
  await expect(card.getByRole('checkbox').first()).toBeChecked();

  // The dump is saved: it is still there after a reload.
  await page.reload();
  await expect(page.locator('.cf-reflect').getByText(/You remembered 1 of 2 key points/)).toBeVisible();

  await page.locator('.cf-reflect').getByRole('tab', { name: 'Explain it simply' }).click();
  await page.locator('.cf-reflect').getByPlaceholder('Imagine you explain it to a friend...').fill('A network connects computers so they can talk.');
  await page.locator('.cf-reflect').getByRole('button', { name: 'Save my explanation' }).click();
  await expect(page.locator('.cf-reflect').getByRole('button', { name: 'Saved' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the Progress page explains how well confidence matches results', async ({ page }) => {
  await importSample(page);
  await page.goto('./#/stats');
  await expect(page.getByRole('heading', { name: 'How well do you know what you know?' })).toBeVisible();
  await expect(page.getByText(/at least 10 answers/)).toBeVisible();
});
