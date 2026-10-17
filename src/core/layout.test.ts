import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUT_PARTS, lessonQuestionCount, readingMinutes, shows } from './layout.ts';
import { COURSE_SETTING_KEYS, defaultSettings, mergeSettings, normalizeOverrides, patchOverrides, settingsFor } from './settings.ts';
import type { Lesson } from './types.ts';

test('a course setting wins over the app setting only inside that course', () => {
  const settings = { ...defaultSettings(), courseOverrides: { exam: { recallFirst: true, desiredRetention: 0.95 } } };
  assert.equal(settingsFor(settings, 'exam').recallFirst, true);
  assert.equal(settingsFor(settings, 'exam').desiredRetention, 0.95);
  assert.equal(settingsFor(settings, 'other').recallFirst, false);
  assert.equal(settingsFor(settings, null).desiredRetention, 0.9);
  // App-only settings never come from a course.
  assert.equal(settingsFor(settings, 'exam').dailyReviewLimit, 20);
});

test('course overrides keep only known keys with valid values', () => {
  assert.deepEqual(normalizeOverrides({ recallFirst: true, theme: 'dark', gatingMode: 'nope', desiredRetention: 2 }), {
    recallFirst: true,
    desiredRetention: 0.95
  });
  assert.deepEqual(normalizeOverrides({ allowHints: true }), { allowHints: true });
  assert.deepEqual(normalizeOverrides('x'), {});
  assert.ok(!COURSE_SETTING_KEYS.includes('dailyReviewLimit' as never));
});

test('changing a course setting pins it, and null hands it back to the app', () => {
  let own = patchOverrides(undefined, { askConfidence: false, explanationLevel: 'simple' });
  assert.deepEqual(own, { askConfidence: false, explanationLevel: 'simple' });
  own = patchOverrides(own, { askConfidence: null });
  assert.deepEqual(own, { explanationLevel: 'simple' });
  assert.deepEqual(patchOverrides(own, { fontSize: 20 } as never), { explanationLevel: 'simple' });
});

test('saved settings bring back layout, screen and course overrides safely', () => {
  const merged = mergeSettings({ layout: 'compact', screenMode: 'desktop', courseOverrides: { a: { sounds: true }, b: { bad: 1 }, c: 'x' } });
  assert.equal(merged.layout, 'compact');
  assert.equal(merged.screenMode, 'desktop');
  assert.deepEqual(merged.courseOverrides, { a: { sounds: true } });
  const old = mergeSettings({ theme: 'dark' });
  assert.equal(old.layout, 'standard');
  assert.equal(old.screenMode, 'auto');
  assert.deepEqual(old.courseOverrides, {});
  assert.equal(mergeSettings({ layout: 'huge' }).layout, 'standard');
});

test('each layout really shows a different set of parts', () => {
  const sets = (['standard', 'simple', 'detailed', 'compact'] as const).map((layout) =>
    (Object.keys(LAYOUT_PARTS) as (keyof typeof LAYOUT_PARTS)[]).filter((part) => shows(layout, part)).join(',')
  );
  assert.equal(new Set(sets).size, 4);
  assert.equal(shows('simple', 'sidebars'), false);
  assert.equal(shows('simple', 'tabBarEverywhere'), true);
  assert.equal(shows('detailed', 'extraStats'), true);
  assert.equal(shows('compact', 'hints'), false);
});

test('reading time and question count for the detailed layout', () => {
  const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
  const lesson: Lesson = {
    id: 'l',
    title: 'L',
    blocks: [
      { id: 't', type: 'text', levels: { normal: words(360), simple: words(90) } },
      { id: 'w', type: 'quiz', pretest: true, questions: [{ id: 'p', kind: 'true-false', prompt: '?', answer: true }] },
      { id: 'q', type: 'quiz', questions: [{ id: 'a', kind: 'true-false', prompt: '?', answer: true }, { id: 'b', kind: 'true-false', prompt: '?', answer: false }] }
    ]
  };
  assert.equal(readingMinutes(lesson, 'en'), 2);
  assert.equal(readingMinutes(lesson, 'en', 'simple'), 1);
  assert.equal(lessonQuestionCount(lesson), 2);
});
