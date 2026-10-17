import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editDistance, gradeWithTypos } from './grade.ts';
import { coveragePercent, dumpFeedbackPrompt, feynmanPrompt, guessCovered, lessonKeyPoints, longWords, unitKeyPoints } from './reflect.ts';
import { calibration } from './calibration.ts';
import { interleaveExtras, mixIntoSet } from './exercise.ts';
import { applyCard, scheduleCard } from './srs.ts';
import { STUDY_STYLES, currentStudyStyle, defaultSettings, mergeSettings } from './settings.ts';
import { normalizeProgress } from './progress.ts';
import type { Course, CourseMastery, Lesson, MistakeLogEntry, Question } from './types.ts';

const NOW = new Date('2026-10-17T10:00:00.000Z');

const short = (answer: string | string[]): Question => ({ id: 'q', kind: 'short-answer', prompt: '?', answer });

test('edit distance counts swaps as one edit', () => {
  assert.equal(editDistance('router', 'router'), 0);
  assert.equal(editDistance('router', 'rotuer'), 1);
  assert.equal(editDistance('router', 'routr'), 1);
  assert.equal(editDistance('abc', 'xyz'), 3);
});

test('a small typo counts only when allowed, and never on short words or numbers', () => {
  assert.deepEqual(gradeWithTypos(short('Subnetz'), 'Subentz', true), { correct: true, typoOf: 'Subnetz' });
  assert.equal(gradeWithTypos(short('Subnetz'), 'Subentz', false).correct, false);
  assert.equal(gradeWithTypos(short('car'), 'cat', true).correct, false);
  assert.equal(gradeWithTypos(short('192.168'), '192.169', true).correct, false);
  assert.equal(gradeWithTypos(short(['DNS', 'Domain Name System']), 'Domain Name Sytsem', true).correct, true);
  assert.equal(gradeWithTypos(short('Subnetz'), 'Subnetz', true).typoOf, undefined);
  const mc: Question = { id: 'm', kind: 'multiple-choice', prompt: '?', options: ['a', 'b'], answer: 1 };
  assert.equal(gradeWithTypos(mc, 0, true).correct, false);
});

const lesson: Lesson = {
  id: 'l1',
  title: 'Subnetting',
  goal: 'Calculate the network address.',
  blocks: [
    { id: 't', type: 'text', levels: { normal: 'A subnet mask splits an address into network and host part.' } },
    { id: 'k', type: 'callout', style: 'keypoint', markdown: '- The **subnet mask** separates network and host bits.\n- The network address has all host bits set to 0.\n- [Broadcast](https://x) has all host bits set to 1.' }
  ]
};

test('key points come from keypoint bullets, plain text only', () => {
  assert.deepEqual(lessonKeyPoints(lesson, 'en'), [
    'The subnet mask separates network and host bits.',
    'The network address has all host bits set to 0.',
    'Broadcast has all host bits set to 1.'
  ]);
  const noCallout: Lesson = { ...lesson, blocks: [lesson.blocks[0]!] };
  assert.deepEqual(lessonKeyPoints(noCallout, 'en'), ['Calculate the network address.']);
  const bare: Lesson = { ...noCallout, goal: undefined };
  assert.deepEqual(lessonKeyPoints(bare, 'en'), ['A subnet mask splits an address into network and host part.']);
  assert.equal(unitKeyPoints({ id: 'm1', title: 'U', lessons: [lesson, lesson] }, 'en').length, 3);
});

test('a brain dump pre-ticks the points it covers', () => {
  const points = lessonKeyPoints(lesson, 'en');
  const covered = guessCovered('the subnet mask separates network from host bits. broadcast is all ones', points);
  // Point 1 (the network ADDRESS) is not mentioned; shared words like "host bits" do not count.
  assert.deepEqual(covered, [0, 2]);
  assert.deepEqual(guessCovered('', points), []);
  assert.equal(coveragePercent([0, 2], 3), 67);
  assert.equal(coveragePercent(undefined, 0), 0);
});

test('reflection prompts carry the learner text and the language', () => {
  const dump = dumpFeedbackPrompt('Subnetting', 'lesson text', 'my dump', 'de');
  assert.ok(dump.includes('my dump') && dump.includes('lesson text') && dump.includes('German'));
  const feyn = feynmanPrompt('Subnetting', 'my explanation', 'en');
  assert.ok(feyn.includes('12-year-old') && feyn.includes('my explanation') && feyn.includes('English'));
  assert.deepEqual(longWords('Netzwerkadressen and Subnetzmaske are hard'), ['netzwerkadressen']);
});

function entry(confidence: 'sure' | 'unsure' | 'guess' | undefined, correct: boolean): MistakeLogEntry {
  return { questionId: 'q', skillId: 's', moduleId: null, given: 1, correct, at: '', ...(confidence ? { confidence } : {}) };
}

test('calibration compares confidence with results', () => {
  const record = (entries: MistakeLogEntry[]): CourseMastery => ({ courseId: 'c', skills: {}, mistakes: entries, updatedAt: '' });
  const over = calibration([record([...Array(6)].map(() => entry('sure', false)).concat([...Array(6)].map(() => entry('sure', true))))]);
  assert.equal(over.advice, 'overconfident');
  assert.equal(over.rows[0]?.percent, 50);
  const good = calibration([record([...Array(10)].map(() => entry('sure', true)))]);
  assert.equal(good.advice, 'calibrated');
  const under = calibration([record([...Array(6)].map(() => entry('sure', true)).concat([...Array(6)].map(() => entry('unsure', true))))]);
  assert.equal(under.advice, 'underconfident');
  assert.equal(calibration([record([entry('sure', true), entry(undefined, false)])]).advice, 'not-enough');
});

function course(lessons: number, perLesson: number): Course {
  return {
    schemaVersion: 2,
    id: 'c1',
    title: 'c',
    modules: [
      {
        id: 'm1',
        title: 'M',
        lessons: Array.from({ length: lessons }, (_, l) => ({
          id: `l${l + 1}`,
          title: `L${l + 1}`,
          blocks: [{ id: `b${l}`, type: 'quiz', questions: Array.from({ length: perLesson }, (_, q): Question => ({ id: `l${l + 1}q${q + 1}`, kind: 'true-false', prompt: '?', answer: true })) }]
        }))
      }
    ]
  };
}

test('interleaving only mixes in earlier, already answered questions, due ones first', () => {
  const c = course(3, 3);
  let cards = applyCard(undefined, 'l1q1', 'l1', { correct: true, usedHint: false }, NOW);
  cards = applyCard(cards, 'l1q2', 'l1', { correct: false, usedHint: false }, NOW);
  cards = applyCard(cards, 'l3q1', 'l3', { correct: true, usedHint: false }, NOW);
  const mastery: CourseMastery = { courseId: 'c1', skills: {}, mistakes: [], updatedAt: '', cards };
  const later = new Date(NOW.getTime() + 2 * 86_400_000);
  const extras = interleaveExtras(c, 'l2', { mastery, now: later, count: 2 });
  assert.deepEqual(extras.map((q) => q.id), ['l1q2', 'l1q1']);
  assert.deepEqual(interleaveExtras(c, 'l1', { mastery, now: later }), []);
  assert.deepEqual(interleaveExtras(c, 'l2', { now: later }), []);
});

test('mixing keeps the set size and spreads the extras', () => {
  const q = (id: string): Question => ({ id, kind: 'true-false', prompt: '?', answer: true });
  const mixed = mixIntoSet([q('a'), q('b'), q('c'), q('d'), q('e')], [q('x'), q('y')]);
  assert.equal(mixed.length, 5);
  assert.deepEqual(mixed.map((m) => m.id), ['a', 'x', 'b', 'y', 'c']);
  assert.deepEqual(mixIntoSet([q('a')], [q('a')]).map((m) => m.id), ['a']);
});

test('aiming for higher retention brings reviews back sooner', () => {
  const relaxed = scheduleCard(undefined, 'q', 's', { correct: true, usedHint: false }, NOW, 0.8);
  const exam = scheduleCard(undefined, 'q', 's', { correct: true, usedHint: false }, NOW, 0.95);
  assert.ok(new Date(exam.due) < new Date(relaxed.due));
});

test('study styles round-trip and old settings get safe defaults', () => {
  for (const [name, patch] of Object.entries(STUDY_STYLES)) {
    assert.equal(currentStudyStyle({ ...defaultSettings(), ...patch }), name);
  }
  assert.equal(currentStudyStyle(defaultSettings()), 'balanced');
  const old = mergeSettings({ theme: 'dark' });
  assert.equal(old.desiredRetention, 0.9);
  assert.equal(old.showReflect, true);
  assert.equal(mergeSettings({ desiredRetention: 2 }).desiredRetention, 0.95);
  assert.equal(mergeSettings({ dailyGoal: 7 }).dailyGoal, 50);
  assert.equal(mergeSettings({ lineSpacing: 'loose', readingFont: 'hyperlegible' }).lineSpacing, 'loose');
});

test('reflections survive a backup restore', () => {
  const p = normalizeProgress({ courseId: 'c', reflections: { l1: { dump: 'x', covered: [0] }, bad: 3 } });
  assert.deepEqual(p?.reflections, { l1: { dump: 'x', covered: [0] } });
});
