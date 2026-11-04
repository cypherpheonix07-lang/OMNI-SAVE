/**
 * Pure calculation and formatting utilities for Real-Time Streaming Downloader
 */

export function calculateProgress(receivedBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) return 0;
  const pct = (receivedBytes / totalBytes) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

export function calculateSpeed(bytesReceived: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.round((bytesReceived / elapsedMs) * 1000);
}

export function calculateEta(remainingBytes: number, speedBytesPerSec: number): number {
  if (remainingBytes <= 0) return 0;
  if (speedBytesPerSec <= 0) return 0;
  return Math.ceil(remainingBytes / speedBytesPerSec);
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function formatEta(seconds: number): string {
  if (seconds <= 0) return 'Done';
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `${mins}m ${remainingSecs}s`;
}

export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '');
}

export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}
