import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHANGELOG, changelogFor, VERSION } from './version.ts';

test('the version is set and has a changelog entry', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  assert.ok(changelogFor(VERSION), `no changelog entry for ${VERSION}`);
});

test('every changelog entry is complete and newest first', () => {
  for (const entry of CHANGELOG) {
    assert.match(entry.version, /^\d+\.\d+\.\d+$/);
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(entry.changes.length > 0, `${entry.version} has no changes listed`);
    for (const change of entry.changes) assert.ok(change.trim().length > 0);
  }
  assert.deepEqual(
    [...CHANGELOG].map((e) => e.version),
    [...CHANGELOG].map((e) => e.version).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  );
});

test('an unknown version has no entry', () => {
  assert.equal(changelogFor('99.99.99'), undefined);
});
