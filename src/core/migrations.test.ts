import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMigrations, migrateBackup, migrateCourse } from './migrations.ts';
import { COURSE_SCHEMA_VERSION, USERDATA_SCHEMA_VERSION } from './types.ts';

test('current-version data passes through untouched', () => {
  const data = { schemaVersion: COURSE_SCHEMA_VERSION, id: 'a' };
  const r = migrateCourse(data);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.data, data);
});

test('a version 1 course upgrades to version 2 and keeps its content', () => {
  const v1 = { schemaVersion: 1, id: 'c', title: 'C', modules: [] };
  const r = migrateCourse(v1);
  assert.equal(r.error, undefined);
  assert.equal(r.fromVersion, 1);
  const out = r.data as Record<string, unknown>;
  assert.equal(out.schemaVersion, 2);
  assert.equal(out.title, 'C');
  assert.equal(out.id, 'c');
});

test('steps run in order and set the new version', () => {
  const steps = {
    1: (d: Record<string, unknown>) => ({ ...d, a: true }),
    2: (d: Record<string, unknown>) => ({ ...d, b: true })
  };
  const r = runMigrations({ schemaVersion: 1 }, 3, steps);
  assert.deepEqual(r.data, { schemaVersion: 3, a: true, b: true });
  assert.equal(r.fromVersion, 1);
});

test('a missing step is reported', () => {
  const r = runMigrations({ schemaVersion: 1 }, 3, { 1: (d) => d });
  assert.ok(r.error);
});

test('files from a newer app are refused with a clear message', () => {
  const r = runMigrations({ schemaVersion: 9 }, 1, {});
  assert.ok(r.error?.includes('version 9'));
});

test('data without a version is left for the validator to reject', () => {
  const r = runMigrations({ id: 'x' }, 1, {});
  assert.equal(r.error, undefined);
});

test('the current user-data version passes through untouched', () => {
  const data = { schemaVersion: USERDATA_SCHEMA_VERSION, kind: 'course-app-backup' };
  const r = migrateBackup(data);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.data, data);
});

test('a version 1 backup upgrades to version 2 and keeps its content', () => {
  const v1 = { schemaVersion: 1, kind: 'course-app-backup', courses: [{ id: 'c' }], progress: [{ courseId: 'c' }] };
  const r = migrateBackup(v1);
  assert.equal(r.error, undefined);
  assert.equal(r.fromVersion, 1);
  const out = r.data as Record<string, unknown>;
  assert.equal(out.schemaVersion, USERDATA_SCHEMA_VERSION);
  assert.deepEqual(out.courses, [{ id: 'c' }]);
  assert.deepEqual(out.progress, [{ courseId: 'c' }]);
});

test('a backup from a newer app is refused', () => {
  const r = migrateBackup({ schemaVersion: USERDATA_SCHEMA_VERSION + 1, kind: 'course-app-backup' });
  assert.ok(r.error?.includes(`version ${USERDATA_SCHEMA_VERSION + 1}`));
});

test('a version 2 backup upgrades to version 3 and keeps its mastery records', () => {
  const v2 = {
    schemaVersion: 2,
    kind: 'course-app-backup',
    courses: [{ id: 'c' }],
    progress: [{ courseId: 'c' }],
    mastery: [{ courseId: 'c', skills: { l1: { skillId: 'l1', points: 50, firstTry: {}, updatedAt: '2026-01-01T00:00:00.000Z' } }, mistakes: [] }]
  };
  const r = migrateBackup(v2);
  assert.equal(r.error, undefined);
  assert.equal(r.fromVersion, 2);
  const out = r.data as Record<string, unknown>;
  assert.equal(out.schemaVersion, USERDATA_SCHEMA_VERSION);
  assert.deepEqual(out.mastery, v2.mastery, 'the older mastery shape is kept as it is');
});
