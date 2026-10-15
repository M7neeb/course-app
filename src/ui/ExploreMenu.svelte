<script lang="ts">
  // The "Explore" dropdown: every course grouped under its subject. Picking a course opens the
  // unit the learner was last in. Built on <details> so it works with keyboard and touch for free.
  import { app, displayTitle, navigate } from '../core/state.svelte.ts';
  import { entryModuleId, groupBySubject } from '../core/home.ts';
  import type { Course } from '../core/types.ts';
  import { t } from '../i18n/i18n.ts';

  let open = $state(false);

  const groups = $derived(
    groupBySubject(
      app.courses.filter((course) => !app.meta[course.id]?.archived),
      app.settings.uiLanguage
    )
  );

  function openCourse(course: Course) {
    open = false;
    const moduleId = entryModuleId(course, app.progress[course.id]);
    if (moduleId) navigate({ name: 'unit', courseId: course.id, moduleId });
    else navigate({ name: 'player', courseId: course.id });
  }

  function go(name: 'library' | 'import' | 'prompt') {
    open = false;
    navigate({ name });
  }
</script>

<details class="cf-explore" bind:open>
  <summary>{t('explore.title')}<span class="cf-caret" aria-hidden="true"></span></summary>
  <div class="cf-explore-panel" role="region" aria-label={t('explore.label')}>
    {#if groups.length === 0}
      <p class="cf-explore-empty">{t('explore.empty')}</p>
    {:else}
      <div class="cf-explore-grid">
        {#each groups as group (group.subject)}
          <section>
            <h2>{group.subject || t('explore.other')}</h2>
            <ul>
              {#each group.courses as course (course.id)}
                <li><button type="button" onclick={() => openCourse(course)}>{displayTitle(course)}</button></li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>
    {/if}
    <div class="cf-explore-foot">
      <button type="button" onclick={() => go('library')}>{t('explore.library')}</button>
      <button type="button" onclick={() => go('import')}>{t('home.nav.import')}</button>
      <button type="button" onclick={() => go('prompt')}>{t('home.nav.create')}</button>
    </div>
  </div>
</details>
