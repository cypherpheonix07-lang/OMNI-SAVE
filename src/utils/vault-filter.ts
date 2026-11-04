import { MediaItem } from '../types/media.js';

export type PlatformFilterOption = 'all' | 'pinterest' | 'instagram' | 'favorites';
export type DateFilterOption = 'all' | 'today' | 'week' | 'month';
export type SortOption = 'newest' | 'oldest' | 'downloads' | 'title';

export function filterAndSortHistory(
  items: MediaItem[],
  query: string,
  platform: PlatformFilterOption,
  dateRange: DateFilterOption,
  sortBy: SortOption = 'newest',
  now: number = Date.now()
): MediaItem[] {
  if (!Array.isArray(items)) return [];

  const cleanQuery = (query || '').trim().toLowerCase();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // 1. Filter
  const filtered = items.filter((item) => {
    // Platform / Favorites filter
    if (platform === 'pinterest' && item.platform !== 'pinterest') return false;
    if (platform === 'instagram' && item.platform !== 'instagram') return false;
    if (platform === 'favorites' && !item.isFavorite) return false;

    // Date range filter
    if (dateRange !== 'all') {
      const itemTime = item.createdAt || 0;
      const age = now - itemTime;
      if (dateRange === 'today' && age > ONE_DAY_MS) return false;
      if (dateRange === 'week' && age > 7 * ONE_DAY_MS) return false;
      if (dateRange === 'month' && age > 30 * ONE_DAY_MS) return false;
    }

    // Search query filter (title, author name, username, caption, tags)
    if (cleanQuery) {
      const matchTitle = (item.title || '').toLowerCase().includes(cleanQuery);
      const matchAuthor = (item.author?.name || '').toLowerCase().includes(cleanQuery);
      const matchUsername = (item.author?.username || '').toLowerCase().includes(cleanQuery);
      const matchCaption = (item.caption || '').toLowerCase().includes(cleanQuery);
      const matchTags = Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(cleanQuery));

      if (!matchTitle && !matchAuthor && !matchUsername && !matchCaption && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // 2. Sort
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'downloads':
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'newest':
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });
}
