// Pure course search, shared by the header search box and the Library filter, so the two always
// agree on what "matches". No storage and no DOM, so it is unit tested directly.

import type { Course } from './types.ts';

/** The searchable text of one course: its display title, subject, level and tags. */
export function courseHaystack(course: Course, title: string, tags: string[]): string[] {
  return [title, course.subject ?? '', course.level ?? '', ...tags].filter((value) => value.trim() !== '');
}

/** True when the query matches any part of a course. An empty query matches everything. */
export function courseMatches(course: Course, title: string, tags: string[], query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === '') return true;
  return courseHaystack(course, title, tags).some((value) => value.toLocaleLowerCase().includes(needle));
}
