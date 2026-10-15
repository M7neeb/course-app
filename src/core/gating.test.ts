import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gateForItem, weakestSkillInModule } from './gating.ts';
import { MASTERY } from './mastery.ts';
import { FINAL_EXAM_ITEM_ID, flattenCourse } from './course-utils.ts';
import type { Course, CourseMastery, SkillMastery } from './types.ts';

const AT = '2026-10-14T10:00:00.000Z';

function quiz(id: string, questionIds: string[]): { id: string; type: string; questions: unknown[] } {
  return {
    id,
    type: 'quiz',
    questions: questionIds.map((qid) => ({ id: qid, kind: 'true-false', prompt: `${qid}?`, answer: true }))
  };
}

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
          { id: 'l1', title: 'Lesson 1', blocks: [quiz('b1', ['l1q1', 'l1q2'])] },
          { id: 'l2', title: 'Lesson 2', blocks: [quiz('b2', ['l2q1'])] }
        ],
        test: { id: 'm1-test', type: 'module-test', questions: [{ id: 'm1t1', kind: 'true-false', prompt: 't?', answer: true }] }
      },
      {
        id: 'm2',
        title: 'Module 2',
        lessons: [{ id: 'm2l1', title: 'Only lesson', blocks: [quiz('b3', ['m2q1'])] }]
      }
    ],
    finalExam: { id: 'fx', type: 'final-exam', questions: [{ id: 'fxq1', kind: 'true-false', prompt: 'x?', answer: true }] }
  };
}

function masteryOf(points: Record<string, number>): CourseMastery {
  const skills: Record<string, SkillMastery> = {};
  for (const [id, value] of Object.entries(points)) {
    skills[id] = { skillId: id, points: value, firstTry: {}, updatedAt: AT };
  }
  return { courseId: 'c1', skills, mistakes: [], updatedAt: AT };
}

function item(c: Course, id: string) {
  const found = flattenCourse(c).find((i) => i.id === id);
  assert.ok(found, `expected an item "${id}"`);
  return found;
}

test('the first lesson of the first module is open', () => {
  const c = course();
  assert.equal(gateForItem(c, undefined, item(c, 'l1')).locked, false);
  assert.equal(gateForItem(c, masteryOf({}), item(c, 'l1')).locked, false);
});

test('lesson N+1 unlocks when lesson N reaches Familiar', () => {
  const c = course();
  const locked = gateForItem(c, masteryOf({ l1: MASTERY.points.attempted }), item(c, 'l2'));
  assert.equal(locked.locked, true);
  assert.equal(locked.kind, 'lesson');
  assert.equal(locked.skillId, 'l1');
  assert.equal(locked.weakSkillId, 'l1');
  assert.equal(locked.current, MASTERY.points.attempted);
  assert.equal(locked.target, MASTERY.points.familiar);

  assert.equal(gateForItem(c, masteryOf({ l1: MASTERY.points.familiar }), item(c, 'l2')).locked, false);
  assert.equal(gateForItem(c, masteryOf({ l1: MASTERY.points.mastered }), item(c, 'l2')).locked, false);
});

test('a module test waits for every lesson to reach Familiar and names the weakest', () => {
  const c = course();
  const locked = gateForItem(c, masteryOf({ l1: MASTERY.points.proficient, l2: MASTERY.points.attempted }), item(c, 'm1:test'));
  assert.equal(locked.locked, true);
  assert.equal(locked.kind, 'test');
  assert.equal(locked.weakSkillId, 'l2');
  assert.equal(locked.current, MASTERY.points.attempted);
  assert.equal(locked.target, MASTERY.points.familiar);

  const open = gateForItem(c, masteryOf({ l1: MASTERY.points.familiar, l2: MASTERY.points.familiar }), item(c, 'm1:test'));
  assert.equal(open.locked, false);
});

test('the next module unlocks at 80% of the previous module maximum', () => {
  const c = course();
  const target = item(c, 'm2l1');

  // 50 + 50 of 200 = 50%.
  const locked = gateForItem(c, masteryOf({ l1: 50, l2: 50 }), target);
  assert.equal(locked.locked, true);
  assert.equal(locked.kind, 'module');
  assert.equal(locked.moduleId, 'm1');
  assert.equal(locked.current, 50);
  assert.equal(locked.target, 80);
  assert.ok(locked.weakSkillId === 'l1' || locked.weakSkillId === 'l2');

  // 160 of 200 = 80%: exactly the threshold, so it opens.
  assert.equal(gateForItem(c, masteryOf({ l1: 80, l2: 80 }), target).locked, false);
  assert.equal(gateForItem(c, masteryOf({ l1: 100, l2: 80 }), target).locked, false);

  // 79 of 80 is still short.
  assert.equal(gateForItem(c, masteryOf({ l1: 79, l2: 79 }), target).locked, true);
});

test('a first lesson can still be locked by its module, and it says so', () => {
  const c = course();
  const gate = gateForItem(c, masteryOf({ l1: 10, l2: 10 }), item(c, 'm2l1'));
  assert.equal(gate.locked, true);
  assert.equal(gate.kind, 'module');
  assert.equal(gate.skillId, undefined);
  assert.equal(weakestSkillInModule(c, masteryOf({ l1: 10, l2: 80 }), 'm1'), 'l1');
});

test('the final exam waits for every lesson in the course', () => {
  const c = course();
  const locked = gateForItem(c, masteryOf({ l1: 100, l2: 100, m2l1: MASTERY.points.attempted }), item(c, FINAL_EXAM_ITEM_ID));
  assert.equal(locked.locked, true);
  assert.equal(locked.kind, 'exam');
  assert.equal(locked.weakSkillId, 'm2l1');
  assert.equal(locked.target, MASTERY.points.familiar);

  assert.equal(gateForItem(c, masteryOf({ l1: 50, l2: 50, m2l1: 50 }), item(c, FINAL_EXAM_ITEM_ID)).locked, false);
});

test('a lesson with no questions never blocks the lesson after it', () => {
  const c: Course = {
    schemaVersion: 2,
    id: 'x',
    title: 'X',
    modules: [
      {
        id: 'm1',
        title: 'M1',
        lessons: [
          { id: 'l1', title: 'Text only', blocks: [{ id: 'b1', type: 'text', markdown: 'hi' }] },
          { id: 'l2', title: 'Quiz lesson', blocks: [quiz('b2', ['q1'])] }
        ]
      }
    ]
  };
  assert.equal(gateForItem(c, undefined, item(c, 'l2')).locked, false);
});

// ---------- gating mode ----------

test('the default mode is locked: it is exactly the in-order behaviour', () => {
  const c = course();
  assert.equal(gateForItem(c, masteryOf({ l1: 10 }), item(c, 'l2')).locked, true);
  assert.equal(gateForItem(c, masteryOf({ l1: 10 }), item(c, 'l2'), 'locked').locked, true);
});

test('free mode unlocks every lesson, test, module and the final exam at once', () => {
  const c = course();
  const nothing = masteryOf({});

  const lesson = gateForItem(c, nothing, item(c, 'l2'), 'free');
  assert.equal(lesson.locked, false);
  assert.equal(lesson.recommended, true, 'the requirement is still reported as a recommendation');
  assert.equal(lesson.kind, 'lesson');
  assert.equal(lesson.skillId, 'l1');
  assert.equal(lesson.weakSkillId, 'l1');
  assert.equal(lesson.target, MASTERY.points.familiar);

  // The module test and the next module are reachable immediately.
  assert.equal(gateForItem(c, nothing, item(c, 'm1:test'), 'free').locked, false);
  assert.equal(gateForItem(c, nothing, item(c, 'm2l1'), 'free').locked, false);
  assert.equal(gateForItem(c, nothing, item(c, FINAL_EXAM_ITEM_ID), 'free').locked, false);
  assert.equal(gateForItem(c, nothing, item(c, 'm2l1'), 'free').recommended, true);
});

test('free mode never marks an already-open item as recommended', () => {
  const c = course();
  const first = gateForItem(c, masteryOf({}), item(c, 'l1'), 'free');
  assert.equal(first.locked, false);
  assert.equal(first.kind, 'open');
  assert.equal(first.recommended, undefined);
});
