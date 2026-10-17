<script lang="ts">
  import { app, exportBackup, navigate, showToast, updateSettings } from '../../core/state.svelte.ts';
  import { downloadJson } from '../../core/download.ts';
  import { COLOR_THEMES, PALETTES } from '../../core/themes.ts';
  import { backupStatus } from '../../core/backup.ts';
  import { STUDY_STYLES, currentStudyStyle, type StudyStyle } from '../../core/settings.ts';
  import { CHANGELOG, VERSION } from '../../core/version.ts';
  import type { ExplanationLevel, Settings } from '../../core/types.ts';
  import { t } from '../../i18n/i18n.ts';

  const backup = $derived(backupStatus(app.settings.lastBackupAt));
  const trashCount = $derived(Object.keys(app.trash).length);
  const STYLE_NAMES = Object.keys(STUDY_STYLES) as StudyStyle[];
  const style = $derived(currentStudyStyle(app.settings));

  const backupText = $derived.by(() => {
    if (backup.days === null) return t('backup.last', { when: t('backup.never') });
    if (backup.days === 0) return t('backup.last', { when: t('backup.today') });
    return t('backup.last', { when: t('backup.daysAgo', { n: backup.days }) });
  });

  async function backupData() {
    // Stamp the export time first so the downloaded file carries it too.
    await updateSettings({ lastBackupAt: new Date().toISOString() });
    const data = await exportBackup();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`courseify-backup-${stamp}.json`, data);
    showToast(t('settings.backupDone'));
  }
</script>

<section class="stack">
  <div class="page-head">
    <h1>{t('settings.title')}</h1>
    <span class="muted small">{t('settings.version', { version: VERSION })}</span>
  </div>

  <fieldset>
    <legend>{t('settings.appearance')}</legend>
    <label>{t('settings.theme')}
      <select value={app.settings.theme} onchange={(e) => updateSettings({ theme: e.currentTarget.value as Settings['theme'] })}>
        <option value="system">{t('theme.system')}</option>
        <option value="light">{t('theme.light')}</option>
        <option value="dark">{t('theme.dark')}</option>
      </select>
    </label>
    <div class="theme-picker">
      <span class="theme-picker-label">{t('settings.colorTheme')}</span>
      <div class="theme-choices" role="group" aria-label={t('settings.colorTheme')}>
        {#each COLOR_THEMES as theme (theme)}
          <button type="button" class="theme-choice" aria-pressed={app.settings.colorTheme === theme} onclick={() => updateSettings({ colorTheme: theme })}>
            <span class="theme-swatch" style:background={PALETTES[theme].light.accent}></span>{t('colorTheme.' + theme)}
          </button>
        {/each}
      </div>
    </div>
    <label>{t('settings.fontSize')}: {app.settings.fontSize}px
      <input type="range" min="14" max="24" step="1" value={app.settings.fontSize} oninput={(e) => updateSettings({ fontSize: Number(e.currentTarget.value) })} />
    </label>
    <label class="check">
      <input type="checkbox" checked={app.settings.reduceMotion} onchange={(e) => updateSettings({ reduceMotion: e.currentTarget.checked })} />
      {t('settings.reduceMotion')}
    </label>
    <label>{t('settings.readingFont')}
      <select value={app.settings.readingFont} onchange={(e) => updateSettings({ readingFont: e.currentTarget.value as Settings['readingFont'] })}>
        <option value="default">{t('settings.readingFont.default')}</option>
        <option value="hyperlegible">{t('settings.readingFont.hyperlegible')}</option>
      </select>
    </label>
    <label>{t('settings.lineSpacing')}
      <select value={app.settings.lineSpacing} onchange={(e) => updateSettings({ lineSpacing: e.currentTarget.value as Settings['lineSpacing'] })}>
        <option value="normal">{t('settings.lineSpacing.normal')}</option>
        <option value="relaxed">{t('settings.lineSpacing.relaxed')}</option>
        <option value="loose">{t('settings.lineSpacing.loose')}</option>
      </select>
    </label>
    <label>{t('settings.language')}
      <select value={app.settings.uiLanguage} onchange={(e) => updateSettings({ uiLanguage: e.currentTarget.value as Settings['uiLanguage'] })}>
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </label>
  </fieldset>

  <fieldset>
    <legend>{t('settings.learning')}</legend>
    <label>{t('settings.explanation')}
      <select value={app.settings.explanationLevel} onchange={(e) => updateSettings({ explanationLevel: e.currentTarget.value as ExplanationLevel })}>
        <option value="normal">{t('level.normal')}</option>
        <option value="simple">{t('level.simple')}</option>
        <option value="detailed">{t('level.detailed')}</option>
      </select>
    </label>
    <label>{t('settings.explanationLanguage')}
      <select value={app.settings.explanationLanguage} onchange={(e) => updateSettings({ explanationLanguage: e.currentTarget.value as Settings['explanationLanguage'] })}>
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </label>
    <label>{t('settings.questionLanguage')}
      <select value={app.settings.questionLanguage} onchange={(e) => updateSettings({ questionLanguage: e.currentTarget.value as Settings['questionLanguage'] })}>
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </label>
    <label class="check">
      <input type="checkbox" checked={app.settings.autoplayVideo} onchange={(e) => updateSettings({ autoplayVideo: e.currentTarget.checked })} />
      {t('settings.autoplay')}
    </label>
    <label>{t('settings.gating')}
      <select value={app.settings.gatingMode} onchange={(e) => updateSettings({ gatingMode: e.currentTarget.value as Settings['gatingMode'] })}>
        <option value="locked">{t('settings.gating.locked')}</option>
        <option value="free">{t('settings.gating.free')}</option>
      </select>
    </label>
    <p class="muted small">{t('settings.gatingHint')}</p>
  </fieldset>

  <fieldset>
    <legend>{t('settings.howYouLearn')}</legend>
    <p class="muted small">{t('settings.learningHint')}</p>
    <div class="cf-study-styles" role="group" aria-label={t('settings.studyStyle')}>
      {#each STYLE_NAMES as name (name)}
        <button type="button" class="theme-choice" aria-pressed={style === name} onclick={() => updateSettings(STUDY_STYLES[name])}>{t('settings.style.' + name)}</button>
      {/each}
    </div>
    <p class="muted small">{style ? t('settings.style.' + style + 'Hint') : t('settings.style.custom')}</p>

    <h3 class="settings-sub">{t('settings.memory')}</h3>
    <label>{t('settings.retention')}
      <select value={String(app.settings.desiredRetention)} onchange={(e) => updateSettings({ desiredRetention: Number(e.currentTarget.value) })}>
        {#each [0.8, 0.85, 0.9, 0.95] as r (r)}<option value={String(r)}>{t('settings.retention.' + Math.round(r * 100))}</option>{/each}
      </select>
    </label>
    <p class="muted small">{t('settings.retentionHint')}</p>
    <label>{t('settings.dailyReviews')}
      <select value={String(app.settings.dailyReviewLimit)} onchange={(e) => updateSettings({ dailyReviewLimit: Number(e.currentTarget.value) })}>
        {#each [10, 20, 30, 50, 100] as n (n)}<option value={String(n)}>{n}</option>{/each}
      </select>
    </label>
    <p class="muted small">{t('settings.dailyReviewsHint')}</p>
    <label class="check">
      <input type="checkbox" checked={app.settings.interleavePractice} onchange={(e) => updateSettings({ interleavePractice: e.currentTarget.checked })} />
      {t('settings.interleave')}
    </label>
    <p class="muted small">{t('settings.interleaveHint')}</p>

    <h3 class="settings-sub">{t('settings.questions')}</h3>
    <label class="check">
      <input type="checkbox" checked={app.settings.askConfidence} onchange={(e) => updateSettings({ askConfidence: e.currentTarget.checked })} />
      {t('settings.askConfidence')}
    </label>
    <p class="muted small">{t('settings.askConfidenceHint')}</p>
    <label class="check">
      <input type="checkbox" checked={app.settings.recallFirst} onchange={(e) => updateSettings({ recallFirst: e.currentTarget.checked })} />
      {t('settings.recallFirst')}
    </label>
    <p class="muted small">{t('settings.recallFirstHint')}</p>
    <label class="check">
      <input type="checkbox" checked={app.settings.allowHints} onchange={(e) => updateSettings({ allowHints: e.currentTarget.checked })} />
      {t('settings.allowHints')}
    </label>
    <p class="muted small">{t('settings.allowHintsHint')}</p>
    <label class="check">
      <input type="checkbox" checked={app.settings.acceptTypos} onchange={(e) => updateSettings({ acceptTypos: e.currentTarget.checked })} />
      {t('settings.acceptTypos')}
    </label>

    <h3 class="settings-sub">{t('settings.lessons')}</h3>
    <label class="check">
      <input type="checkbox" checked={app.settings.showWarmups} onchange={(e) => updateSettings({ showWarmups: e.currentTarget.checked })} />
      {t('settings.showWarmups')}
    </label>
    <p class="muted small">{t('settings.showWarmupsHint')}</p>
    <label class="check">
      <input type="checkbox" checked={app.settings.showReflect} onchange={(e) => updateSettings({ showReflect: e.currentTarget.checked })} />
      {t('settings.showReflect')}
    </label>
    <p class="muted small">{t('settings.showReflectHint')}</p>
  </fieldset>

  <fieldset>
    <legend>{t('settings.motivation')}</legend>
    <label>{t('settings.dailyGoal')}
      <select value={String(app.settings.dailyGoal)} onchange={(e) => updateSettings({ dailyGoal: Number(e.currentTarget.value) })}>
        {#each [0, 30, 50, 100, 200] as n (n)}<option value={String(n)}>{n === 0 ? t('settings.dailyGoalOff') : t('settings.dailyGoalXp', { n })}</option>{/each}
      </select>
    </label>
    <p class="muted small">{t('settings.dailyGoalHint')}</p>
    <label class="check">
      <input type="checkbox" checked={app.settings.celebrations} onchange={(e) => updateSettings({ celebrations: e.currentTarget.checked })} />
      {t('settings.celebrations')}
    </label>
    <label class="check">
      <input type="checkbox" checked={app.settings.sounds} onchange={(e) => updateSettings({ sounds: e.currentTarget.checked })} />
      {t('settings.sounds')}
    </label>
  </fieldset>

  <fieldset>
    <legend>{t('settings.library')}</legend>
    <label class="check">
      <input type="checkbox" checked={app.settings.libraryShowProgress} onchange={(e) => updateSettings({ libraryShowProgress: e.currentTarget.checked })} />
      {t('settings.showProgress')}
    </label>
    <label class="check">
      <input type="checkbox" checked={app.settings.libraryShowLastOpened} onchange={(e) => updateSettings({ libraryShowLastOpened: e.currentTarget.checked })} />
      {t('settings.showLastOpened')}
    </label>
  </fieldset>

  <fieldset>
    <legend>{t('settings.data')}</legend>
    <p class="muted">{t('settings.backupHint')}</p>
    <p class="backup-note" class:warn={backup.stale}>{backupText}</p>
    {#if backup.stale}<p class="muted small">{t('backup.warn')}</p>{/if}
    <div class="row">
      <button type="button" class="btn primary" onclick={backupData}>{t('settings.backup')}</button>
      <button type="button" class="btn" onclick={() => navigate({ name: 'trash' })}>
        {t('settings.trashLink')}{#if trashCount > 0} ({trashCount}){/if}
      </button>
    </div>
    <label class="check">
      <input type="checkbox" checked={!app.settings.backupReminderDismissed} onchange={(e) => updateSettings({ backupReminderDismissed: !e.currentTarget.checked })} />
      {t('settings.backupReminder')}
    </label>
    <p class="muted small">{app.persisted ? t('settings.persisted.yes') : t('settings.persisted.no')}</p>
  </fieldset>

  <fieldset>
    <legend>{t('settings.whatsNew')}</legend>
    <ul class="changelog">
      {#each CHANGELOG as entry (entry.version)}
        <li>
          <p class="changelog-head">
            <span class="badge">{entry.version}</span>
            <span class="muted small">{entry.date}</span>
          </p>
          <ul>
            {#each entry.changes as change (change)}<li>{change}</li>{/each}
          </ul>
        </li>
      {/each}
    </ul>
  </fieldset>
</section>
