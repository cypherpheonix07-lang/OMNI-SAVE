import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectPlatform,
  sanitizeUrl,
  parseBatchUrls,
  formatFileSize,
  formatDuration,
  generateSafeFilename,
} from './media-parser.js';

test('detectPlatform correctly identifies Pinterest and Instagram URLs', () => {
  assert.equal(detectPlatform('https://www.pinterest.com/pin/123456789/'), 'pinterest');
  assert.equal(detectPlatform('https://pin.it/abc123X'), 'pinterest');
  assert.equal(detectPlatform('https://www.instagram.com/reel/C8k9vXYZ/'), 'instagram');
  assert.equal(detectPlatform('https://instagram.com/p/B9wQp4L/'), 'instagram');
  assert.equal(detectPlatform('https://example.com/video.mp4'), 'unknown');
  assert.equal(detectPlatform(''), 'unknown');
});

test('sanitizeUrl removes query tracking and trims brackets', () => {
  const dirty = '<https://www.pinterest.com/pin/123456/?utm_source=share&utm_medium=android&igsh=abc>';
  const clean = sanitizeUrl(dirty);
  assert.ok(!clean.includes('utm_source'));
  assert.ok(!clean.includes('igsh'));
  assert.ok(clean.startsWith('https://www.pinterest.com/pin/123456'));
});

test('parseBatchUrls extracts unique valid URLs from multiline and mixed text', () => {
  const bulkText = `
    Check this pin: https://www.pinterest.com/pin/11111/
    And this reel https://www.instagram.com/reel/22222/
    Duplicate: https://www.pinterest.com/pin/11111/
    Ignored random site: https://google.com/search
    Short pin: pin.it/33333
  `;
  const urls = parseBatchUrls(bulkText);
  assert.equal(urls.length, 3);
  assert.ok(urls.some(u => u.includes('11111')));
  assert.ok(urls.some(u => u.includes('22222')));
  assert.ok(urls.some(u => u.includes('33333')));
});

test('formatFileSize converts bytes into readable units', () => {
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(15 * 1024 * 1024), '15.0 MB');
  assert.equal(formatFileSize(undefined), 'Variable');
});

test('formatDuration converts seconds to MM:SS', () => {
  assert.equal(formatDuration(45), '0:45');
  assert.equal(formatDuration(125), '2:05');
  assert.equal(formatDuration(0), '0:15');
});

test('generateSafeFilename creates clean alphanumeric filename with timestamp', () => {
  const filename = generateSafeFilename('Tokyo Street Food ASMR! (Rainy Night)', 'instagram', '1080p', 'mp4');
  assert.ok(filename.startsWith('instagram_tokyo_street_food_asmr_rainy_night_1080p_'));
  assert.ok(filename.endsWith('.mp4'));
});
