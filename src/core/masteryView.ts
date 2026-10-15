// Shared mastery "apparel": the ONE place that maps a mastery tier to its label, colour and mark.
// Screens (Home, the legend, and anything else that shows mastery) read this instead of hardcoding
// colours. The colours come from the shared ramp tokens supplied by themeCss(), so the
// ramp is identical on every screen and every theme.

import type { MasteryTier } from './types.ts';

/** Which mark the tier draws: a filled circle with a check, or an outline ring. */
export type MasteryMark = 'check' | 'ring';

export interface MasteryView {
  tier: MasteryTier;
  /** i18n key for the tier's name (the shared mastery.tier.* strings). */
  labelKey: string;
  /** The tier's colour, built from the active theme's tokens. */
  color: string;
  /** A soft tint of the tier's colour, for backgrounds. */
  softColor: string;
  /** The mark to draw: Proficient and Mastered get the check, everything else a ring. */
  mark: MasteryMark;
}

export const MASTERY_VIEW: Record<MasteryTier, MasteryView> = {
  'not-started': {
    tier: 'not-started',
    labelKey: 'mastery.tier.not-started',
    color: 'var(--mastery-not-started)',
    softColor: 'var(--accent-soft)',
    mark: 'ring'
  },
  attempted: {
    tier: 'attempted',
    labelKey: 'mastery.tier.attempted',
    color: 'var(--mastery-attempted)',
    softColor: 'var(--accent-soft)',
    mark: 'ring'
  },
  familiar: {
    tier: 'familiar',
    labelKey: 'mastery.tier.familiar',
    color: 'var(--mastery-familiar)',
    softColor: 'var(--accent-soft)',
    mark: 'ring'
  },
  proficient: {
    tier: 'proficient',
    labelKey: 'mastery.tier.proficient',
    color: 'var(--mastery-proficient)',
    softColor: 'var(--good-soft)',
    mark: 'check'
  },
  mastered: {
    tier: 'mastered',
    labelKey: 'mastery.tier.mastered',
    color: 'var(--mastery-mastered)',
    softColor: 'var(--good-soft)',
    mark: 'check'
  }
};

/** The view for a tier, falling back to "Not started" for anything unknown. */
export function masteryView(tier: MasteryTier): MasteryView {
  return MASTERY_VIEW[tier] ?? MASTERY_VIEW['not-started'];
}

/** Proficient and above draw the filled check; the earlier tiers draw a progress ring. */
export function isCheckedTier(tier: MasteryTier): boolean {
  return masteryView(tier).mark === 'check';
}
