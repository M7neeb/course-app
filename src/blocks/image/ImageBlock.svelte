<script lang="ts">
  import type { Block, BlockContext } from '../../core/types.ts';
  import { imageSearchUrl } from '../../core/image-search.ts';
  import { resolveImageAlt, resolveImageCaption } from '../../core/localize.ts';
  import { t } from '../../i18n/i18n.ts';

  let { block, ctx }: { block: Block; ctx: BlockContext } = $props();

  // A link you pasted yourself always wins over whatever the course file contains.
  const url = $derived(ctx.getImageOverride(block.id) ?? (typeof block.url === 'string' ? block.url : undefined));
  const searchTerm = $derived(typeof block.searchTerm === 'string' ? block.searchTerm : '');
  const alt = $derived(resolveImageAlt(block, ctx.explanationLanguage));
  const caption = $derived(resolveImageCaption(block, ctx.explanationLanguage));

  let draft = $state('');
  let error = $state('');
  let changing = $state(false);

  function save() {
    const value = draft.trim();
    if (!/^https?:\/\//i.test(value)) {
      error = t('image.invalid');
      return;
    }
    ctx.setImageOverride(block.id, value);
    draft = '';
    error = '';
    changing = false;
  }
</script>

<section class="block image">
  {#if url}
    <figure class="image-figure">
      <img src={url} alt={alt} loading="lazy" referrerpolicy="no-referrer" />
      {#if caption}<figcaption>{caption}</figcaption>{/if}
    </figure>
    <p class="image-links">
      <button type="button" class="link" onclick={() => (changing = !changing)}>{t('image.change')}</button>
    </p>
  {:else if searchTerm}
    <figure class="image-placeholder">
      <p class="image-search-provider">{t('image.searchTerm')}</p>
      <p class="image-term">{searchTerm}</p>
      {#if alt}<p class="image-alt">{alt}</p>{/if}
      <a class="btn" href={imageSearchUrl(searchTerm)} target="_blank" rel="noopener noreferrer">{t('image.search')}</a>
    </figure>
  {/if}

  {#if !url || changing}
    <div class="image-paste">
      <label for={'img-' + block.id}>{t('image.paste')}</label>
      <div class="row">
        <input id={'img-' + block.id} type="url" bind:value={draft} placeholder="https://…/diagram.png" />
        <button type="button" class="btn" onclick={save}>{t('image.save')}</button>
      </div>
      {#if error}<p class="field-error" role="alert">{error}</p>{/if}
    </div>
  {/if}
</section>
