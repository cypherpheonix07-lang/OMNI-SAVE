import { MediaItem } from '../types/media.js';

export type TimeRangeDays = 7 | 14 | 30;

export interface FrequencyDataPoint {
  dateKey: string; // YYYY-MM-DD
  label: string; // e.g., "Nov 04"
  timestamp: number;
  clipCount: number;
  downloadEvents: number;
  pinterestCount: number;
  instagramCount: number;
}

export interface FrequencySummary {
  points: FrequencyDataPoint[];
  peakDayLabel: string;
  peakDownloads: number;
  averagePerDay: number;
  totalPeriodDownloads: number;
  totalPeriodClips: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toUtcDateKey(ms: number): string {
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatShortDateLabel(ms: number): string {
  const d = new Date(ms);
  const m = MONTH_NAMES[d.getUTCMonth()] || 'Jan';
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${m} ${day}`;
}

/**
 * Aggregates MediaItem history into a continuous daily time series over the last `days` days.
 * Ensures every day in the window has a deterministic zero-filled or populated bucket.
 */
export function buildDownloadFrequencySeries(
  history: MediaItem[],
  days: TimeRangeDays = 14,
  referenceNowMs: number = Date.now()
): FrequencySummary {
  const dayMs = 24 * 60 * 60 * 1000;
  // Normalize reference time to start of UTC day
  const refDate = new Date(referenceNowMs);
  const endOfWindowUtc = Date.UTC(
    refDate.getUTCFullYear(),
    refDate.getUTCMonth(),
    refDate.getUTCDate()
  );

  const buckets = new Map<string, FrequencyDataPoint>();
  const orderedKeys: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const bucketTs = endOfWindowUtc - i * dayMs;
    const key = toUtcDateKey(bucketTs);
    orderedKeys.push(key);
    buckets.set(key, {
      dateKey: key,
      label: formatShortDateLabel(bucketTs),
      timestamp: bucketTs,
      clipCount: 0,
      downloadEvents: 0,
      pinterestCount: 0,
      instagramCount: 0,
    });
  }

  for (const item of history) {
    const itemTs = typeof item.createdAt === 'number' && item.createdAt > 0 ? item.createdAt : referenceNowMs;
    const key = toUtcDateKey(itemTs);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.clipCount += 1;
      const activityScore = Math.max(1, item.downloadCount || 1);
      bucket.downloadEvents += activityScore;
      if (item.platform === 'pinterest') {
        bucket.pinterestCount += 1;
      } else if (item.platform === 'instagram') {
        bucket.instagramCount += 1;
      }
    }
  }

  const points = orderedKeys.map((k) => buckets.get(k)!);
  let peakDownloads = 0;
  let peakDayLabel = points[points.length - 1]?.label || 'N/A';
  let totalPeriodDownloads = 0;
  let totalPeriodClips = 0;

  for (const pt of points) {
    totalPeriodDownloads += pt.downloadEvents;
    totalPeriodClips += pt.clipCount;
    if (pt.downloadEvents >= peakDownloads) {
      peakDownloads = pt.downloadEvents;
      peakDayLabel = pt.label;
    }
  }

  const averagePerDay = points.length > 0 ? Math.round((totalPeriodDownloads / points.length) * 10) / 10 : 0;

  return {
    points,
    peakDayLabel,
    peakDownloads,
    averagePerDay,
    totalPeriodDownloads,
    totalPeriodClips,
  };
}
