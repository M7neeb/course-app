import { test } from 'node:test';
import assert from 'node:assert/strict';
import { courseHaystack, courseMatches } from './search.ts';
import type { Course } from './types.ts';

const course: Course = {
  schemaVersion: 2,
  id: 'c1',
  title: 'Algebra basics',
  subject: 'Maths',
  level: 'Beginner',
  modules: []
};

test('an empty query matches every course', () => {
  assert.equal(courseMatches(course, 'Algebra basics', [], ''), true);
  assert.equal(courseMatches(course, 'Algebra basics', [], '   '), true);
});

test('the query matches title, subject, level or tag, case-insensitively', () => {
  assert.equal(courseMatches(course, 'Algebra basics', [], 'algebra'), true);
  assert.equal(courseMatches(course, 'Algebra basics', [], 'maths'), true);
  assert.equal(courseMatches(course, 'Algebra basics', [], 'BEGINNER'), true);
  assert.equal(courseMatches(course, 'Algebra basics', ['homework'], 'home'), true);
  assert.equal(courseMatches(course, 'Algebra basics', ['homework'], 'geometry'), false);
});

test('the haystack drops blank fields', () => {
  const bare: Course = { schemaVersion: 2, id: 'c2', title: 'Bare', modules: [] };
  assert.deepEqual(courseHaystack(bare, 'Bare', []), ['Bare']);
});
