import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDownloadFrequencySeries, toUtcDateKey } from './vault-timeseries.js';
import { MediaItem } from '../types/media.js';

const MOCK_NOW = Date.UTC(2026, 10, 4, 12, 0, 0); // Nov 4, 2026
const DAY_MS = 24 * 60 * 60 * 1000;

function makeMockItem(overrides: Partial<MediaItem>): MediaItem {
  return {
    id: 'test_1',
    url: 'https://www.pinterest.com/pin/1/',
    originalInput: 'https://www.pinterest.com/pin/1/',
    platform: 'pinterest',
    title: 'Sample Item',
    author: { name: 'Creator' },
    thumbnail: 'https://example.com/thumb.jpg',
    qualities: [{ id: '1080p', label: '1080p', resolution: '1080p', format: 'mp4', url: 'https://example.com/v.mp4' }],
    selectedQualityId: '1080p',
    downloadCount: 10,
    createdAt: MOCK_NOW,
    status: 'ready',
    ...overrides,
  };
}

test('buildDownloadFrequencySeries generates exact number of daily buckets', () => {
  const series7 = buildDownloadFrequencySeries([], 7, MOCK_NOW);
  assert.equal(series7.points.length, 7);
  assert.equal(series7.totalPeriodClips, 0);
  assert.equal(series7.totalPeriodDownloads, 0);

  const series30 = buildDownloadFrequencySeries([], 30, MOCK_NOW);
  assert.equal(series30.points.length, 30);
});

test('buildDownloadFrequencySeries aggregates clips and platform counts by UTC date', () => {
  const items: MediaItem[] = [
    makeMockItem({ id: '1', platform: 'pinterest', downloadCount: 15, createdAt: MOCK_NOW }),
    makeMockItem({ id: '2', platform: 'instagram', downloadCount: 25, createdAt: MOCK_NOW }),
    makeMockItem({ id: '3', platform: 'pinterest', downloadCount: 8, createdAt: MOCK_NOW - 2 * DAY_MS }),
  ];

  const summary = buildDownloadFrequencySeries(items, 7, MOCK_NOW);
  const todayKey = toUtcDateKey(MOCK_NOW);
  const todayBucket = summary.points.find((p) => p.dateKey === todayKey);

  assert.ok(todayBucket);
  assert.equal(todayBucket.clipCount, 2);
  assert.equal(todayBucket.downloadEvents, 40);
  assert.equal(todayBucket.pinterestCount, 1);
  assert.equal(todayBucket.instagramCount, 1);
  assert.equal(summary.totalPeriodClips, 3);
  assert.equal(summary.totalPeriodDownloads, 48);
  assert.equal(summary.peakDownloads, 40);
});
