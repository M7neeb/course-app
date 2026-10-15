import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_WARNING_DAYS, backupStatus, daysSince } from './backup.ts';

const now = new Date('2026-10-11T12:00:00Z');

test('no backup reads as never, which always nags', () => {
  assert.equal(daysSince(null, now), null);
  assert.equal(daysSince(undefined, now), null);
  assert.equal(daysSince('not a date', now), null);
  const status = backupStatus(null, now);
  assert.equal(status.days, null);
  assert.equal(status.stale, true);
});

test('whole days since the last export are counted', () => {
  assert.equal(daysSince('2026-10-11T09:00:00Z', now), 0);
  assert.equal(daysSince('2026-10-04T12:00:00Z', now), 7);
  assert.equal(daysSince('2026-12-01T00:00:00Z', now), 0); // a future stamp clamps to 0
});

test('the warning starts once the backup is older than the threshold', () => {
  assert.equal(backupStatus('2026-10-04T12:00:00Z', now).stale, false); // 7 days
  assert.equal(backupStatus('2026-09-27T12:00:00Z', now).stale, false); // exactly 14 days
  assert.equal(backupStatus('2026-09-26T12:00:00Z', now).stale, true); // 15 days
  assert.equal(BACKUP_WARNING_DAYS, 14);
});
