export type MediaPlatform = 'pinterest' | 'instagram' | 'unknown';

export interface MediaQuality {
  id: string;
  label: string;
  resolution: string; // e.g., '1080p', '720p', '480p', 'Audio'
  format: 'mp4' | 'mp3' | 'm4a';
  url: string;
  sizeEstimate?: string;
  bitrate?: string;
  isOriginal?: boolean;
}

export interface MediaAuthor {
  name: string;
  username?: string;
  avatar?: string;
  profileUrl?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  originalInput: string;
  platform: 'pinterest' | 'instagram';
  title: string;
  caption?: string;
  author: MediaAuthor;
  thumbnail: string;
  aspectRatio?: '9:16' | '1:1' | '16:9' | '4:5';
  duration?: string;
  qualities: MediaQuality[];
  selectedQualityId: string;
  downloadCount: number;
  createdAt: number;
  status: 'idle' | 'extracting' | 'ready' | 'downloading' | 'downloaded' | 'error';
  error?: string;
  isFavorite?: boolean;
  tags?: string[];
  fileSizeBytes?: number;
}

export interface BatchJob {
  id: string;
  total: number;
  completed: number;
  failed: number;
  items: MediaItem[];
  createdAt: number;
}

export interface VaultSettings {
  pinCode?: string;
  isLocked: boolean;
  autoDownloadAudio: boolean;
  defaultQuality: '1080p' | '720p' | 'best';
  theme: 'dark' | 'light' | 'system';
  autoSaveToHistory: boolean;
}

export interface SyncPayload {
  version: number;
  exportedAt: number;
  deviceId: string;
  history: MediaItem[];
  settings: Partial<VaultSettings>;
}
