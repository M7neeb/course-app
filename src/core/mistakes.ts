// Mistake review: which questions the learner answered wrongly, derived from saved answers.
// Nothing new is stored — a question counts as a "mistake" while its latest answer is wrong,
// and answering it correctly clears it. Pure logic, no storage.

import { flattenCourse } from './course-utils.ts';
import { resolveQuestion, type Lang } from './localize.ts';
import type { Block, Course, CourseProgress, Question } from './types.ts';

export interface QuestionLocation {
  courseId: string;
  /** Flat item id the question lives in (a lesson, a module test or the final exam). */
  itemId: string;
  blockId: string;
  question: Question;
}

/** Every question in a course, keyed by its (course-unique) id. */
export function indexQuestions(course: Course): Map<string, QuestionLocation> {
  const map = new Map<string, QuestionLocation>();
  for (const item of flattenCourse(course)) {
    for (const block of item.blocks) {
      // Warm-up guesses are not real attempts, so they are never listed or reviewed.
      if ((block as Block).pretest === true) continue;
      const questions = (block as Block).questions;
      if (!Array.isArray(questions)) continue;
      for (const raw of questions) {
        const q = raw as Question;
        if (q && typeof q.id === 'string' && q.id !== '' && !map.has(q.id)) {
          map.set(q.id, { courseId: course.id, itemId: item.id, blockId: block.id, question: q });
        }
      }
    }
  }
  return map;
}

export interface MistakeEntry extends QuestionLocation {
  given: unknown;
  attempts: number;
  at: string;
  /** Question prompt resolved for the requested language, for listing. */
  prompt: string;
}

/** All questions whose most recent answer is wrong, in course order. */
export function listMistakes(
  courses: Course[],
  progress: Record<string, CourseProgress>,
  lang: Lang
): MistakeEntry[] {
  const out: MistakeEntry[] = [];
  for (const course of courses) {
    const p = progress[course.id];
    if (!p) continue;
    for (const [qid, loc] of indexQuestions(course)) {
      const record = p.answers[qid];
      if (!record || record.correct) continue;
      out.push({
        ...loc,
        given: record.given,
        attempts: record.attempts,
        at: record.at,
        prompt: resolveQuestion(loc.question, lang).prompt
      });
    }
  }
  return out;
}

/** Mistakes grouped by course, preserving the course order they were found in. */
export function groupMistakes(entries: MistakeEntry[]): { courseId: string; entries: MistakeEntry[] }[] {
  const groups: { courseId: string; entries: MistakeEntry[] }[] = [];
  const byId = new Map<string, { courseId: string; entries: MistakeEntry[] }>();
  for (const entry of entries) {
    let group = byId.get(entry.courseId);
    if (!group) {
      group = { courseId: entry.courseId, entries: [] };
      byId.set(entry.courseId, group);
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

/** A synthetic quiz block that drills exactly these questions. */
export function mistakesToBlock(entries: MistakeEntry[], id = 'mistake-practice'): Block {
  return { id, type: 'quiz', questions: entries.map((e) => e.question) };
}
