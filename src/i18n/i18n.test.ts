import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (name: string) =>
  JSON.parse(readFileSync(new URL(`./${name}.json`, import.meta.url), 'utf8')) as Record<string, string>;

test('English and German have exactly the same keys', () => {
  const en = Object.keys(load('en')).sort();
  const de = Object.keys(load('de')).sort();
  assert.deepEqual(de, en);
});

test('placeholders such as {n} match between languages', () => {
  const en = load('en');
  const de = load('de');
  const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  for (const key of Object.keys(en)) assert.equal(names(de[key] ?? ''), names(en[key] ?? ''), key);
});
