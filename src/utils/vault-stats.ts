import { MediaItem } from '../types/media.js';

export interface PlatformStat {
  platform: 'pinterest' | 'instagram';
  label: string;
  count: number;
  totalDownloads: number;
  percentage: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface HistorySummaryStats {
  totalItems: number;
  totalDownloads: number;
  platforms: PlatformStat[];
  topCategories: CategoryStat[];
  topPlatform: string;
  topCategory: string;
}

/**
 * Computes analytics and summary statistics from history items
 */
export function calculateHistoryStats(items: MediaItem[]): HistorySummaryStats {
  const totalItems = items.length;
  if (totalItems === 0) {
    return {
      totalItems: 0,
      totalDownloads: 0,
      platforms: [],
      topCategories: [],
      topPlatform: 'None',
      topCategory: 'None',
    };
  }

  let pinterestCount = 0;
  let instagramCount = 0;
  let pinterestDownloads = 0;
  let instagramDownloads = 0;
  let totalDownloads = 0;

  const categoryCounts = new Map<string, number>();

  for (const item of items) {
    const downloads = item.downloadCount || 0;
    totalDownloads += downloads;

    if (item.platform === 'pinterest') {
      pinterestCount++;
      pinterestDownloads += downloads;
    } else if (item.platform === 'instagram') {
      instagramCount++;
      instagramDownloads += downloads;
    }

    // Category / Tag extraction
    const tags = item.tags && item.tags.length > 0 ? item.tags : [item.platform === 'pinterest' ? 'Pin Board' : 'Reels'];
    for (const tag of tags) {
      const clean = tag.trim();
      if (clean) {
        categoryCounts.set(clean, (categoryCounts.get(clean) || 0) + 1);
      }
    }
  }

  const platforms: PlatformStat[] = [
    {
      platform: 'pinterest' as const,
      label: 'Pinterest',
      count: pinterestCount,
      totalDownloads: pinterestDownloads,
      percentage: totalItems > 0 ? Math.round((pinterestCount / totalItems) * 100) : 0,
    },
    {
      platform: 'instagram' as const,
      label: 'Instagram',
      count: instagramCount,
      totalDownloads: instagramDownloads,
      percentage: totalItems > 0 ? Math.round((instagramCount / totalItems) * 100) : 0,
    },
  ].sort((a, b) => b.count - a.count);

  const topCategories: CategoryStat[] = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalItems) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPlatform = platforms[0]?.count > 0 ? platforms[0].label : 'None';
  const topCategory = topCategories[0]?.category || 'General';

  return {
    totalItems,
    totalDownloads,
    platforms,
    topCategories,
    topPlatform,
    topCategory,
  };
}
