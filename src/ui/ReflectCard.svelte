<script lang="ts">
  // Reflect on a lesson or a unit: a brain dump (write everything you remember, then compare with
  // the key points) and "explain it simply" (the Feynman technique). Both turn reading into active
  // recall. The screen owns saving; this card only edits a copy and calls `onSave`.
  import { untrack } from 'svelte';
  import { coveragePercent, dumpFeedbackPrompt, feynmanPrompt, guessCovered, longWords } from '../core/reflect.ts';
  import type { Lang } from '../core/localize.ts';
  import type { Reflection } from '../core/types.ts';
  import { copyText } from './clipboard.ts';
  import { t } from '../i18n/i18n.ts';

  let {
    topic,
    points,
    source,
    lang,
    reflection,
    scope = 'lesson',
    onSave
  }: {
    topic: string;
    points: string[];
    source: string;
    lang: Lang;
    reflection: Reflection | undefined;
    scope?: 'lesson' | 'unit';
    onSave: (patch: Partial<Reflection>) => void;
  } = $props();

  type Tab = 'dump' | 'explain';
  let tab = $state<Tab>('dump');
  // Local drafts start from what was saved last time (the card is re-created per lesson or unit).
  const saved = untrack(() => reflection);
  let dump = $state(saved?.dump ?? '');
  let explain = $state(saved?.explain ?? '');
  let compared = $state(saved?.covered !== undefined && (saved?.dump ?? '') !== '');
  let covered = $state<number[]>(saved?.covered ?? []);
  let copied = $state<string | null>(null);

  const percent = $derived(coveragePercent(covered, points.length));
  const missing = $derived(points.map((point, i) => ({ point, i })).filter((entry) => !covered.includes(entry.i)));
  const jargon = $derived(longWords(explain));
  const uid = $props.id();

  function compare() {
    covered = guessCovered(dump, points);
    compared = true;
    onSave({ dump, dumpAt: new Date().toISOString(), covered, total: points.length });
  }

  function toggle(index: number) {
    covered = covered.includes(index) ? covered.filter((i) => i !== index) : [...covered, index].sort((a, b) => a - b);
    onSave({ covered, total: points.length });
  }

  function restart() {
    dump = '';
    covered = [];
    compared = false;
  }

  function saveExplain() {
    onSave({ explain, explainAt: new Date().toISOString() });
    copied = 'saved';
  }

  async function copy(kind: 'dump' | 'explain') {
    const text = kind === 'dump' ? dumpFeedbackPrompt(topic, source, dump, lang) : feynmanPrompt(topic, explain, lang);
    if (await copyText(text)) copied = kind;
  }
</script>

<section class="cf-card cf-reflect" aria-labelledby="{uid}-title">
  <h2 id="{uid}-title">{scope === 'unit' ? t('reflect.unitTitle') : t('reflect.title')}</h2>
  <div class="cf-tabs" role="tablist" aria-label={t('reflect.title')}>
    <button type="button" role="tab" aria-selected={tab === 'dump'} class:active={tab === 'dump'} onclick={() => (tab = 'dump')}>{t('reflect.dump')}</button>
    <button type="button" role="tab" aria-selected={tab === 'explain'} class:active={tab === 'explain'} onclick={() => (tab = 'explain')}>{t('reflect.explain')}</button>
  </div>

  {#if tab === 'dump'}
    {#if !compared}
      <p class="cf-muted">{scope === 'unit' ? t('reflect.dumpIntroUnit', { topic }) : t('reflect.dumpIntro', { topic })}</p>
      <label class="sr-only" for="{uid}-dump">{t('reflect.dump')}</label>
      <textarea id="{uid}-dump" rows="6" bind:value={dump} placeholder={t('reflect.dumpPlaceholder')}></textarea>
      <div class="cf-actions">
        <button type="button" class="cf-btn cf-btn-primary" disabled={dump.trim() === '' || points.length === 0} onclick={compare}>{t('reflect.compare')}</button>
      </div>
    {:else}
      <p class="cf-reflect-score"><strong>{t('reflect.score', { n: covered.length, total: points.length, percent })}</strong></p>
      <p class="cf-muted cf-small">{t('reflect.tickHint')}</p>
      <ul class="cf-keypoints">
        {#each points as point, i (i)}
          <li>
            <label class="check">
              <input type="checkbox" checked={covered.includes(i)} onchange={() => toggle(i)} />
              <span class:cf-missed={!covered.includes(i)}>{point}</span>
            </label>
          </li>
        {/each}
      </ul>
      {#if missing.length > 0}
        <p class="cf-small">{t('reflect.refine', { n: missing.length })}</p>
      {:else}
        <p class="cf-small">{t('reflect.allCovered')}</p>
      {/if}
      <details class="cf-reflect-dump">
        <summary>{t('reflect.yourDump')}</summary>
        <p class="cf-pre">{dump}</p>
      </details>
      <div class="cf-actions">
        <button type="button" class="cf-btn cf-btn-secondary" onclick={() => copy('dump')}>{copied === 'dump' ? t('create.copied') : t('reflect.copyDump')}</button>
        <button type="button" class="cf-btn cf-btn-ghost" onclick={restart}>{t('reflect.again')}</button>
      </div>
    {/if}
  {:else}
    <p class="cf-muted">{t('reflect.explainIntro', { topic })}</p>
    <label class="sr-only" for="{uid}-explain">{t('reflect.explain')}</label>
    <textarea id="{uid}-explain" rows="6" bind:value={explain} placeholder={t('reflect.explainPlaceholder')}></textarea>
    {#if jargon.length > 0}
      <p class="cf-small cf-jargon">{t('reflect.jargon', { words: jargon.join(', ') })}</p>
    {/if}
    <ul class="cf-reflect-checks cf-small">
      <li>{t('reflect.check.example')}</li>
      <li>{t('reflect.check.steps')}</li>
      <li>{t('reflect.check.gaps')}</li>
    </ul>
    <div class="cf-actions">
      <button type="button" class="cf-btn cf-btn-primary" disabled={explain.trim() === ''} onclick={saveExplain}>{copied === 'saved' ? t('reflect.saved') : t('reflect.save')}</button>
      <button type="button" class="cf-btn cf-btn-secondary" disabled={explain.trim() === ''} onclick={() => copy('explain')}>{copied === 'explain' ? t('create.copied') : t('reflect.copyExplain')}</button>
    </div>
  {/if}
</section>
