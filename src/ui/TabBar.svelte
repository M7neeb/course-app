<script lang="ts">
  // The bottom tab bar: on phones it replaces the learner sidebar, so the main screens are one tap
  // away instead of behind the menu. The Simple layout shows it on every screen size.
  import { app } from '../core/state.svelte.ts';
  import { listMistakes } from '../core/mistakes.ts';
  import NavIcon from './NavIcon.svelte';
  import { t } from '../i18n/i18n.ts';

  const reviewCount = $derived(listMistakes(app.courses, app.progress, app.settings.questionLanguage).length);

  const tabs = [
    { route: 'home', href: '#/home', icon: 'home', key: 'home.nav.courses' },
    { route: 'review', href: '#/review', icon: 'review', key: 'home.nav.review' },
    { route: 'library', href: '#/library', icon: 'library', key: 'home.nav.library' },
    { route: 'stats', href: '#/stats', icon: 'stats', key: 'home.nav.progress' },
    { route: 'settings', href: '#/settings', icon: 'settings', key: 'home.nav.settings' }
  ] as const;
</script>

<nav class="cf-tabbar" aria-label={t('shell.tabs')}>
  {#each tabs as tab (tab.route)}
    {@const current = app.route.name === tab.route}
    <a href={tab.href} class:active={current} aria-current={current ? 'page' : undefined}>
      <span class="cf-tab-icon">
        <NavIcon name={tab.icon} size={22} />
        {#if tab.route === 'review' && reviewCount > 0}<span class="cf-tab-badge">{reviewCount > 99 ? '99+' : reviewCount}</span>{/if}
      </span>
      <span class="cf-tab-label">{t(tab.key)}</span>
    </a>
  {/each}
</nav>
