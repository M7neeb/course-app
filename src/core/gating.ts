// Gating: which lesson, module test or exam the learner may open next. Pure decisions - the UI
// only renders what these functions decide, and every threshold comes from MASTERY.gate so the
// whole progression can be retuned in one place.

import { MASTERY, moduleMasteryPercent, moduleMasterySkills, pointsForTier, skillPoints, courseSkills } from './mastery.ts';
import type { Course, CourseMastery, GatingMode } from './types.ts';
import type { FlatItem } from './course-utils.ts';

export type GateKind = 'open' | 'module' | 'lesson' | 'test' | 'exam';

export interface Gate {
  locked: boolean;
  /** What the requirement is about, so the UI can word it. */
  kind: GateKind;
  /** Current value: skill points, or a module's mastery percent (0-100). */
  current: number;
  /** The value needed to unlock. */
  target: number;
  /** The weakest skill blocking progress: the "Practise weak skills" jump target. */
  weakSkillId?: string;
  /** The skill the requirement names, when there is exactly one. */
  skillId?: string;
  /** The module the requirement names. */
  moduleId?: string;
  /**
   * True when gating is in 'free' mode and this item only carries a recommendation: it is open,
   * but the mastery it would need in 'locked' mode is still shown.
   */
  recommended?: boolean;
}

export function openGate(): Gate {
  return { locked: false, kind: 'open', current: 0, target: 0 };
}

/** Lowest-mastery entry, with a stable tie-break so the jump target never wobbles. */
function weakest(entries: { id: string; points: number }[]): { id: string; points: number } | undefined {
  let best: { id: string; points: number } | undefined;
  for (const entry of entries) {
    if (!best || entry.points < best.points || (entry.points === best.points && entry.id < best.id)) best = entry;
  }
  return best;
}

function lessonHasQuestions(course: Course, lessonId: string): boolean {
  const skill = courseSkills(course).find((s) => s.id === lessonId);
  return skill !== undefined && skill.questionIds.length > 0;
}

/** The lowest-mastery masterable lesson skill in a module. */
export function weakestSkillInModule(course: Course, mastery: CourseMastery | undefined, moduleId: string): string | undefined {
  return weakest(
    moduleMasterySkills(course, moduleId).map((skill) => ({ id: skill.id, points: skillPoints(mastery, skill.id) }))
  )?.id;
}

/** Module `moduleIndex` is locked until the module before it reaches the mastery share. */
export function moduleGate(course: Course, mastery: CourseMastery | undefined, moduleIndex: number): Gate {
  if (moduleIndex <= 0) return openGate();
  const previous = course.modules[moduleIndex - 1];
  if (!previous) return openGate();
  const target = Math.round(MASTERY.gate.module * 100);
  const current = moduleMasteryPercent(course, mastery, previous.id);
  if (current >= target) return openGate();
  return {
    locked: true,
    kind: 'module',
    moduleId: previous.id,
    current,
    target,
    weakSkillId: weakestSkillInModule(course, mastery, previous.id)
  };
}

/** Lesson N+1 opens when lesson N reaches the lesson tier. */
export function lessonGate(course: Course, mastery: CourseMastery | undefined, moduleId: string, lessonId: string): Gate {
  const module = course.modules.find((m) => m.id === moduleId);
  if (!module) return openGate();
  const index = module.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index <= 0) return openGate();
  const previous = module.lessons[index - 1];
  if (!previous || !lessonHasQuestions(course, previous.id)) return openGate();
  const target = pointsForTier(MASTERY.gate.lesson);
  const current = skillPoints(mastery, previous.id);
  if (current >= target) return openGate();
  return { locked: true, kind: 'lesson', skillId: previous.id, weakSkillId: previous.id, current, target };
}

/** A module's test opens when every lesson in it reaches the test tier. */
export function testGate(course: Course, mastery: CourseMastery | undefined, moduleId: string): Gate {
  const module = course.modules.find((m) => m.id === moduleId);
  if (!module) return openGate();
  const target = pointsForTier(MASTERY.gate.test);
  const blockers: { id: string; points: number }[] = [];
  for (const lesson of module.lessons) {
    if (!lessonHasQuestions(course, lesson.id)) continue;
    const points = skillPoints(mastery, lesson.id);
    if (points < target) blockers.push({ id: lesson.id, points });
  }
  const weak = weakest(blockers);
  if (!weak) return openGate();
  return { locked: true, kind: 'test', moduleId, skillId: weak.id, weakSkillId: weak.id, current: weak.points, target };
}

/** The final exam opens when every lesson in the course reaches the exam tier. */
export function examGate(course: Course, mastery: CourseMastery | undefined): Gate {
  const target = pointsForTier(MASTERY.gate.exam);
  const blockers: { id: string; points: number }[] = [];
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!lessonHasQuestions(course, lesson.id)) continue;
      const points = skillPoints(mastery, lesson.id);
      if (points < target) blockers.push({ id: lesson.id, points });
    }
  }
  const weak = weakest(blockers);
  if (!weak) return openGate();
  return { locked: true, kind: 'exam', skillId: weak.id, weakSkillId: weak.id, current: weak.points, target };
}

/** The full decision for one player item: module gate first, then the item's own requirement. */
function lockedGateForItem(course: Course, mastery: CourseMastery | undefined, item: FlatItem): Gate {
  if (item.kind === 'exam') return examGate(course, mastery);
  if (item.moduleId === null) return openGate();
  const moduleIndex = course.modules.findIndex((m) => m.id === item.moduleId);
  if (moduleIndex < 0) return openGate();
  const moduleDecision = moduleGate(course, mastery, moduleIndex);
  if (moduleDecision.locked) return moduleDecision;
  if (item.kind === 'test') return testGate(course, mastery, item.moduleId);
  return lessonGate(course, mastery, item.moduleId, item.id);
}

/**
 * The decision the UI renders, honouring the gating mode.
 *
 * 'locked' is the original behaviour: nothing is reachable until the mastery is there.
 * 'free' never locks anything, but the requirement is still computed and returned with
 * `recommended: true` so the learner keeps seeing what to aim for and the weakest-skill jump.
 */
export function gateForItem(
  course: Course,
  mastery: CourseMastery | undefined,
  item: FlatItem,
  mode: GatingMode = 'locked'
): Gate {
  const gate = lockedGateForItem(course, mastery, item);
  if (mode === 'free' && gate.locked) return { ...gate, locked: false, recommended: true };
  return gate;
}
