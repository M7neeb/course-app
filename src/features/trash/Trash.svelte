<script lang="ts">
  // Trash: courses deleted in the last 30 days, restorable until they are purged.
  import { onMount } from 'svelte';
  import { app, purgeTrash, restoreCourse, showToast } from '../../core/state.svelte.ts';
  import { daysUntilPurge, sortTrash, TRASH_GRACE_DAYS } from '../../core/trash.ts';
  import type { TrashedCourse } from '../../core/types.ts';
  import { t } from '../../i18n/i18n.ts';

  const items = $derived(sortTrash(Object.values(app.trash)));

  onMount(() => {
    void purgeTrash();
  });

  function title(item: TrashedCourse): string {
    return item.meta?.customTitle || item.course.title;
  }

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(app.settings.uiLanguage, { dateStyle: 'medium' }).format(new Date(iso));
  }

  function remaining(item: TrashedCourse): string {
    const days = daysUntilPurge(item);
    return days <= 0 ? t('trash.purgeSoon') : t('trash.purgeIn', { n: days });
  }

  async function restore(item: TrashedCourse) {
    const name = title(item);
    await restoreCourse(item.courseId);
    showToast(t('toast.restored', { title: name }));
  }
</script>

<section class="stack">
  <div class="page-head">
    <h1>{t('trash.title')}</h1>
    {#if items.length > 0}<span class="muted small">{t('review.groupCount', { n: items.length })}</span>{/if}
  </div>
  <p class="muted">{t('trash.purgeNote')}</p>

  {#if items.length === 0}
    <div class="empty-state">
      <p class="lead">{t('trash.empty')}</p>
      <p>{t('trash.emptyHint')}</p>
    </div>
  {:else}
    <ul class="trash-list">
      {#each items as item (item.courseId)}
        <li class="trash-item">
          <div>
            <h2>{title(item)}</h2>
            <p class="muted small">
              {t('trash.deleted', { date: formatDate(item.deletedAt) })}
              <span class="trash-sep" aria-hidden="true">·</span>
              {remaining(item)}
            </p>
          </div>
          <button type="button" class="btn" onclick={() => restore(item)}>{t('trash.restore')}</button>
        </li>
      {/each}
    </ul>
    <p class="muted small">{t('trash.emptyHint')}</p>
  {/if}
</section>
