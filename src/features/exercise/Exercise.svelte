<script lang="ts">
  // Practise one skill: the exercise engine picks a set from this lesson's questions (missed-and-due
  // first), and the existing quiz renderer runs it and shows the results screen. Nothing about the
  // run is duplicated here - this screen only chooses the questions and wires up the context.
  import { untrack } from 'svelte';
  import {
    app,
    displayTitle,
    getCourse,
    moduleMasteryPercentFor,
    navigate,
    recordActivity,
    recordMasteryAttempt as recordMastery,
    updateProgress
  } from '../../core/state.svelte.ts';
  import { buildExerciseSet, type ExerciseSet } from '../../core/exercise.ts';
  import { courseSkills, skillIndex, skillPoints, skillTitle, tierForPoints } from '../../core/mastery.ts';
  import { FINAL_EXAM_ITEM_ID } from '../../core/course-utils.ts';
  import { getBlockRenderer } from '../../blocks/registry.ts';
  import type { Block, BlockContext } from '../../core/types.ts';
  import MasteryIcon from '../../ui/MasteryIcon.svelte';
  import NavIcon from '../../ui/NavIcon.svelte';
  import { t } from '../../i18n/i18n.ts';

  let { courseId, skillId }: { courseId: string; skillId: string } = $props();

  const course = $derived(getCourse(courseId));
  const skill = $derived.by(() => {
    const c = course;
    return c ? courseSkills(c).find((s) => s.id === skillId) : undefined;
  });

  // A fresh seed per set. The set is settled once per seed from a snapshot of the saved mastery -
  // read untracked - so answering a question never reshuffles the set you are working through.
  let seed = $state(Math.floor(Math.random() * 2 ** 31));

  const set = $derived.by<ExerciseSet | null>(() => {
    const c = course;
    const s = skill;
    const currentSeed = seed;
    if (!c || !s) return null;
    return untrack(() => buildExerciseSet(c, skillId, currentSeed, { mastery: app.mastery[courseId], now: new Date() }));
  });

  const block = $derived.by((): Block | undefined => {
    const s = set;
    if (!s || s.questions.length === 0) return undefined;
    return { id: `exercise-${skillId}`, type: 'quiz', questions: s.questions };
  });

  function kindOf(itemId: string): 'lesson' | 'test' | 'exam' {
    if (itemId === FINAL_EXAM_ITEM_ID) return 'exam';
    return itemId.endsWith(':test') ? 'test' : 'lesson';
  }

  const ctx = $derived.by<BlockContext | undefined>(() => {
    const c = course;
    const s = skill;
    if (!c || !s) return undefined;
    const questionSkills = skillIndex(c);
    return {
      courseId,
      lessonId: s.itemId,
      itemKind: kindOf(s.itemId),
      moduleId: s.moduleId,
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
      skillIdFor: (qid) => questionSkills.get(qid) ?? s.id,
      skillTitleFor: (sid) => (course ? skillTitle(course, sid) : sid),
      getSkillMastery: (sid) => app.mastery[courseId]?.skills[sid],
      recordMasteryAttempt: (attempt) => recordMastery(courseId, attempt),
      getModuleMasteryPercent: (mid) => moduleMasteryPercentFor(courseId, mid),
      onSetContinue: backToLesson
    };
  });

  function newSet() {
    seed = Math.floor(Math.random() * 2 ** 31);
    window.scrollTo({ top: 0 });
  }

  function backToLesson() {
    const s = skill;
    if (s) navigate({ name: 'player', courseId, lessonId: s.itemId });
    else navigate({ name: 'library' });
    window.scrollTo({ top: 0 });
  }

  const tier = $derived(tierForPoints(skillPoints(app.mastery[courseId], skillId)));
  const unitIndex = $derived(course && skill?.moduleId ? course.modules.findIndex((m) => m.id === skill.moduleId) : -1);

  function label(): string {
    return course && skill ? skillTitle(course, skill.id) : skillId;
  }
</script>

<section class="cf-exercise">
  {#if !course}
    <div class="cf-empty">
      <h1>{t('exercise.noCourse')}</h1>
      <button type="button" class="cf-btn cf-btn-secondary" onclick={() => navigate({ name: 'home' })}>{t('player.back')}</button>
    </div>
  {:else if !skill}
    <div class="cf-empty">
      <h1>{t('exercise.notFound')}</h1>
      <button type="button" class="cf-btn cf-btn-secondary" onclick={() => navigate({ name: 'player', courseId })}>{t('player.back')}</button>
    </div>
  {:else}
    <nav class="cf-breadcrumb" aria-label={t('unit.breadcrumb')}>
      <a href="#/home" aria-label={t('unit.home')}><NavIcon name="home" size={16} /></a>
      <span aria-hidden="true">•</span>
      <span class="cf-crumb">{displayTitle(course)}</span>
      {#if unitIndex >= 0}
        {@const moduleId = course.modules[unitIndex]?.id ?? ''}
        <span aria-hidden="true">•</span>
        <button type="button" class="cf-link" onclick={() => navigate({ name: 'unit', courseId, moduleId })}>{t('unit.label', { n: unitIndex + 1 })}</button>
      {/if}
    </nav>

    <header class="cf-exercise-head">
      <MasteryIcon {tier} size={40} />
      <div>
        <p class="cf-muted cf-small">{t('exercise.title')}</p>
        <h1>{label()}</h1>
        <p class="cf-muted cf-small">{t('mastery.tier.' + tier)}</p>
      </div>
    </header>

    {#if !block || !ctx}
      <div class="cf-card">
        <p>{t('exercise.empty')}</p>
        <button type="button" class="cf-btn cf-btn-secondary" onclick={backToLesson}>{t('exercise.back')}</button>
      </div>
    {:else}
      {@const Renderer = getBlockRenderer('quiz')}
      <p class="cf-muted cf-exercise-intro">{t('exercise.intro')} {t('exercise.setOf', { n: set?.questions.length ?? 0 })}</p>
      {#if set?.repeats}<p class="cf-muted cf-small">{t('exercise.repeats')}</p>{/if}

      {#key `${skillId}:${seed}`}
        {#if Renderer}
          <Renderer block={block} {ctx} />
        {/if}
      {/key}

      <div class="cf-actions">
        <button type="button" class="cf-btn cf-btn-secondary" onclick={newSet}>{t('exercise.newSet')}</button>
        <button type="button" class="cf-btn cf-btn-ghost" onclick={backToLesson}>{t('exercise.back')}</button>
      </div>
    {/if}
  {/if}
</section>
