import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSettings, mergeSettings } from './settings.ts';

test('missing and invalid keys fall back to defaults', () => {
  assert.deepEqual(mergeSettings(undefined), defaultSettings());
  const s = mergeSettings({ theme: 'neon', fontSize: 'big', uiLanguage: 'de', autoplayVideo: 'yes' });
  assert.equal(s.theme, 'system');
  assert.equal(s.fontSize, 17);
  assert.equal(s.uiLanguage, 'de');
  assert.equal(s.autoplayVideo, false);
});

test('profile, motion, and backup reminder preferences are safely normalized', () => {
  const s = mergeSettings({ profileName: 'Ada', profileColor: '#aabbcc', reduceMotion: true, backupReminderDismissed: true });
  assert.equal(s.profileName, 'Ada');
  assert.equal(s.profileColor, '#aabbcc');
  assert.equal(s.reduceMotion, true);
  assert.equal(s.backupReminderDismissed, true);
  const invalid = mergeSettings({ profileName: 'x'.repeat(60), profileColor: 'url(javascript:alert(1))' });
  assert.equal(invalid.profileName.length, 48);
  assert.equal(invalid.profileColor, '#356a8a');
});
