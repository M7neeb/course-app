import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupMistakes, indexQuestions, listMistakes, mistakesToBlock } from './mistakes.ts';
import { newProgress } from './progress.ts';
import type { Course, CourseProgress } from './types.ts';

function course(): Course {
  return {
    schemaVersion: 2,
    id: 'c1',
    title: 'Course 1',
    modules: [
      {
        id: 'm1',
        title: 'Module 1',
        lessons: [
          {
            id: 'm1-l1',
            title: 'Lesson 1',
            blocks: [
              {
                id: 'b1',
                type: 'quiz',
                questions: [
                  { id: 'q1', kind: 'true-false', prompt: 'One?', answer: true },
                  { id: 'q2', kind: 'short-answer', prompt: 'Two?', answer: 'nets' }
                ]
              }
            ]
          }
        ],
        test: { id: 'm1-test', type: 'module-test', questions: [{ id: 'q3', kind: 'true-false', prompt: 'Three?', answer: false }] }
      }
    ]
  };
}

function withAnswers(): { courses: Course[]; progress: Record<string, CourseProgress> } {
  const c = course();
  const p = newProgress('c1');
  // q1 wrong, q2 right, q3 wrong.
  p.answers['q1'] = { given: false, correct: false, at: '2026-10-11T10:00:00Z', attempts: 1 };
  p.answers['q2'] = { given: 'nets', correct: true, at: '2026-10-11T10:00:00Z', attempts: 1 };
  p.answers['q3'] = { given: true, correct: false, at: '2026-10-11T10:00:00Z', attempts: 2 };
  return { courses: [c], progress: { c1: p } };
}

test('questions are indexed across lessons and module tests', () => {
  const index = indexQuestions(course());
  assert.deepEqual([...index.keys()].sort(), ['q1', 'q2', 'q3']);
  assert.equal(index.get('q3')?.itemId, 'm1:test');
  assert.equal(index.get('q1')?.blockId, 'b1');
});

test('only questions whose latest answer is wrong count as mistakes', () => {
  const { courses, progress } = withAnswers();
  const mistakes = listMistakes(courses, progress, 'en');
  assert.deepEqual(mistakes.map((m) => m.question.id).sort(), ['q1', 'q3']);
  assert.equal(mistakes.find((m) => m.question.id === 'q1')?.prompt, 'One?');
});

test('answering correctly removes a question from the mistake list', () => {
  const { courses, progress } = withAnswers();
  progress.c1!.answers['q1'] = { given: true, correct: true, at: 'now', attempts: 2 };
  assert.deepEqual(listMistakes(courses, progress, 'en').map((m) => m.question.id), ['q3']);
});

test('a question answered wrongly again stays on the list', () => {
  const { courses, progress } = withAnswers();
  progress.c1!.answers['q1'] = { given: false, correct: false, at: 'later', attempts: 3 };
  assert.ok(listMistakes(courses, progress, 'en').some((m) => m.question.id === 'q1'));
});

test('mistakes group by course and build a drillable quiz block', () => {
  const { courses, progress } = withAnswers();
  const groups = groupMistakes(listMistakes(courses, progress, 'en'));
  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.courseId, 'c1');
  assert.equal(groups[0]?.entries.length, 2);
  const block = mistakesToBlock(groups[0]!.entries);
  assert.equal(block.type, 'quiz');
  assert.equal((block.questions as unknown[]).length, 2);
});

test('courses without progress contribute no mistakes', () => {
  assert.deepEqual(listMistakes([course()], {}, 'en'), []);
});
