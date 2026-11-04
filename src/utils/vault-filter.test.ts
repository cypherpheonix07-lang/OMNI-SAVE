import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortHistory } from './vault-filter.js';
import { SAMPLE_MEDIA_ITEMS } from './media-parser.js';

test('filterAndSortHistory filters by search query accurately', () => {
  const result = filterAndSortHistory(SAMPLE_MEDIA_ITEMS, 'Tokyo', 'all', 'all');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'sample-insta-1');
});

test('filterAndSortHistory filters by platform correctly', () => {
  const pinsOnly = filterAndSortHistory(SAMPLE_MEDIA_ITEMS, '', 'pinterest', 'all');
  assert.equal(pinsOnly.length, 2);
  assert.ok(pinsOnly.every((i) => i.platform === 'pinterest'));

  const reelsOnly = filterAndSortHistory(SAMPLE_MEDIA_ITEMS, '', 'instagram', 'all');
  assert.equal(reelsOnly.length, 1);
  assert.equal(reelsOnly[0].platform, 'instagram');
});

test('filterAndSortHistory filters by date range', () => {
  const now = Date.now();
  // All sample items are created within the last 12 hours (today)
  const todayOnly = filterAndSortHistory(SAMPLE_MEDIA_ITEMS, '', 'all', 'today', 'newest', now);
  assert.equal(todayOnly.length, 3);
});

test('filterAndSortHistory sorts by downloads correctly', () => {
  const sorted = filterAndSortHistory(SAMPLE_MEDIA_ITEMS, '', 'all', 'all', 'downloads');
  assert.equal(sorted.length, 3);
  assert.ok((sorted[0].downloadCount || 0) >= (sorted[1].downloadCount || 0));
  assert.ok((sorted[1].downloadCount || 0) >= (sorted[2].downloadCount || 0));
});
