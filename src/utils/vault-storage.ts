import { MediaItem, VaultSettings, SyncPayload } from '../types/media.js';

const STORAGE_KEY_HISTORY = 'omnisave_history_v1';
const STORAGE_KEY_SETTINGS = 'omnisave_settings_v1';

export const DEFAULT_SETTINGS: VaultSettings = {
  isLocked: false,
  autoDownloadAudio: false,
  defaultQuality: '1080p',
  theme: 'dark',
  autoSaveToHistory: true,
};

export function loadHistory(): MediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load history:', e);
    return [];
  }
}

export function saveHistory(items: MediaItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items.slice(0, 200)));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

export function loadSettings(): VaultSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: VaultSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function createSyncPayload(history: MediaItem[], settings: VaultSettings): SyncPayload {
  return {
    version: 1,
    exportedAt: Date.now(),
    deviceId: 'dev_' + Math.random().toString(36).substring(2, 8),
    history,
    settings: {
      defaultQuality: settings.defaultQuality,
      autoDownloadAudio: settings.autoDownloadAudio,
      theme: settings.theme,
    },
  };
}

export function restoreSyncPayload(payload: SyncPayload): { history: MediaItem[]; settings: Partial<VaultSettings> } {
  if (!payload || !Array.isArray(payload.history)) {
    throw new Error('Invalid sync payload data format');
  }
  return {
    history: payload.history,
    settings: payload.settings || {},
  };
}
