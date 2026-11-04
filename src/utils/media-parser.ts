import { MediaItem, MediaPlatform } from '../types/media.js';

/**
 * Detects whether a URL belongs to Pinterest, Instagram, or neither.
 */
export function detectPlatform(input: string): MediaPlatform {
  if (!input || typeof input !== 'string') return 'unknown';
  const clean = input.trim().toLowerCase();

  if (
    clean.includes('pinterest.com') ||
    clean.includes('pin.it') ||
    clean.includes('pinterest.')
  ) {
    return 'pinterest';
  }

  if (
    clean.includes('instagram.com') ||
    clean.includes('instagr.am') ||
    clean.includes('threads.net')
  ) {
    return 'instagram';
  }

  return 'unknown';
}

/**
 * Cleans and normalizes URLs (trims, handles tracking query parameters).
 */
export function sanitizeUrl(input: string): string {
  if (!input) return '';
  let url = input.trim();
  
  // Strip common leading tags or markdown brackets
  url = url.replace(/^<|>$/g, '').replace(/[()]/g, '');

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Remove UTM tracking and unnecessary analytics parameters
    const paramsToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (
        key.startsWith('utm_') ||
        key === 'igsh' ||
        key === 'fbclid' ||
        key === 'sender' ||
        key === 'invite_code'
      ) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach(k => parsed.searchParams.delete(k));

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Parses batch input text into a list of unique valid URLs.
 * Supports newline separation, comma separation, whitespace, and embedded URLs in text.
 */
export function parseBatchUrls(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  // Match all potential http(s) URLs or pin.it/pinterest/instagram patterns
  const urlRegex = /(https?:\/\/[^\s,;"'<>]+|(?:www\.)?(?:pinterest\.[a-z.]+|pin\.it|instagram\.com)\/[^\s,;"'<>]+)/gi;
  const matches = text.match(urlRegex) || [];

  const unique = new Set<string>();
  for (const raw of matches) {
    const sanitized = sanitizeUrl(raw);
    const platform = detectPlatform(sanitized);
    if (platform !== 'unknown' && !unique.has(sanitized)) {
      unique.add(sanitized);
    }
  }

  return Array.from(unique);
}

/**
 * Formats bytes into human-readable string (KB, MB, GB).
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return 'Variable';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Formats duration in seconds to MM:SS or HH:MM:SS.
 */
export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '0:15';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Generates clean, safe filenames for downloaded videos.
 */
export function generateSafeFilename(
  title: string,
  platform: string,
  resolution: string,
  extension: string = 'mp4'
): string {
  const cleanTitle = (title || 'video')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40)
    .replace(/^_+|_+$/g, '');

  const dateStr = new Date().toISOString().slice(0, 10);
  return `${platform}_${cleanTitle || 'clip'}_${resolution}_${dateStr}.${extension}`;
}

/**
 * Pre-configured verified sample media items for instant demonstration
 * and testing without external network rate-limiting.
 */
export const SAMPLE_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'sample-pin-1',
    url: 'https://www.pinterest.com/pin/102342419034298123/',
    originalInput: 'https://www.pinterest.com/pin/102342419034298123/',
    platform: 'pinterest',
    title: 'Minimalist Japandi Living Room Tour & Interior Aesthetic',
    caption: 'Cozy morning light, textured limewash walls, and natural oak furniture details. Perfect inspiration for home design enthusiasts.',
    author: {
      name: 'Studio Aethel',
      username: 'studioaethel',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    aspectRatio: '9:16',
    duration: '0:34',
    selectedQualityId: '1080p',
    downloadCount: 1420,
    createdAt: Date.now() - 3600000 * 2,
    status: 'ready',
    tags: ['Aesthetic', 'Interior', 'Japandi'],
    qualities: [
      {
        id: '1080p',
        label: '1080p Full HD',
        resolution: '1080p (1080x1920)',
        format: 'mp4',
        url: 'https://vjs.zencdn.net/v/oceans.mp4',
        sizeEstimate: '18.4 MB',
        bitrate: '4.8 Mbps',
        isOriginal: true,
      },
      {
        id: '720p',
        label: '720p HD',
        resolution: '720p (720x1280)',
        format: 'mp4',
        url: 'https://vjs.zencdn.net/v/oceans.mp4',
        sizeEstimate: '9.8 MB',
        bitrate: '2.5 Mbps',
      },
      {
        id: 'audio',
        label: 'Audio Only (MP3)',
        resolution: '320kbps Audio',
        format: 'mp3',
        url: 'https://vjs.zencdn.net/v/oceans.mp4',
        sizeEstimate: '1.4 MB',
      },
    ],
  },
  {
    id: 'sample-insta-1',
    url: 'https://www.instagram.com/reel/C8k9vXYZ123/',
    originalInput: 'https://www.instagram.com/reel/C8k9vXYZ123/',
    platform: 'instagram',
    title: 'Cinematic Rainy Tokyo Street Food Masterclass',
    caption: 'Simmering tonkotsu ramen under the neon lights of Shinjuku alleyways. Sound on for pure ASMR sizzling broth.',
    author: {
      name: 'Tokyo Gourmet Beats',
      username: 'tokyogourmet',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    aspectRatio: '9:16',
    duration: '0:28',
    selectedQualityId: '1080p',
    downloadCount: 3892,
    createdAt: Date.now() - 3600000 * 5,
    status: 'ready',
    tags: ['Food', 'Tokyo', 'ASMR'],
    qualities: [
      {
        id: '1080p',
        label: '1080p Full HD (60fps)',
        resolution: '1080p (1080x1920)',
        format: 'mp4',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        sizeEstimate: '22.1 MB',
        bitrate: '5.2 Mbps',
        isOriginal: true,
      },
      {
        id: '720p',
        label: '720p HD',
        resolution: '720p (720x1280)',
        format: 'mp4',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        sizeEstimate: '12.3 MB',
        bitrate: '3.0 Mbps',
      },
      {
        id: 'audio',
        label: 'Audio Only (MP3)',
        resolution: 'ASMR Track',
        format: 'mp3',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        sizeEstimate: '1.2 MB',
      },
    ],
  },
  {
    id: 'sample-pin-2',
    url: 'https://pin.it/7xK9pL2q1',
    originalInput: 'https://pin.it/7xK9pL2q1',
    platform: 'pinterest',
    title: 'Ceramic Pottery Throwing & Glazing Timelapse',
    caption: 'Step by step handcrafting a speckled stoneware matcha bowl. The trimming phase is oddly satisfying.',
    author: {
      name: 'Earth & Kiln',
      username: 'earthandkiln',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    thumbnail: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    aspectRatio: '9:16',
    duration: '0:45',
    selectedQualityId: '1080p',
    downloadCount: 914,
    createdAt: Date.now() - 3600000 * 12,
    status: 'ready',
    tags: ['Ceramics', 'Handmade', 'Art'],
    qualities: [
      {
        id: '1080p',
        label: '1080p Master Copy',
        resolution: '1080p (1080x1920)',
        format: 'mp4',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        sizeEstimate: '26.7 MB',
        bitrate: '5.8 Mbps',
        isOriginal: true,
      },
      {
        id: '720p',
        label: '720p HD',
        resolution: '720p (720x1280)',
        format: 'mp4',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        sizeEstimate: '14.1 MB',
      },
    ],
  },
];
