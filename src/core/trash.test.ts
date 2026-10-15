import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  daysUntilPurge,
  isExpired,
  makeTrashed,
  purgeExpired,
  sortTrash,
  trashAgeDays,
  TRASH_GRACE_DAYS
} from './trash.ts';
import type { Course, TrashedCourse } from './types.ts';

const course: Course = { schemaVersion: 2, id: 'c1', title: 'C1', modules: [] };

function at(daysAgo: number): string {
  const now = new Date('2026-10-11T12:00:00Z');
  now.setUTCDate(now.getUTCDate() - daysAgo);
  return now.toISOString();
}

test('a deleted course keeps its content, meta and progress', () => {
  const item = makeTrashed(course, { courseId: 'c1', archived: true }, undefined, new Date('2026-10-11T12:00:00Z'));
  assert.equal(item.courseId, 'c1');
  assert.equal(item.course.title, 'C1');
  assert.equal(item.meta?.archived, true);
  assert.equal(item.deletedAt, '2026-10-11T12:00:00.000Z');
});

test('age and time-to-purge count whole days', () => {
  const item = makeTrashed(course, undefined, undefined, new Date(at(10)));
  const now = new Date('2026-10-11T12:00:00Z');
  assert.equal(trashAgeDays(item, now), 10);
  assert.equal(daysUntilPurge(item, now), TRASH_GRACE_DAYS - 10);
});

test('a future or unreadable timestamp never reads as expired', () => {
  const future = makeTrashed(course, undefined, undefined, new Date('2026-12-01T00:00:00Z'));
  const now = new Date('2026-10-11T12:00:00Z');
  assert.equal(trashAgeDays(future, now), 0);
  assert.equal(isExpired(future, now), false);
});

test('items older than the grace period are purged, the rest are kept', () => {
  const now = new Date('2026-10-11T12:00:00Z');
  const old = makeTrashed({ ...course, id: 'old' }, undefined, undefined, new Date(at(31)));
  const fresh = makeTrashed({ ...course, id: 'new' }, undefined, undefined, new Date(at(3)));
  const borderline = makeTrashed({ ...course, id: 'mid' }, undefined, undefined, new Date(at(TRASH_GRACE_DAYS)));
  assert.equal(isExpired(old, now), true);
  assert.equal(isExpired(fresh, now), false);
  assert.equal(isExpired(borderline, now), true);
  const { kept, purged } = purgeExpired([old, fresh, borderline], now);
  assert.deepEqual(kept.map((i) => i.courseId), ['new']);
  assert.deepEqual(purged.map((i) => i.courseId).sort(), ['mid', 'old']);
});

test('the trash list reads newest deletion first', () => {
  const a: TrashedCourse = makeTrashed({ ...course, id: 'a' }, undefined, undefined, new Date('2026-10-01T00:00:00Z'));
  const b: TrashedCourse = makeTrashed({ ...course, id: 'b' }, undefined, undefined, new Date('2026-10-09T00:00:00Z'));
  assert.deepEqual(sortTrash([a, b]).map((i) => i.courseId), ['b', 'a']);
});
