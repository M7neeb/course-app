import { test } from 'node:test';
import assert from 'node:assert/strict';
import { combine, courseProgress, focusSkills, measuredSkills, progressBySubject, summarize, tierSegments } from './progressView.ts';
import { moduleMasteryPercent } from './mastery.ts';
import type { Course, CourseMastery } from './types.ts';

const AT = '2026-10-15T10:00:00.000Z';

/** A course with one module per entry; each lesson gets one true/false question. */
function course(id: string, subject: string | undefined, modules: string[][]): Course {
  return {
    schemaVersion: 2,
    id,
    title: id,
    ...(subject ? { subject } : {}),
    modules: modules.map((lessons, m) => ({
      id: `${id}-m${m + 1}`,
      title: `Unit ${m + 1}`,
      lessons: lessons.map((lessonId) => ({
        id: lessonId,
        title: lessonId,
        blocks: [{ id: lessonId + '-q', type: 'quiz', questions: [{ id: lessonId + '-q1', kind: 'true-false', prompt: '?', answer: true }] }]
      }))
    }))
  };
}

function mastery(courseId: string, points: Record<string, number>): CourseMastery {
  return {
    courseId,
    skills: Object.fromEntries(Object.entries(points).map(([skillId, p]) => [skillId, { skillId, points: p, firstTry: {}, updatedAt: AT }])),
    mistakes: [],
    updatedAt: AT
  } as CourseMastery;
}

test('a summary counts skills per tier and reports earned / maximum points', () => {
  const s = summarize([100, 80, 50, 10, 0, 0]);
  assert.deepEqual(s.counts, { mastered: 1, proficient: 1, familiar: 1, attempted: 1, 'not-started': 2 });
  assert.equal(s.total, 6);
  assert.equal(s.percent, Math.round((240 / 600) * 100));
  assert.equal(summarize([]).percent, 0);
});

test('combining summaries weights by skill count, not by average of percentages', () => {
  const small = summarize([100]);
  const big = summarize([0, 0, 0]);
  const both = combine([small, big]);
  assert.equal(both.total, 4);
  assert.equal(both.percent, 25);
});

test('a unit on the progress page shows the same percent as the unit page', () => {
  const c = course('alg', 'Math', [['a', 'b'], ['c']]);
  const m = mastery('alg', { a: 80, b: 50, c: 100 });
  const view = courseProgress(c, m);
  assert.equal(view.units[0]?.summary.percent, moduleMasteryPercent(c, m, 'alg-m1'));
  assert.equal(view.units[1]?.summary.percent, 100);
  assert.equal(view.summary.total, 3);
});

test('lessons without questions are not measured', () => {
  const c = course('x', undefined, [['a']]);
  c.modules[0]?.lessons.push({ id: 'reading', title: 'Reading only', blocks: [] });
  assert.deepEqual(measuredSkills(c).map((s) => s.id), ['a']);
});

test('progress groups courses under subjects with a combined subject summary', () => {
  const alg = course('alg', 'Math', [['a']]);
  const geo = course('geo', 'Math', [['g']]);
  const net = course('net', 'IT', [['n']]);
  const subjects = progressBySubject([alg, net, geo], { alg: mastery('alg', { a: 100 }), geo: mastery('geo', { g: 0 }) });
  assert.deepEqual(subjects.map((s) => s.subject), ['IT', 'Math']);
  const math = subjects[1];
  assert.deepEqual(math?.courses.map((c) => c.course.id), ['alg', 'geo']);
  assert.equal(math?.summary.percent, 50);
});

test('focus skills are started but below Proficient, weakest first', () => {
  const c = course('c', undefined, [['a', 'b', 'd', 'e']]);
  const focus = focusSkills([c], { c: mastery('c', { a: 50, b: 10, d: 80, e: 0 }) });
  assert.deepEqual(focus.map((f) => [f.skillId, f.tier]), [['b', 'attempted'], ['a', 'familiar']]);
});

test('tier segments add up to 100, highest tier first', () => {
  const segments = tierSegments(summarize([100, 80, 80, 0, 0, 0, 10]));
  assert.equal(segments[0]?.tier, 'mastered');
  assert.equal(segments.reduce((sum, s) => sum + s.percent, 0), 100);
  assert.ok(segments.every((s) => s.percent >= 0));
  assert.equal(tierSegments(summarize([]))[4]?.percent, 100);
});
