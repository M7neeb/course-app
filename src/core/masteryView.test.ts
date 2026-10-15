import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MASTERY_VIEW, isCheckedTier, masteryView } from './masteryView.ts';
import { TIER_ORDER } from './mastery.ts';
import type { MasteryTier } from './types.ts';

test('every tier has exactly one view, and nothing else is in the table', () => {
  assert.deepEqual(Object.keys(MASTERY_VIEW).sort(), [...TIER_ORDER].sort());
});

test('each view labels its own tier with the shared i18n key', () => {
  for (const tier of TIER_ORDER) {
    assert.equal(MASTERY_VIEW[tier].tier, tier);
    assert.equal(MASTERY_VIEW[tier].labelKey, 'mastery.tier.' + tier);
  }
});

test('colours come from theme tokens, never a hardcoded value', () => {
  for (const tier of TIER_ORDER) {
    assert.match(MASTERY_VIEW[tier].color, /var\(--/, tier);
    assert.match(MASTERY_VIEW[tier].softColor, /var\(--/, tier);
  }
});

test('only Proficient and Mastered draw the check', () => {
  assert.equal(isCheckedTier('mastered'), true);
  assert.equal(isCheckedTier('proficient'), true);
  assert.equal(isCheckedTier('familiar'), false);
  assert.equal(isCheckedTier('attempted'), false);
  assert.equal(isCheckedTier('not-started'), false);
});

test('an unknown tier falls back to Not started', () => {
  assert.equal(masteryView('made-up' as MasteryTier).tier, 'not-started');
});
