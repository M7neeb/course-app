// "How well do you know what you know?" Learners are often overconfident: rereading feels like
// knowing. Comparing how sure someone said they were with how often they were right shows them
// where their feeling of knowing can be trusted. Pure logic over the answer log.

import type { Confidence, CourseMastery } from './types.ts';

export interface CalibrationRow {
  confidence: Confidence;
  answers: number;
  correct: number;
  /** 0-100, or null with no answers. */
  percent: number | null;
}

export type CalibrationAdvice = 'overconfident' | 'underconfident' | 'calibrated' | 'not-enough';

export interface Calibration {
  rows: CalibrationRow[];
  advice: CalibrationAdvice;
}

/** Answers with a rating are needed before any advice is given. */
export const MIN_RATED = 10;

export function calibration(records: CourseMastery[]): Calibration {
  const levels: Confidence[] = ['sure', 'unsure', 'guess'];
  const counts = new Map<Confidence, { answers: number; correct: number }>(levels.map((c) => [c, { answers: 0, correct: 0 }]));
  for (const record of records) {
    for (const entry of record.mistakes ?? []) {
      if (!entry.confidence) continue;
      const bucket = counts.get(entry.confidence);
      if (!bucket) continue;
      bucket.answers += 1;
      if (entry.correct) bucket.correct += 1;
    }
  }
  const rows = levels.map((confidence) => {
    const { answers, correct } = counts.get(confidence) ?? { answers: 0, correct: 0 };
    return { confidence, answers, correct, percent: answers === 0 ? null : Math.round((correct / answers) * 100) };
  });
  const rated = rows.reduce((sum, row) => sum + row.answers, 0);
  const sure = rows[0];
  const unsure = rows.slice(1).reduce((acc, row) => ({ answers: acc.answers + row.answers, correct: acc.correct + row.correct }), { answers: 0, correct: 0 });
  let advice: CalibrationAdvice = 'not-enough';
  if (rated >= MIN_RATED && sure && sure.answers >= 5) {
    const sureRate = sure.correct / sure.answers;
    const unsureRate = unsure.answers > 0 ? unsure.correct / unsure.answers : 0;
    if (sureRate < 0.8) advice = 'overconfident';
    else if (unsure.answers >= 5 && unsureRate >= 0.8) advice = 'underconfident';
    else advice = 'calibrated';
  }
  return { rows, advice };
}
