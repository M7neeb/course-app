// The single source of truth for the app version and the "What's new" list.
// Bump VERSION and add one CHANGELOG entry at the top when you ship user-visible changes.

export const VERSION = '1.0.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

/** Newest first. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-10-15',
    changes: [
      'The app is now called Courseify, with a new icon.',
      'A new look throughout: Explore by subject, a course sidebar, unit pages with mastery squares, and cleaner lessons, practice and review.',
      'Progress shows your mastery by subject, course and unit, and which skills to practise next.',
      'Lesson videos play right inside the lesson.',
      'A new course builder: answer six steps and get prompts for the outline, every unit and the final exam, written to produce better courses.',
      'German and English courses get a language switch inside each lesson.',
      'Removed the notebook and private question notes to keep things focused.'
    ]
  },
  {
    version: '0.8.0',
    date: '2026-10-14',
    changes: [
      'New Home screen, "My courses": a greeting with your week streak, level and skills, your profile header, and one card per course.',
      'Each course card lists its units with a mastery mark, a status line and a Resume or Start button; a unit row jumps straight into that unit.',
      'One shared mastery style (label, colour, mark) now drives every mastery indicator, so all colour themes stay consistent.'
    ]
  },
  {
    version: '0.7.0',
    date: '2026-10-14',
    changes: [
      'Practice sets: every lesson can be practised as a skill - a set of questions that puts what you missed first, then what you have not tried yet.',
      'Spaced re-review: a question you get wrong comes back in a day, then in three, then in seven, and a variant of the same question is preferred when one exists.',
      'Gating is now a setting: keep lessons locked in order, or open everything at once while still showing the recommended mastery and the jump to your weakest skill.'
    ]
  },
  {
    version: '0.6.0',
    date: '2026-10-14',
    changes: [
      'Mastery: every lesson is a skill that earns 0-100 mastery points, with tiers from Not started to Mastered.',
      'Gating: lessons, module tests and modules unlock in order, and a locked item always shows the requirement, your current value and a jump to the weakest skill.',
      'Quiz flow: wrong answers no longer advance, hints are progressive steps, and every set ends with a results screen.',
      'Results screen: first-try score, per-skill mastery change, a module mastery bar, and the mistakes you made with the full explanation.'
    ]
  },
  {
    version: '0.5.0',
    date: '2026-10-11',
    changes: [
      'Add a personal learning dashboard, profile menu and editable local profile.',
      'Add four complete colour palettes, activity-calendar labels, custom course levels and a dismissible backup reminder.'
    ]
  },
  {
    version: '0.4.0',
    date: '2026-10-11',
    changes: [
      'Rework the library into a resume-first course list and give lessons a calmer, wider reading layout.',
      'Add a searchable notebook for lesson and question notes, saved lessons, and Markdown export.',
      'Add interactive flashcard decks, a distraction-reduced focus mode, and lesson keyboard shortcuts.'
    ]
  },
  {
    version: '0.3.0',
    date: '2026-10-11',
    changes: [
      'Add private notes to lessons and individual quiz questions; notes are included in backups.',
      'Search the course library, edit course tags, and sort by recent activity, title or progress.',
      'Refresh the app shell, lesson reader, quiz cards, library and controls for a clearer, more comfortable study experience.'
    ]
  },
  {
    version: '0.2.0',
    date: '2026-10-11',
    changes: [
      'New left-sidebar layout, with the current course outline under the navigation.',
      'Colour themes now recolour the whole app, each with a full light and dark palette.',
      'Review screen: practise only the questions you got wrong.',
      'Deleting a course moves it to Trash, with undo and a 30-day grace period.',
      'Backup reminder that shows how long ago you last exported a backup.',
      'Settings shows the version number and this list of changes.'
    ]
  },
  {
    version: '0.1.0',
    date: '2026-10-10',
    changes: ['First release: import course packs, read lessons, answer quizzes, track streaks and XP.']
  }
];

/** The change list for one version, or undefined if that version is not recorded. */
export function changelogFor(version: string): ChangelogEntry | undefined {
  return CHANGELOG.find((entry) => entry.version === version);
}
