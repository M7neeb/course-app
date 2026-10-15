// All shared data shapes live here. Content (Course) is read-only; user data
// (progress, settings, library meta) is stored separately and refers to content by stable ids.

import type { ColorTheme } from './themes.ts';
import type { ActivityDay } from './activity.ts';

export const COURSE_SCHEMA_VERSION = 2;
export const USERDATA_SCHEMA_VERSION = 3;

// ---------- Course content (what a course file provides) ----------

export type QuestionKind =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'fill-blank'
  | 'numeric'
  | 'multi-select'
  | 'matching'
  | 'ordering';

/** A matching question's canonical pair: one prompt on the left and its one correct right. */
export interface QuestionPair {
  left: string;
  right: string;
}

/** Everything a question may use as its accepted answer, depending on `kind`. */
export type QuestionAnswer = number | boolean | string | string[] | number[];

/** Localized variants of one block's text, keyed by level (and media fields). */
export interface I18nText {
  normal?: string;
  simple?: string;
  detailed?: string;
  /** Callout/example bodies, and the image block's extra localized fields. */
  markdown?: string;
  alt?: string;
  caption?: string;
}

/** Localized question fields. Any missing field falls back to the top-level one. */
export interface QuestionI18n {
  prompt?: string;
  options?: string[];
  answer?: QuestionAnswer;
  explanation?: string;
  hint?: string;
  hints?: string[];
  /** Per-option "why that is not right" texts, parallel to `options`. */
  rationales?: string[];
  /** Localized matching pairs (same canonical order as the top-level `pairs`). */
  pairs?: QuestionPair[];
  /** Localized ordering items (same canonical order as the top-level `items`). */
  items?: string[];
}

export interface Question {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options?: string[];
  /**
   * The accepted answer. Optional on purpose: `matching` and `ordering` carry their correct answer
   * in `pairs`/`items` instead. Every other kind is checked by the validator to have one.
   */
  answer?: QuestionAnswer;
  /** Allowed distance from `answer` for a `numeric` question; defaults to 0 (exact). */
  tolerance?: number;
  /** Correct left/right pairs for a `matching` question, in canonical order. */
  pairs?: QuestionPair[];
  /** Items for an `ordering` question, in CANONICAL (correct) order. */
  items?: string[];
  /** Per-option "why that is not right" texts, parallel to `options`. */
  rationales?: string[];
  explanation?: string;
  /** Optional nudge the learner can reveal before retrying. */
  hint?: string;
  /**
   * Progressive hints, revealed one per click. The last step is the full solution, so the
   * learner can always finish on their own. A single `hint` still works as the fallback.
   */
  hints?: string[];
  /**
   * Mastery skill this question counts toward. Defaults to the id of the lesson it lives in;
   * questions inside a module test or the final exam should name the lesson's skill explicitly.
   */
  skillId?: string;
  /**
   * Questions that test the same thing but with different wording. When one of a group is due for
   * review, the exercise engine asks a sibling from the same group instead of the exact question.
   */
  variantGroup?: string;
  /** Optional per-language overrides; the top-level fields stay as the fallback. */
  i18n?: Record<string, QuestionI18n>;
}

/** Every block has an id and a type. Any other field is block-specific and optional for the core. */
export interface Block {
  id: string;
  type: string;
  /** Optional per-language text variants (used by text/callout blocks). */
  i18n?: Record<string, I18nText>;
  [key: string]: unknown;
}

export type ExplanationLevel = 'normal' | 'simple' | 'detailed';

export interface Lesson {
  id: string;
  title: string;
  goal?: string;
  blocks: Block[];
}

export interface Module {
  id: string;
  title: string;
  summary?: string;
  lessons: Lesson[];
  /** Optional end-of-module test, a block of type "module-test". */
  test?: Block;
}

export interface Course {
  schemaVersion: number;
  id: string;
  title: string;
  subject?: string;
  level?: string;
  language?: string;
  /** Languages this course offers content for. */
  languages?: string[];
  /** Content version of this course. Bump it when you re-import an improved version. */
  version?: number;
  meta?: { createdBy?: string; createdAt?: string; tags?: string[] };
  modules: Module[];
  /** Optional final exam, a block of type "final-exam". */
  finalExam?: Block;
}

// ---------- User data (stored separately from content) ----------

export interface AnswerRecord {
  given: unknown;
  correct: boolean;
  at: string;
  attempts: number;
  /**
   * True when the question was solved correctly without a wrong attempt and without a hint.
   * Mastery is measured in first-try answers, so this flag always travels with the answer.
   */
  solvedOnFirstTry?: boolean;
}

// ---------- Mastery (the one currency per skill) ----------

/** Tiers in order; always derived from points via `tierForPoints`, never stored on their own. */
export type MasteryTier = 'not-started' | 'attempted' | 'familiar' | 'proficient' | 'mastered';

/** One skill's mastery, where a skill is the questions belonging to one lesson. */
export interface SkillMastery {
  skillId: string;
  /** 0-100 mastery points: the single currency. The tier is derived from this. */
  points: number;
  /** Per-question first-try flags (questionId -> solved without a wrong attempt or a hint). */
  firstTry: Record<string, boolean>;
  /** When this skill was last practised (ISO). Optional: records saved before v3 have none. */
  lastPracticedAt?: string;
  /** How many times a question of this skill has ever been answered wrongly. */
  timesMissed?: number;
  updatedAt: string;
}

/** Spaced re-review of one missed question: when it is next due, and how often it was missed. */
export interface QuestionReview {
  questionId: string;
  /** When this question should be asked again (ISO). */
  nextAt: string;
  /** Consecutive misses, which drives the interval (1 day, then 3, then 7). */
  misses: number;
}

/** One graded attempt in the persistent mistake log. Entries with `correct: false` are mistakes. */
export interface MistakeLogEntry {
  questionId: string;
  skillId: string;
  moduleId: string | null;
  given: unknown;
  correct: boolean;
  at: string;
}

/** All mastery a course holds. Stored in the `mastery` IndexedDB store, keyed by courseId. */
export interface CourseMastery {
  courseId: string;
  skills: Record<string, SkillMastery>;
  /** Every graded attempt, newest last; capped so one course cannot grow forever. */
  mistakes: MistakeLogEntry[];
  /** Spaced re-review schedule, keyed by question id. Optional: records saved before v3 have none. */
  reviews?: Record<string, QuestionReview>;
  updatedAt: string;
}

/** What a block hands back when one question is graded. */
export interface MasteryAttempt {
  questionId: string;
  correct: boolean;
  /** True when a hint (or the full solution) was revealed before answering. */
  usedHint: boolean;
  /** What the learner answered, kept in the mistake log. */
  given: unknown;
}

export interface CourseProgress {
  courseId: string;
  courseVersion: number;
  position?: { lessonId: string };
  completedLessons: string[];
  answers: Record<string, AnswerRecord>;
  videoOverrides: Record<string, string>;
  /** Pasted image URLs keyed by block id. Optional: progress saved before image blocks have none. */
  imageOverrides?: Record<string, string>;
  /** Personal notes keyed by stable lesson id. */
  notes?: Record<string, string>;
  /** Private notes keyed by stable question id. */
  questionNotes?: Record<string, string>;
  /** Saved lesson, test, and exam item ids. */
  bookmarks?: string[];
  lastOpened: string;
}

export interface CourseMeta {
  courseId: string;
  customTitle?: string;
  archived?: boolean;
  tags?: string[];
}

/** How lessons, tests and modules unlock. */
export type GatingMode = 'locked' | 'free';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  colorTheme: ColorTheme;
  /** ISO timestamp of the last exported backup, or null when none was ever made. */
  lastBackupAt: string | null;
  fontSize: number;
  uiLanguage: 'en' | 'de';
  explanationLevel: ExplanationLevel;
  /** Language for explanations (text / example / callout blocks). */
  explanationLanguage: 'en' | 'de';
  /** Language for question prompts, options and answers. */
  questionLanguage: 'en' | 'de';
  autoplayVideo: boolean;
  libraryShowProgress: boolean;
  libraryShowLastOpened: boolean;
  backupReminderDismissed: boolean;
  reduceMotion: boolean;
  /** 'locked' keeps the in-order gates; 'free' opens every lesson, test and module. */
  gatingMode: GatingMode;
  profileName: string;
  profileColor: string;
  /** Optional handle shown under the display name on Home. */
  username?: string;
  /** Optional one-line bio shown under the display name on Home. */
  bio?: string;
}

/** A deleted course kept in the trash until it is restored or purged. */
export interface TrashedCourse {
  courseId: string;
  course: Course;
  meta?: CourseMeta;
  progress?: CourseProgress;
  mastery?: CourseMastery;
  deletedAt: string;
}

export interface Backup {
  /** Kept from before the rename to Courseify, so older backup files still restore. */
  kind: 'course-app-backup';
  schemaVersion: number;
  exportedAt: string;
  courses: Course[];
  progress: CourseProgress[];
  courseMeta: CourseMeta[];
  settings: Settings;
  /** Per-course mastery and mistake logs. Optional: backups from older apps have none. */
  mastery?: CourseMastery[];
  /** Day-by-day activity (streak / XP). Optional: backups from older apps have none. */
  activity?: ActivityDay[];
  /** Courses in the trash. Optional: backups from older apps have none. */
  trash?: TrashedCourse[];
}

// ---------- Block rendering contract ----------

/** What a block renderer may read and write. Renderers never touch storage directly. */
export interface BlockContext {
  courseId: string;
  /** The flat item being studied: a lesson id, "<moduleId>:test", or "final-exam". */
  lessonId: string;
  /** What kind of item that is. */
  itemKind: 'lesson' | 'test' | 'exam';
  /** Owning module id, or null in the final exam. */
  moduleId: string | null;
  explanationLevel: ExplanationLevel;
  explanationLanguage: 'en' | 'de';
  questionLanguage: 'en' | 'de';
  autoplayVideo: boolean;
  getAnswer(questionId: string): AnswerRecord | undefined;
  recordAnswer(questionId: string, record: AnswerRecord): void;
  getVideoOverride(blockId: string): string | undefined;
  setVideoOverride(blockId: string, url: string): void;
  /** A pasted image URL for a block, or undefined to use the course's own. */
  getImageOverride(blockId: string): string | undefined;
  setImageOverride(blockId: string, url: string): void;
  /** Mastery: which skill a question counts toward (the lesson id unless it names one). */
  skillIdFor(questionId: string): string;
  /** Display name of a skill, for the results screen. */
  skillTitleFor(skillId: string): string;
  getSkillMastery(skillId: string): SkillMastery | undefined;
  /** Records one graded attempt against its skill and the persistent mistake log. */
  recordMasteryAttempt(attempt: MasteryAttempt): void;
  /** 0-100 mastery points over a whole module. */
  getModuleMasteryPercent(moduleId: string): number;
  /** Host action for "Continue" at the end of a quiz set. */
  onSetContinue?(): void;
}

// ---------- Routing ----------

export type Route =
  | { name: 'home' }
  | { name: 'library' }
  | { name: 'player'; courseId: string; lessonId?: string }
  | { name: 'unit'; courseId: string; moduleId: string }
  | { name: 'import' }
  | { name: 'prompt' }
  | { name: 'settings' }
  | { name: 'profile' }
  | { name: 'stats' }
  | { name: 'review' }
  | { name: 'trash' }
  | { name: 'exercise'; courseId: string; skillId: string };
