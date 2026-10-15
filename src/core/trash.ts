// Trash: a deleted course is kept for a grace period so the delete can be undone.
// Pure logic only; the storage layer persists TrashedCourse records.

import type { Course, CourseMastery, CourseMeta, CourseProgress, TrashedCourse } from './types.ts';

export const TRASH_GRACE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function makeTrashed(
  course: Course,
  meta: CourseMeta | undefined,
  progress: CourseProgress | undefined,
  now: Date = new Date(),
  mastery?: CourseMastery
): TrashedCourse {
  return {
    courseId: course.id,
    course,
    meta,
    progress,
    mastery,
    deletedAt: now.toISOString()
  };
}

/** Whole days since the course was moved to the trash; 0 for a bad or future timestamp. */
export function trashAgeDays(item: TrashedCourse, now: Date = new Date()): number {
  const then = new Date(item.deletedAt);
  if (Number.isNaN(then.getTime())) return 0;
  const diff = now.getTime() - then.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / DAY_MS);
}

/** Days left before the automatic purge; never negative. */
export function daysUntilPurge(item: TrashedCourse, now: Date = new Date()): number {
  return Math.max(0, TRASH_GRACE_DAYS - trashAgeDays(item, now));
}

export function isExpired(item: TrashedCourse, now: Date = new Date()): boolean {
  return trashAgeDays(item, now) >= TRASH_GRACE_DAYS;
}

/** Splits a trash list into what stays and what is old enough to remove for good. */
export function purgeExpired(
  items: TrashedCourse[],
  now: Date = new Date()
): { kept: TrashedCourse[]; purged: TrashedCourse[] } {
  const kept: TrashedCourse[] = [];
  const purged: TrashedCourse[] = [];
  for (const item of items) (isExpired(item, now) ? purged : kept).push(item);
  return { kept, purged };
}

/** Newest deletion first, so the trash list reads like a normal history. */
export function sortTrash(items: TrashedCourse[]): TrashedCourse[] {
  return [...items].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}
