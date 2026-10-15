import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// One full study session on the sample course: open a lesson, practise its skill (getting one
// question wrong on purpose), see mastery move on the unit page, then clear the mistake in Review.
// Written before the M2 redesign so the redesign can't quietly break the learning loop.

const sampleCourse = fileURLToPath(new URL('../../examples/sample-course.json', import.meta.url));

/** Correct answers for the sample course's lesson 1 questions, keyed by a phrase in the prompt. */
const LESSON_1 = [
  { match: 'Netzwerkkarte', correct: 'MAC-Adresse', wrong: 'IP-Adresse' },
  { match: 'Switch', correct: 'True', wrong: 'False' }
];

async function importSample(page: Page) {
  await page.goto('./#/import');
  await page.locator('input[type="file"]').setInputFiles(sampleCourse);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('main').getByText('Imported “Networking basics”.')).toBeVisible();
}

/**
 * Answers the quiz on screen until its results appear. The question matching `miss` is answered
 * wrong and skipped every time it shows up (practice sets can repeat questions), so it stays a
 * mistake; everything else is answered correctly.
 */
async function runQuiz(page: Page, miss?: string) {
  for (let step = 0; step < 20; step += 1) {
    if (await page.getByRole('region', { name: 'Results' }).isVisible()) return;
    // A repeat of a question already answered correctly in this set only offers "Next".
    if (await page.locator('.question[data-state="right"]').isVisible()) {
      await page.getByRole('button', { name: /Next question|See results/ }).click();
      continue;
    }
    const prompt = (await page.locator('.question-prompt').first().innerText()).trim();
    const question = LESSON_1.find((q) => prompt.includes(q.match));
    if (!question) throw new Error(`Unexpected question: ${prompt}`);

    const wrong = question.match === miss;
    await page.getByRole('radio', { name: wrong ? question.wrong : question.correct, exact: true }).click();
    await page.getByRole('button', { name: 'Check', exact: true }).click();

    if (wrong) {
      await expect(page.getByRole('status').filter({ hasText: /try again/i }).first()).toBeVisible();
      await page.getByRole('button', { name: 'Skip', exact: true }).click();
    } else {
      await page.getByRole('button', { name: /Next question|See results/ }).click();
    }
  }
  throw new Error('The quiz never reached its results.');
}

test('study session: lesson, practice, mastery, review', async ({ page }) => {
  // Any script error fails the test: a crash can leave the previous screen showing.
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await importSample(page);

  // Open the unit and the first lesson.
  await page.goto('./#/unit/networking-basics/m1');
  await expect(page.getByText('Unit mastery: 0%')).toBeVisible();
  await page.getByRole('button', { name: 'What is a network?', exact: true }).click();
  await expect(page).toHaveURL(/#\/course\/networking-basics\/m1-l1/);
  await expect(page.getByRole('heading', { name: 'What is a network?', level: 1 })).toBeVisible();

  // Practise the lesson's skill and miss one question.
  await page.goto('./#/exercise/networking-basics/m1-l1');
  await expect(page.locator('.cf-exercise-head')).toContainText('Practise');
  await runQuiz(page, 'Netzwerkkarte');
  await expect(page.getByRole('region', { name: 'Results' })).toBeVisible();

  // Mastery moved: the skill square is no longer "Not started".
  await page.goto('./#/unit/networking-basics/m1');
  await expect(page.getByRole('img', { name: /^What is a network\?: (?!Not started)/ })).toBeVisible();

  // The missed question waits in Review; answering it correctly clears it.
  await page.goto('./#/review');
  await expect(page.getByText('Welche Adresse ist fest an die Netzwerkkarte gebunden?')).toBeVisible();
  await page.getByRole('button', { name: 'Practise mistakes' }).click();
  await runQuiz(page);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('No mistakes to review.')).toBeVisible();
  expect(errors).toEqual([]);
});
