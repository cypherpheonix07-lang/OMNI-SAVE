import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProgress,
  calculateSpeed,
  calculateEta,
  formatSpeed,
  formatEta,
} from './realtime-engine.js';

test('calculateProgress calculates accurate percentage clamped between 0 and 100', () => {
  assert.equal(calculateProgress(0, 1000), 0);
  assert.equal(calculateProgress(500, 1000), 50);
  assert.equal(calculateProgress(333, 1000), 33.3);
  assert.equal(calculateProgress(1200, 1000), 100);
  assert.equal(calculateProgress(50, 0), 0);
});

test('calculateSpeed computes correct bytes per second', () => {
  assert.equal(calculateSpeed(1024 * 1024, 1000), 1048576);
  assert.equal(calculateSpeed(500000, 500), 1000000);
  assert.equal(calculateSpeed(100, 0), 0);
});

test('calculateEta computes remaining seconds accurately', () => {
  assert.equal(calculateEta(1000, 500), 2);
  assert.equal(calculateEta(1001, 500), 3);
  assert.equal(calculateEta(0, 500), 0);
  assert.equal(calculateEta(500, 0), 0);
});

test('formatSpeed formats KB/s and MB/s correctly', () => {
  assert.equal(formatSpeed(0), '0 KB/s');
  assert.equal(formatSpeed(512 * 1024), '512.0 KB/s');
  assert.equal(formatSpeed(2.5 * 1024 * 1024), '2.5 MB/s');
});

test('formatEta formats seconds and minutes correctly', () => {
  assert.equal(formatEta(0), 'Done');
  assert.equal(formatEta(25), '25s');
  assert.equal(formatEta(65), '1m 5s');
  assert.equal(formatEta(120), '2m 0s');
});
