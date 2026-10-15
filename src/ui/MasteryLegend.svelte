<script lang="ts">
  // The mastery legend: Mastered down to Not started, then the Quiz and Unit test tiles.
  // One component so every screen that shows mastery squares explains them the same way.
  import { TIER_ORDER } from '../core/mastery.ts';
  import { masteryView } from '../core/masteryView.ts';
  import MasteryIcon from './MasteryIcon.svelte';
  import { t } from '../i18n/i18n.ts';

  // Highest tier first: Mastered -> Not started.
  const tiers = [...TIER_ORDER].reverse();
</script>

<ul class="mastery-legend" aria-label={t('mastery.legend.title')}>
  {#each tiers as tier (tier)}
    <li><MasteryIcon {tier} size={24} /><span>{t(masteryView(tier).labelKey)}</span></li>
  {/each}
  <li><MasteryIcon kind="quiz" size={24} /><span>{t('mastery.legend.quiz')}</span></li>
  <li><MasteryIcon kind="test" size={24} /><span>{t('mastery.legend.test')}</span></li>
</ul>
