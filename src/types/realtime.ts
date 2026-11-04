import { MediaPlatform, MediaItem } from './media.js';

export type DownloadStatus = 'connecting' | 'streaming' | 'completed' | 'error' | 'cancelled';

export interface RealtimeDownloadTask {
  id: string;
  itemId: string;
  title: string;
  platform: MediaPlatform;
  qualityId: string;
  qualityLabel: string;
  format: 'mp4' | 'mp3' | 'm4a';
  receivedBytes: number;
  totalBytes: number;
  progressPct: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  chunksCount: number;
  status: DownloadStatus;
  error?: string;
  blobUrl?: string;
  streamUrl: string;
  thumbnail: string;
  filename: string;
  startTime: number;
  item: MediaItem;
}

export interface KeyboardShortcutDefinition {
  id: string;
  keys: string[];
  description: string;
  category: 'Navigation' | 'Actions' | 'General';
}
