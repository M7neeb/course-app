<script lang="ts">
  // A YouTube video, ready to play inside the lesson. Course files carry the
  // link; a link that does not lead to a real video (YouTube serves its small placeholder thumbnail
  // for unknown ids) hides the block instead of showing a broken player. No link, no block.
  import type { Block, BlockContext } from '../../core/types.ts';
  import { videoIdOf, youtubeEmbedUrl, youtubeThumbnailUrl } from '../../core/youtube.ts';
  import { t } from '../../i18n/i18n.ts';

  let { block, ctx }: { block: Block; ctx: BlockContext } = $props();

  // A link saved for this block earlier still wins over the course file.
  const override = $derived(ctx.getVideoOverride(block.id));
  const videoId = $derived(videoIdOf(override ?? block.url));
  const title = $derived(typeof block.title === 'string' && block.title.trim() !== '' ? block.title : '');

  let missing = $state(false);
  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);

  $effect(() => {
    const id = videoId;
    missing = false;
    if (!id || typeof Image === 'undefined') return;
    const probe = new Image();
    probe.onload = () => {
      // Unknown ids get a 120 x 90 placeholder; real videos have a 320 x 180 thumbnail.
      if (probe.naturalWidth > 0 && probe.naturalWidth <= 120) missing = true;
    };
    probe.src = youtubeThumbnailUrl(id);
  });
</script>

<svelte:window ononline={() => (online = true)} onoffline={() => (online = false)} />

{#if videoId && !missing}
  <section class="block video" aria-label={title || t('video.title')}>
    {#if title}<h2 class="video-title">{title}</h2>{/if}
    <div class="video-frame">
      {#if online}
        <iframe
          src={youtubeEmbedUrl(videoId, ctx.autoplayVideo)}
          title={title || t('video.title')}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      {:else}
        <p class="video-offline">{t('video.offline')}</p>
      {/if}
    </div>
  </section>
{/if}
