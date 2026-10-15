<script lang="ts">
  import { untrack } from 'svelte';
  import {
    app,
    displayTitle,
    getCourse,
    moduleMasteryPercentFor,
    navigate,
    recordActivity,
    recordMasteryAttempt as recordMastery,
    updateProgress,
    updateSettings
  } from '../../core/state.svelte.ts';
  import { blockLanguages, type Lang } from '../../core/localize.ts';
  import { flattenCourse } from '../../core/course-utils.ts';
  import { gateForItem, openGate } from '../../core/gating.ts';
  import { MASTERY, courseSkills, itemForSkill, skillIndex, skillTitle } from '../../core/mastery.ts';
  import type { BlockContext, MasteryTier } from '../../core/types.ts';
  import { getBlockRenderer } from '../../blocks/registry.ts';
  import UnknownBlock from '../../blocks/unknown/UnknownBlock.svelte';
  import NavIcon from '../../ui/NavIcon.svelte';
  import { t } from '../../i18n/i18n.ts';

  let { courseId, lessonId }: { courseId: string; lessonId?: string } = $props();

  const course = $derived(getCourse(courseId));
  const items = $derived(course ? flattenCourse(course) : []);
  const progress = $derived(app.progress[courseId]);
  const completed = $derived(new Set(progress?.completedLessons ?? []));
  const upNext = $derived(items.find((i) => !completed.has(i.id)));

  // Lessons unlock in order but any lesson can be opened: the URL decides, then the saved position.
  const current = $derived(
    items.find((i) => i.id === lessonId) ??
      items.find((i) => i.id === progress?.position?.lessonId) ??
      upNext ??
      items[0]
  );
  const index = $derived(current ? items.findIndex((i) => i.id === current.id) : -1);
  const prev = $derived(index > 0 ? items[index - 1] : undefined);
  const next = $derived(index >= 0 && index < items.length - 1 ? items[index + 1] : undefined);
  const finished = $derived(items.length > 0 && items.every((i) => completed.has(i.id)));
  const unit = $derived(course?.modules.find((m) => m.id === current?.moduleId));
  const unitNumber = $derived(course && unit ? course.modules.indexOf(unit) + 1 : 0);
  // The DE/EN switch only appears when this lesson really has content in both languages.
  const languages = $derived(current ? blockLanguages(current.blocks) : []);

  function setLanguage(lang: Lang) {
    void updateSettings({ explanationLanguage: lang, questionLanguage: lang });
  }

  let notes = $state('');
  let noteSaveTimer: ReturnType<typeof setTimeout> | undefined;

  async function saveNote(targetCourseId: string, id: string, value: string) {
    await updateProgress(targetCourseId, (p) => {
      p.notes ??= {};
      if (value.trim().length > 0) p.notes[id] = value;
      else delete p.notes[id];
    });
  }

  function queueNoteSave(targetCourseId: string, id: string, value: string) {
    clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(() => void saveNote(targetCourseId, id, value), 500);
  }

  function flushNoteSave(targetCourseId: string, id: string, value: string) {
    clearTimeout(noteSaveTimer);
    void saveNote(targetCourseId, id, value);
  }

  $effect(() => {
    const id = current?.kind === 'lesson' ? current.id : undefined;
    if (!id) {
      notes = '';
      return;
    }
    const targetCourseId = courseId;
    const saved = untrack(() => app.progress[targetCourseId]?.notes?.[id] ?? '');
    notes = saved;
    return () => {
      untrack(() => {
        clearTimeout(noteSaveTimer);
        if (notes !== saved) void saveNote(targetCourseId, id, notes);
      });
    };
  });

  function itemTitle(item: { kind: string; title: string }): string {
    if (item.kind === 'test') return t('mastery.legend.test');
    if (item.kind === 'exam') return t('exam.final');
    return item.title;
  }

  // Remember where you are. Only the lesson id is tracked here; saving is not.
  $effect(() => {
    const id = current?.id;
    if (!id) return;
    untrack(() => {
      void updateProgress(courseId, (p) => {
        p.position = { lessonId: id };
      });
    });
  });

  const ctx = $derived<BlockContext | undefined>(
    current
      ? {
          courseId,
          lessonId: current.id,
          itemKind: current.kind,
          moduleId: current.moduleId,
          explanationLevel: app.settings.explanationLevel,
          explanationLanguage: app.settings.explanationLanguage,
          questionLanguage: app.settings.questionLanguage,
          autoplayVideo: app.settings.autoplayVideo,
          getAnswer: (qid) => app.progress[courseId]?.answers[qid],
          recordAnswer: (qid, record) => {
            const wasCorrect = app.progress[courseId]?.answers[qid]?.correct === true;
            void updateProgress(courseId, (p) => {
              p.answers[qid] = record;
            });
            if (record.correct && !wasCorrect) void recordActivity('correct');
          },
          getVideoOverride: (bid) => app.progress[courseId]?.videoOverrides[bid],
          setVideoOverride: (bid, url) => {
            void updateProgress(courseId, (p) => {
              p.videoOverrides[bid] = url;
            });
          },
          getImageOverride: (bid) => app.progress[courseId]?.imageOverrides?.[bid],
          setImageOverride: (bid, url) => {
            void updateProgress(courseId, (p) => {
              p.imageOverrides ??= {};
              p.imageOverrides[bid] = url;
            });
          },
          skillIdFor: (qid) => questionSkills.get(qid) ?? current.id,
          skillTitleFor: (sid) => (course ? skillTitle(course, sid) : sid),
          getSkillMastery: (sid) => app.mastery[courseId]?.skills[sid],
          recordMasteryAttempt: (attempt) => recordMastery(courseId, attempt),
          getModuleMasteryPercent: (mid) => moduleMasteryPercentFor(courseId, mid),
          onSetContinue: () => {
            if (next) go(next.id);
            else window.scrollTo({ top: 0 });
          }
        }
      : undefined
  );

  const questionSkills = $derived(course ? skillIndex(course) : new Map<string, string>());

  // Gating: what has to be reached before this lesson, test or exam may be opened. In 'free' mode
  // nothing is locked, but the requirement still comes back as a recommendation.
  const gate = $derived(
    course && current ? gateForItem(course, app.mastery[courseId], current, app.settings.gatingMode) : openGate()
  );

  // The skill a lesson practises: the lesson's own questions. Tests and exams have no single skill.
  const currentSkill = $derived.by(() => {
    const c = course;
    const item = current;
    if (!c || !item || item.kind !== 'lesson') return undefined;
    const skill = courseSkills(c).find((s) => s.id === item.id);
    return skill && skill.questionIds.length > 0 ? skill : undefined;
  });

  function practiseSkill(id: string) {
    navigate({ name: 'exercise', courseId, skillId: id });
    window.scrollTo({ top: 0 });
  }

  function tierName(tier: MasteryTier): string {
    return t('mastery.tier.' + tier);
  }

  const gateText = $derived.by(() => {
    if (gate.kind === 'open' || !course) return '';
    const skill = gate.skillId ? skillTitle(course, gate.skillId) : '';
    if (gate.kind === 'module') return t('gate.module', { percent: gate.target });
    if (gate.kind === 'test') return t('gate.test', { tier: tierName(MASTERY.gate.test), skill });
    if (gate.kind === 'exam') return t('gate.exam', { tier: tierName(MASTERY.gate.exam), skill });
    return t('gate.lesson', { tier: tierName(MASTERY.gate.lesson), skill });
  });

  function practiseWeak() {
    if (!course || !gate.weakSkillId) return;
    const item = itemForSkill(course, gate.weakSkillId);
    if (item) go(item.id);
  }

  function go(id: string) {
    navigate({ name: 'player', courseId, lessonId: id });
    window.scrollTo({ top: 0 });
  }

  function onPlayerKeydown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) return;
    if (event.key === 'Escape' && app.focusMode) {
      app.focusMode = false;
      return;
    }
    if (event.key.toLowerCase() === 'f') {
      app.focusMode = !app.focusMode;
      return;
    }
    if (event.key === 'ArrowLeft' && prev) go(prev.id);
    if (event.key === 'ArrowRight' && next) go(next.id);
  }

  async function completeAndContinue() {
    if (!current) return;
    const id = current.id;
    const alreadyDone = completed.has(id);
    await updateProgress(courseId, (p) => {
      if (!p.completedLessons.includes(id)) p.completedLessons.push(id);
    });
    if (!alreadyDone) void recordActivity('lesson');
    if (next) go(next.id);
    else window.scrollTo({ top: 0 });
  }

  async function markNotDone() {
    if (!current) return;
    const id = current.id;
    await updateProgress(courseId, (p) => {
      p.completedLessons = p.completedLessons.filter((x) => x !== id);
    });
  }
</script>

<svelte:window onkeydown={onPlayerKeydown} />

{#if !course}
  <section class="cf-empty">
    <h1>{t('player.notFound')}</h1>
    <button type="button" class="cf-btn cf-btn-secondary" onclick={() => navigate({ name: 'home' })}>{t('player.back')}</button>
  </section>
{:else if !current}
  <section class="cf-empty">
    <h1>{t('player.noContent')}</h1>
    <button type="button" class="cf-btn cf-btn-secondary" onclick={() => navigate({ name: 'home' })}>{t('player.back')}</button>
  </section>
{:else}
  <nav class="cf-breadcrumb" aria-label={t('unit.breadcrumb')}>
    <a href="#/home" aria-label={t('unit.home')}><NavIcon name="home" size={16} /></a>
    {#if course.subject}<span aria-hidden="true">•</span><span class="cf-crumb">{course.subject}</span>{/if}
    <span aria-hidden="true">•</span>
    {#if unit}
      {@const unitId = unit.id}
      <button type="button" class="cf-link" onclick={() => navigate({ name: 'unit', courseId, moduleId: course.modules[0]?.id ?? unitId })}>{displayTitle(course)}</button>
      <span aria-hidden="true">•</span>
      <button type="button" class="cf-link" onclick={() => navigate({ name: 'unit', courseId, moduleId: unitId })}>{t('unit.label', { n: unitNumber })}</button>
    {:else}
      <span class="cf-crumb">{displayTitle(course)}</span>
    {/if}
  </nav>

  <header class="cf-lesson-head">
    <h1>{itemTitle(current)}</h1>
    {#if current.goal}<p class="cf-lesson-goal">{current.goal}</p>{/if}
  </header>

  {#if gate.locked}
    <section class="cf-card cf-gate-card" aria-label={t('gate.locked')}>
      <p class="cf-gate-title"><NavIcon name="lock" size={18} /> {t('gate.locked')}</p>
      <p>{gateText}</p>
      <p class="cf-muted cf-small">{t('gate.current', { current: gate.current, target: gate.target })}</p>
      {#if gate.weakSkillId}
        <button type="button" class="cf-btn cf-btn-primary" onclick={practiseWeak}>{t('gate.practiseWeak')}</button>
      {/if}
    </section>
  {:else}
    <div class="cf-lesson-tools">
      {#if languages.length > 1}
        <div class="cf-segmented" role="group" aria-label={t('player.language')}>
          {#each languages as lang (lang)}
            <button type="button" aria-pressed={app.settings.explanationLanguage === lang} onclick={() => setLanguage(lang)}>{t('lang.' + lang)}</button>
          {/each}
        </div>
      {/if}
      <div class="cf-lesson-actions">
        {#if currentSkill}
          {@const skill = currentSkill}
          <button type="button" class="cf-btn cf-btn-secondary cf-btn-small" onclick={() => practiseSkill(skill.id)}>{t('exercise.practise')}</button>
        {/if}
        <button type="button" class="cf-btn cf-btn-ghost cf-btn-small" aria-pressed={app.focusMode} onclick={() => (app.focusMode = !app.focusMode)}>
          {app.focusMode ? t('player.exitFocus') : t('player.focus')}
        </button>
      </div>
    </div>

    {#if gate.recommended}
      <p class="cf-recommend">
        {t('gate.recommended', { requirement: gateText })}
        {#if gate.weakSkillId}
          <button type="button" class="cf-link" onclick={practiseWeak}>{t('gate.practiseWeak')}</button>
        {/if}
      </p>
    {/if}

    <article class="cf-lesson">
      <div class="lesson-content">
        {#each current.blocks as block (block.id)}
          {@const Renderer = getBlockRenderer(block.type)}
          {#if Renderer && ctx}
            <Renderer {block} {ctx} />
          {:else}
            <UnknownBlock {block} />
          {/if}
        {:else}
          <p class="cf-muted">{t('player.noContent')}</p>
        {/each}
      </div>

      {#if current.kind === 'lesson'}
        <section class="cf-card cf-notes" aria-labelledby="lesson-notes-title">
          <h2 id="lesson-notes-title">{t('notes.lessonTitle')}</h2>
          <label for="lesson-notes" class="cf-muted cf-small">{t('notes.lessonLabel')}</label>
          <textarea
            id="lesson-notes"
            class="lesson-notes-area"
            rows="4"
            bind:value={notes}
            placeholder={t('notes.lessonPlaceholder')}
            oninput={() => queueNoteSave(courseId, current.id, notes)}
            onblur={() => flushNoteSave(courseId, current.id, notes)}
          ></textarea>
        </section>
      {/if}

      <footer class="cf-lesson-nav">
        {#if prev}<button type="button" class="cf-btn cf-btn-secondary" onclick={() => go(prev.id)}>{t('player.prev')}</button>{/if}
        <span class="cf-lesson-nav-spacer"></span>
        {#if completed.has(current.id)}
          <button type="button" class="cf-btn cf-btn-ghost" onclick={markNotDone}>{t('player.markNotDone')}</button>
          {#if next}<button type="button" class="cf-btn cf-btn-primary" onclick={() => go(next.id)}>{t('player.next')}</button>{/if}
        {:else}
          <button type="button" class="cf-btn cf-btn-primary" onclick={completeAndContinue}>
            {next ? t('player.complete') : t('player.completeLast')}
          </button>
        {/if}
      </footer>

      {#if finished}<p class="cf-finished" role="status">{t('player.finished')}</p>{/if}
      <p class="cf-shortcuts">{t('player.shortcuts')}</p>
    </article>
  {/if}
{/if}
