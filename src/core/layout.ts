// Layouts change what each screen shows, not only how it looks:
//
// - standard: sidebars, cards and the usual amount of detail.
// - simple:   one column, big buttons, a tab bar on every screen size and only what is needed now.
// - detailed: every extra number: memory strength, points, question counts, reading time.
// - compact:  tight spacing, no explanations under options, more on one screen.
//
// Screens ask `shows(layout, part)` instead of comparing layout names, so what a layout contains
// is decided in one table.

import { resolveCalloutMarkdown, resolveTextLevels, type Lang } from './localize.ts';
import { isPretest } from './mastery.ts';
import type { Block, LayoutMode } from './types.ts';

/** Anything with lesson blocks: a lesson, a module test or a flat course item. */
type WithBlocks = { blocks?: Block[] };

export const LAYOUT_PARTS = {
  /** The grey profile band on Home. */
  profileBand: ['standard', 'detailed'],
  /** The streak and level bar on Home. */
  streakBar: ['standard', 'detailed', 'compact'],
  /** "My stuff / My account" and the course outline beside the content. */
  sidebars: ['standard', 'detailed', 'compact'],
  /** The bottom tab bar also on wide screens (phones always get it). */
  tabBarEverywhere: ['simple'],
  /** Explore and search in the header. */
  headerTools: ['standard', 'detailed', 'compact'],
  /** The mastery legend and the row of skill squares on a unit. */
  masteryLegend: ['standard', 'detailed'],
  skillRow: ['standard', 'detailed', 'compact'],
  /** "About this unit" and other intro cards. */
  aboutCards: ['standard', 'detailed'],
  /** Explanations under settings and page intros. */
  hints: ['standard', 'simple', 'detailed'],
  /** Extra numbers: points, memory strength, counts, reading time. */
  extraStats: ['detailed'],
  /** Unit timelines on Home show every unit, not the first few. */
  allUnits: ['detailed'],
  /** Activity calendar, calibration and subject breakdown on Progress. */
  deepStats: ['standard', 'detailed', 'compact'],
  /** Library search, sorting and tags. */
  libraryTools: ['standard', 'detailed', 'compact'],
  /** One big card per course on Home instead of unit timelines. */
  bigCourseCards: ['simple']
} as const satisfies Record<string, readonly LayoutMode[]>;

export type LayoutPart = keyof typeof LAYOUT_PARTS;

export function shows(layout: LayoutMode, part: LayoutPart): boolean {
  return (LAYOUT_PARTS[part] as readonly LayoutMode[]).includes(layout);
}

/** Words read per minute for a reading-time estimate (a calm pace for learning text). */
const WORDS_PER_MINUTE = 180;

function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

/** Minutes to read a lesson's explanations at the learner's level, at least 1. */
export function readingMinutes(lesson: WithBlocks, lang: Lang, level: 'simple' | 'normal' | 'detailed' = 'normal'): number {
  let words = 0;
  for (const block of lesson.blocks ?? []) {
    if (block.type === 'text') {
      const levels = resolveTextLevels(block as Block, lang);
      words += wordCount(levels[level] ?? levels.normal ?? '');
    } else if (block.type === 'callout' || block.type === 'example') {
      words += wordCount(resolveCalloutMarkdown(block as Block, lang));
    }
  }
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Questions in a lesson that count for mastery (warm-ups are not counted). */
export function lessonQuestionCount(lesson: WithBlocks): number {
  let n = 0;
  for (const block of lesson.blocks ?? []) {
    if (block.type === 'quiz' && !isPretest(block as Block)) n += (block as Block & { questions?: unknown[] }).questions?.length ?? 0;
  }
  return n;
}
