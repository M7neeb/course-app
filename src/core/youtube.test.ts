import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractYouTubeId, videoIdOf, youtubeSearchUrl, youtubeEmbedUrl, youtubeThumbnailUrl } from './youtube.ts';

const ID = 'dQw4w9WgXcQ';

test('extracts the id from common link shapes', () => {
  assert.equal(extractYouTubeId(`https://www.youtube.com/watch?v=${ID}&t=42s`), ID);
  assert.equal(extractYouTubeId(`https://youtu.be/${ID}?si=abc`), ID);
  assert.equal(extractYouTubeId(`https://m.youtube.com/watch?v=${ID}`), ID);
  assert.equal(extractYouTubeId(`https://www.youtube.com/embed/${ID}`), ID);
  assert.equal(extractYouTubeId(`https://www.youtube.com/shorts/${ID}`), ID);
  assert.equal(extractYouTubeId(ID), ID);
});

test('rejects things that are not YouTube videos', () => {
  assert.equal(extractYouTubeId('https://example.com/watch?v=' + ID), null);
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=short'), null);
  assert.equal(extractYouTubeId('not a link'), null);
  assert.equal(extractYouTubeId(''), null);
});

test('builds search and embed urls', () => {
  assert.equal(youtubeSearchUrl('a b&c'), 'https://www.youtube.com/results?search_query=a%20b%26c');
  assert.ok(youtubeEmbedUrl(ID, true).includes('autoplay=1'));
  assert.ok(!youtubeEmbedUrl(ID, false).includes('autoplay'));
});

test('a block url becomes a video id only when it is a YouTube link', () => {
  assert.equal(videoIdOf('https://www.youtube.com/watch?v=UjOXLg7HauQ'), 'UjOXLg7HauQ');
  assert.equal(videoIdOf(null), null);
  assert.equal(videoIdOf(''), null);
  assert.equal(videoIdOf('https://example.com/video'), null);
  assert.equal(youtubeThumbnailUrl('UjOXLg7HauQ'), 'https://i.ytimg.com/vi/UjOXLg7HauQ/mqdefault.jpg');
});
