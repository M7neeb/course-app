<script lang="ts">
  // Review mistakes: every question whose latest answer is wrong, grouped by course, with a
  // "practise" mode that drills exactly those questions. A correct answer clears the question.
  import { app, displayTitle, getCourse, moduleMasteryPercentFor, recordActivity, recordMasteryAttempt as recordMastery, updateProgress } from '../../core/state.svelte.ts';
  import { groupMistakes, listMistakes, mistakesToBlock, type MistakeEntry } from '../../core/mistakes.ts';
  import { FINAL_EXAM_ITEM_ID, testItemId } from '../../core/course-utils.ts';
  import { skillIndex, skillTitle } from '../../core/mastery.ts';
  import { getBlockRenderer } from '../../blocks/registry.ts';
  import type { BlockContext } from '../../core/types.ts';
  import { t } from '../../i18n/i18n.ts';

  let practising = $state(false);
  let session = $state.raw<MistakeEntry[]>([]);

  const mistakes = $derived(listMistakes(app.courses, app.progress, app.settings.questionLanguage));
  const groups = $derived(groupMistakes(mistakes));
  const practiceGroups = $derived(groupMistakes(session));
  const total = $derived(mistakes.length);

  function start(entries: MistakeEntry[]) {
    session = [...entries];
    practising = true;
    window.scrollTo({ top: 0 });
  }

  function stop() {
    practising = false;
    session = [];
  }

  function courseName(id: string): string {
    const course = getCourse(id);
    return course ? displayTitle(course) : id;
  }

  function blockFor(entries: MistakeEntry[]) {
    return mistakesToBlock(entries, 'mistake-practice-' + (entries[0]?.courseId ?? 'x'));
  }

  function ctxFor(entries: MistakeEntry[]): BlockContext | undefined {
    const first = entries[0];
    if (!first) return undefined;
    const courseId = first.courseId;
    const course = getCourse(courseId);
    const skills = course ? skillIndex(course) : new Map<string, string>();
    const itemId = first.itemId;
    const itemKind: 'lesson' | 'test' | 'exam' =
      itemId === FINAL_EXAM_ITEM_ID ? 'exam' : itemId.endsWith(':test') ? 'test' : 'lesson';
    const moduleId = course
      ? (course.modules.find((m) => m.id === itemId || testItemId(m.id) === itemId || m.lessons.some((l) => l.id === itemId))?.id ?? null)
      : null;
    return {
      courseId,
      lessonId: itemId,
      itemKind,
      moduleId,
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
      getVideoOverride: () => undefined,
      setVideoOverride: () => {},
      getImageOverride: () => undefined,
      setImageOverride: () => {},
      skillIdFor: (qid) => skills.get(qid) ?? itemId,
      skillTitleFor: (sid) => (course ? skillTitle(course, sid) : sid),
      getSkillMastery: (sid) => app.mastery[courseId]?.skills[sid],
      recordMasteryAttempt: (attempt) => recordMastery(courseId, attempt),
      getModuleMasteryPercent: (mid) => moduleMasteryPercentFor(courseId, mid),
      onSetContinue: stop
    };
  }
</script>

<section class="cf-review">
  {#if practising}
    <div class="cf-section-head">
      <h1>{t('review.title')}</h1>
      <button type="button" class="cf-btn cf-btn-secondary" onclick={stop}>{t('review.back')}</button>
    </div>
    <p class="cf-muted">{t('review.hint')}</p>

    {#each practiceGroups as group (group.courseId)}
      {@const Renderer = getBlockRenderer('quiz')}
      {@const ctx = ctxFor(group.entries)}
      <section class="cf-review-group">
        <h2>{courseName(group.courseId)}</h2>
        {#if Renderer && ctx}
          <Renderer block={blockFor(group.entries)} {ctx} />
        {/if}
      </section>
    {/each}

    <div class="cf-actions">
      <button type="button" class="cf-btn cf-btn-primary" onclick={stop}>{t('review.done')}</button>
    </div>
  {:else if total === 0}
    <div class="cf-section-head"><h1>{t('review.title')}</h1></div>
    <div class="cf-card cf-empty-card">
      <h2>{t('review.empty')}</h2>
      <p class="cf-muted">{t('review.emptyHint')}</p>
    </div>
  {:else}
    <div class="cf-section-head">
      <div>
        <h1>{t('review.title')}</h1>
        <p class="cf-muted">{total === 1 ? t('review.count', { n: total }) : t('review.countPlural', { n: total })}</p>
      </div>
      <button type="button" class="cf-btn cf-btn-primary" onclick={() => start(mistakes)}>{t('review.practise')}</button>
    </div>
    <p class="cf-muted">{t('review.hint')}</p>

    {#each groups as group (group.courseId)}
      <section class="cf-review-group">
        <header>
          <h2>{courseName(group.courseId)}</h2>
          <span class="cf-muted cf-small">{t('review.groupCount', { n: group.entries.length })}</span>
          <button type="button" class="cf-btn cf-btn-secondary cf-btn-small" onclick={() => start(group.entries)}>{t('review.practiseCourse')}</button>
        </header>
        <ol class="cf-review-list">
          {#each group.entries as entry (entry.question.id)}
            <li>{entry.prompt}</li>
          {/each}
        </ol>
      </section>
    {/each}
  {/if}
</section>
