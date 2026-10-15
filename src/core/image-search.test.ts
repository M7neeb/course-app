import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageSearchUrl } from './image-search.ts';

test('builds an image search url and encodes the term', () => {
  assert.equal(imageSearchUrl('solar system'), 'https://www.google.com/search?tbm=isch&q=solar%20system');
  assert.equal(imageSearchUrl('  binary chart  '), 'https://www.google.com/search?tbm=isch&q=binary%20chart');
});
