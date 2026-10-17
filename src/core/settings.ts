import { normalizeColorTheme } from './themes.ts';
import type { Settings } from './types.ts';

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    colorTheme: 'default',
    lastBackupAt: null,
    fontSize: 17,
    uiLanguage: 'en',
    explanationLevel: 'normal',
    explanationLanguage: 'en',
    questionLanguage: 'en',
    autoplayVideo: false,
    libraryShowProgress: true,
    libraryShowLastOpened: true,
    backupReminderDismissed: false,
    reduceMotion: false,
    gatingMode: 'locked',
    profileName: '',
    profileColor: '#356a8a',
    username: '',
    bio: '',
    dailyReviewLimit: 20,
    askConfidence: true
  };
}

/** Old saved settings may lack newer keys; every key falls back to its default. */
export function mergeSettings(saved: unknown): Settings {
  const base = defaultSettings();
  if (typeof saved !== 'object' || saved === null) return base;
  const s = saved as Record<string, unknown>;
  const out: Settings = { ...base };
  if (s.theme === 'system' || s.theme === 'light' || s.theme === 'dark') out.theme = s.theme;
  const colorTheme = normalizeColorTheme(s.colorTheme);
  if (colorTheme) out.colorTheme = colorTheme;
  if (typeof s.lastBackupAt === 'string' && s.lastBackupAt.trim() !== '') out.lastBackupAt = s.lastBackupAt;
  if (typeof s.fontSize === 'number' && s.fontSize >= 12 && s.fontSize <= 28) out.fontSize = s.fontSize;
  if (s.uiLanguage === 'en' || s.uiLanguage === 'de') out.uiLanguage = s.uiLanguage;
  if (s.explanationLevel === 'normal' || s.explanationLevel === 'simple' || s.explanationLevel === 'detailed') {
    out.explanationLevel = s.explanationLevel;
  }
  if (s.explanationLanguage === 'en' || s.explanationLanguage === 'de') out.explanationLanguage = s.explanationLanguage;
  if (s.questionLanguage === 'en' || s.questionLanguage === 'de') out.questionLanguage = s.questionLanguage;
  if (typeof s.autoplayVideo === 'boolean') out.autoplayVideo = s.autoplayVideo;
  if (typeof s.libraryShowProgress === 'boolean') out.libraryShowProgress = s.libraryShowProgress;
  if (typeof s.libraryShowLastOpened === 'boolean') out.libraryShowLastOpened = s.libraryShowLastOpened;
  if (typeof s.backupReminderDismissed === 'boolean') out.backupReminderDismissed = s.backupReminderDismissed;
  if (typeof s.reduceMotion === 'boolean') out.reduceMotion = s.reduceMotion;
  if (s.gatingMode === 'locked' || s.gatingMode === 'free') out.gatingMode = s.gatingMode;
  if (typeof s.profileName === 'string') out.profileName = s.profileName.slice(0, 48);
  if (typeof s.profileColor === 'string' && /^#[\da-f]{6}$/i.test(s.profileColor)) out.profileColor = s.profileColor;
  if (typeof s.username === 'string') out.username = s.username.slice(0, 32);
  if (typeof s.bio === 'string') out.bio = s.bio.slice(0, 160);
  if (typeof s.dailyReviewLimit === 'number' && Number.isFinite(s.dailyReviewLimit)) {
    out.dailyReviewLimit = Math.min(100, Math.max(5, Math.round(s.dailyReviewLimit)));
  }
  if (typeof s.askConfidence === 'boolean') out.askConfidence = s.askConfidence;
  return out;
}
