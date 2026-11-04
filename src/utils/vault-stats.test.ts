import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHistoryStats } from './vault-stats.js';
import { SAMPLE_MEDIA_ITEMS } from './media-parser.js';

test('calculateHistoryStats correctly computes platform and category distributions', () => {
  const stats = calculateHistoryStats(SAMPLE_MEDIA_ITEMS);

  assert.equal(stats.totalItems, 3);
  assert.ok(stats.totalDownloads > 0);

  // Platform assertions (2 Pinterest, 1 Instagram in SAMPLE_MEDIA_ITEMS)
  const pinStat = stats.platforms.find((p) => p.platform === 'pinterest');
  const instaStat = stats.platforms.find((p) => p.platform === 'instagram');

  assert.ok(pinStat);
  assert.ok(instaStat);
  assert.equal(pinStat.count, 2);
  assert.equal(instaStat.count, 1);
  assert.equal(pinStat.percentage, 67);
  assert.equal(instaStat.percentage, 33);
  assert.equal(stats.topPlatform, 'Pinterest');

  // Category assertions
  assert.ok(stats.topCategories.length > 0);
  assert.ok(stats.topCategories.some((c) => c.category === 'Aesthetic' || c.category === 'Food'));
});

test('calculateHistoryStats handles empty history gracefully', () => {
  const emptyStats = calculateHistoryStats([]);
  assert.equal(emptyStats.totalItems, 0);
  assert.equal(emptyStats.totalDownloads, 0);
  assert.equal(emptyStats.topPlatform, 'None');
});
