<script lang="ts">
  // The mastery square. Mastered is a dark purple tile with a crown, Proficient a light
  // purple tile, Familiar an orange outline half filled from the bottom, Attempted an orange outline
  // and Not started a grey outline. `kind` draws the grey quiz (lightning) or unit-test (star) tile
  // instead. Decorative: whatever sits next to it carries the words (or pass `label`).
  import type { MasteryTier } from '../core/types.ts';

  let {
    tier = 'not-started',
    kind = 'skill',
    size = 22,
    label
  }: { tier?: MasteryTier; kind?: 'skill' | 'quiz' | 'test'; size?: number; label?: string } = $props();

  const glyph = $derived(Math.round(size * 0.62));
</script>

<span
  class="mastery-icon"
  data-tier={kind === 'skill' ? tier : undefined}
  data-kind={kind}
  style:width={size + 'px'}
  style:height={size + 'px'}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  title={label}
>
  {#if kind === 'quiz'}
    <svg width={glyph} height={glyph} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2z" /></svg>
  {:else if kind === 'test'}
    <svg width={glyph} height={glyph} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>
  {:else if tier === 'mastered'}
    <svg width={glyph} height={glyph} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 7.5 8 11l4-5.5 4 5.5 4.5-3.5-1.6 10H5.1z" /></svg>
  {/if}
</span>
