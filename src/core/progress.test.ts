import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeProgress } from './progress.ts';

test('normalizeProgress preserves lesson and private question notes', () => {
  const progress = normalizeProgress({
    courseId: 'networking',
    notes: { lesson1: 'Remember the layers' },
    questionNotes: { q1: 'I mixed up TCP and UDP' }
  });

  assert.deepEqual(progress?.notes, { lesson1: 'Remember the layers' });
  assert.deepEqual(progress?.questionNotes, { q1: 'I mixed up TCP and UDP' });
});

test('normalizeProgress drops malformed note values', () => {
  const progress = normalizeProgress({
    courseId: 'networking',
    notes: { lesson1: 'Keep this', lesson2: 42 },
    questionNotes: { q1: false, q2: 'Keep this too' }
  });

  assert.deepEqual(progress?.notes, { lesson1: 'Keep this' });
  assert.deepEqual(progress?.questionNotes, { q2: 'Keep this too' });
});

test('normalizeProgress preserves unique string bookmarks and drops invalid entries', () => {
  const progress = normalizeProgress({ courseId: 'networking', bookmarks: ['lesson1', 'lesson1', 7, 'lesson2'] });
  assert.deepEqual(progress?.bookmarks, ['lesson1', 'lesson2']);
});
