import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStats,
  activityWeeks,
  currentStreak,
  emptyDay,
  lastDays,
  levelForXp,
  previousDay,
  withActivity,
  xpForLevel,
  xpToNextLevel,
  XP_PER_CORRECT,
  XP_PER_LESSON,
  type ActivityDay
} from './activity.ts';

test('activity adds the right amount of XP', () => {
  let day = emptyDay('2026-10-11');
  day = withActivity(day, 'correct');
  day = withActivity(day, 'lesson');
  assert.equal(day.correct, 1);
  assert.equal(day.lessons, 1);
  assert.equal(day.xp, XP_PER_CORRECT + XP_PER_LESSON);
});

test('levels follow the XP thresholds', () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(249), 2);
  assert.equal(levelForXp(250), 3);
  assert.equal(xpForLevel(2), 100);
  assert.equal(xpToNextLevel(100), 150);
  assert.equal(xpToNextLevel(999999), null);
});

test('previousDay and lastDays walk the calendar across month bounds', () => {
  assert.equal(previousDay('2026-03-01'), '2026-02-28');
  assert.equal(previousDay('2026-01-01'), '2025-12-31');
  assert.deepEqual(lastDays('2026-01-03', 3), ['2026-01-01', '2026-01-02', '2026-01-03']);
});

test('activity calendar is Monday-first and spans complete weeks through today', () => {
  const weeks = activityWeeks('2026-10-11', 2);
  assert.deepEqual(weeks, [
    ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
    ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']
  ]);
});

test('streak counts consecutive days ending today or yesterday', () => {
  assert.equal(currentStreak(new Set(['2026-10-11', '2026-10-10', '2026-10-09']), '2026-10-11'), 3);
  assert.equal(currentStreak(new Set(['2026-10-10', '2026-10-09']), '2026-10-11'), 2); // today still quiet
  assert.equal(currentStreak(new Set(['2026-10-09']), '2026-10-11'), 0); // a gap breaks it
  assert.equal(currentStreak(new Set<string>(), '2026-10-11'), 0);
});

test('computeStats ties XP, level and streak together', () => {
  const days: Record<string, ActivityDay> = {
    '2026-10-10': { day: '2026-10-10', correct: 3, lessons: 1, xp: 35 },
    '2026-10-11': { day: '2026-10-11', correct: 7, lessons: 0, xp: 70 }
  };
  const s = computeStats(days, '2026-10-11');
  assert.equal(s.totalXp, 105);
  assert.equal(s.level, 2);
  assert.equal(s.streak, 2);
  assert.equal(s.activeDays, 2);
  assert.equal(s.xpToNext, 145);
});
