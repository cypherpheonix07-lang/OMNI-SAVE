import React, { useState, useMemo } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Search,
  Filter,
  Trash2,
  Download,
  Play,
  Bookmark,
  Share2,
  ExternalLink,
  X,
  FileSpreadsheet,
  CheckCircle2,
  BarChart3,
  Tag,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowUpDown,
  RotateCcw,
  Radio,
} from 'lucide-react';
import { MediaItem, VaultSettings } from '../types/media.js';
import { calculateHistoryStats } from '../utils/vault-stats.js';
import {
  filterAndSortHistory,
  PlatformFilterOption,
  DateFilterOption,
  SortOption,
} from '../utils/vault-filter.js';

interface HistoryVaultProps {
  isOpen: boolean;
  onClose: () => void;
  history: MediaItem[];
  settings: VaultSettings;
  onUnlockVault: (pin: string) => boolean;
  onDownload: (item: MediaItem, qualityId: string) => void;
  onDownloadRealtime?: (item: MediaItem, qualityId: string) => void;
  onPreview: (item: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
  onExportBackup: () => void;
}

export const HistoryVault: React.FC<HistoryVaultProps> = ({
  isOpen,
  onClose,
  history,
  settings,
  onUnlockVault,
  onDownload,
  onDownloadRealtime,
  onPreview,
  onToggleFavorite,
  onRemoveItem,
  onClearHistory,
  onExportBackup,
}) => {
  const [filterPlatform, setFilterPlatform] = useState<PlatformFilterOption>('all');
  const [filterDate, setFilterDate] = useState<DateFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const stats = useMemo(() => calculateHistoryStats(history), [history]);

  const filteredItems = useMemo(
    () => filterAndSortHistory(history, searchQuery, filterPlatform, filterDate, sortBy),
    [history, searchQuery, filterPlatform, filterDate, sortBy]
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterPlatform !== 'all' ||
    filterDate !== 'all' ||
    sortBy !== 'newest';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterPlatform('all');
    setFilterDate('all');
    setSortBy('newest');
  };

  if (!isOpen) return null;

  // Handle PIN unlock gate if vault is protected
  const isLocked = settings.pinCode && settings.isLocked;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlockVault(pinAttempt);
    if (!success) {
      setPinError(true);
      setPinAttempt('');
    } else {
      setPinError(false);
      setPinAttempt('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Shield className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="vault-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Secure History Vault
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-semibold">
                  {history.length} Clips Stored
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Encrypted local tracking for all extracted Pins, Reels, and audio streams.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportBackup}
              title="Export Vault JSON Backup"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Backup</span>
            </button>

            {history.length > 0 && !isLocked && (
              <button
                type="button"
                onClick={onClearHistory}
                title="Clear All History"
                className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                aria-label="Clear all vault history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close vault"
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIN Lock Gate View if Vault is locked */}
        {isLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Vault Passcode Required
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-6">
              This vault is protected by a PIN passcode. Enter your 4-digit security code to reveal saved media.
            </p>

            <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs">
              <input
                type="password"
                maxLength={8}
                value={pinAttempt}
                onChange={(e) => {
                  setPinAttempt(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter PIN..."
                aria-label="Enter PIN code to unlock vault"
                className="w-full text-center text-xl tracking-widest py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {pinError && (
                <span className="text-xs font-semibold text-rose-500">
                  Incorrect PIN code. Please try again.
                </span>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Unlock Vault
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Vault Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Summary Statistics Section */}
            {history.length > 0 && (
              <section aria-label="Vault Statistics" className="bg-zinc-50/80 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800">
                <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Vault Analytics &amp; Statistics
                    </span>
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {stats.totalDownloads.toLocaleString()} Downloads Across {stats.totalItems} Saved Clips
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                  >
                    <span>{showStats ? 'Hide Analytics' : 'Show Analytics'}</span>
                    {showStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showStats && (
                  <div className="p-4 sm:px-6 sm:py-3.5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Most Downloaded Platforms */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-zinc-500" />
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Most Downloaded Platforms
                          </h4>
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400">
                          Top: {stats.topPlatform}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {stats.platforms.map((p) => {
                          const isPinterest = p.platform === 'pinterest';
                          return (
                            <div key={p.platform} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isPinterest ? 'bg-red-500' : 'bg-pink-500'
                                    }`}
                                  />
                                  <span>{p.label}</span>
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                                  <span>{p.count} clips ({p.totalDownloads.toLocaleString()} saves)</span>
                                  <span>·</span>
                                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{p.percentage}%</span>
                                </div>
                              </div>
                              {/* Progress bar */}
                              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isPinterest
                                      ? 'bg-gradient-to-r from-red-600 to-rose-500'
                                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500'
                                  }`}
                                  style={{ width: `${p.percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top-Saved Media Categories */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-zinc-500" />
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Top-Saved Media Categories
                          </h4>
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400">
                          {stats.topCategories.length} categories active
                        </span>
                      </div>

                      {stats.topCategories.length === 0 ? (
                        <p className="text-xs text-zinc-400">No categories tagged yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.topCategories.map((c) => (
                            <div key={c.category} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                                  #{c.category}
                                </span>
                                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                                  <span>{c.count} items</span>
                                  <span>·</span>
                                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{c.percentage}%</span>
                                </div>
                              </div>
                              {/* Progress bar */}
                              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(8, c.percentage))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Filter and Search Bar with Platform and Date Dropdowns */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, creator, or #tag..."
                    aria-label="Search saved videos"
                    className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdowns Row: Platform, Date Range, Sort Order */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Platform Filter Dropdown */}
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      aria-label="Filter by platform"
                      value={filterPlatform}
                      onChange={(e) => setFilterPlatform(e.target.value as PlatformFilterOption)}
                      className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
                    >
                      <option value="all">All Platforms ({history.length})</option>
                      <option value="pinterest">Pinterest Only</option>
                      <option value="instagram">Instagram Only</option>
                      <option value="favorites">Favorites Only</option>
                    </select>
                  </div>

                  {/* Date Range Filter Dropdown */}
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      aria-label="Filter by date added"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value as DateFilterOption)}
                      className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Past 24 Hours</option>
                      <option value="week">Past 7 Days</option>
                      <option value="month">Past 30 Days</option>
                    </select>
                  </div>

                  {/* Sort Order Dropdown */}
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      aria-label="Sort videos by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="downloads">Sort: Most Downloaded</option>
                      <option value="title">Sort: Title (A-Z)</option>
                    </select>
                  </div>

                  {/* Reset Filters Button */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors flex items-center gap-1 shrink-0"
                      title="Reset all active filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Indicator Bar */}
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <strong className="text-zinc-800 dark:text-zinc-200">{filteredItems.length}</strong> of{' '}
                    {history.length} items
                  </span>
                  {hasActiveFilters && (
                    <span className="text-rose-500 font-medium">· Filtered</span>
                  )}
                </div>

                {searchQuery && (
                  <span className="text-[11px] text-zinc-400 truncate max-w-xs">
                    Matching &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Shield className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    No videos found in vault
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    {history.length === 0
                      ? 'Extract any Pinterest Pin or Instagram Reel to automatically preserve it here.'
                      : 'No items match your active filters or search terms.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => {
                    const bestQuality = item.qualities[0];
                    return (
                      <div
                        key={item.id}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-3 flex gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                      >
                        {/* Thumbnail preview */}
                        <div
                          onClick={() => onPreview(item)}
                          className="relative w-24 h-32 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer group"
                        >
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-6 h-6 fill-white text-white" />
                          </div>
                          <span
                            className={`absolute top-1 left-1 text-[9px] font-bold uppercase px-1 rounded text-white ${
                              item.platform === 'pinterest' ? 'bg-red-600' : 'bg-pink-600'
                            }`}
                          >
                            {item.platform === 'pinterest' ? 'Pin' : 'Reel'}
                          </span>
                        </div>

                        {/* Info & quick actions */}
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[11px] font-semibold text-zinc-500 truncate">
                                {item.author.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => onToggleFavorite(item.id)}
                                aria-label="Toggle favorite"
                                className="text-zinc-400 hover:text-amber-500"
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 ${
                                    item.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                                  }`}
                                />
                              </button>
                            </div>
                            <h4
                              className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2"
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                              <span>{bestQuality?.resolution}</span>
                              <span>·</span>
                              <span>{item.duration || '0:30'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onPreview(item)}
                                className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Watch downloaded video in real-time theater"
                              >
                                <Play className="w-3 h-3 fill-current text-rose-500" />
                                <span>Watch</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDownloadRealtime
                                    ? onDownloadRealtime(item, bestQuality.id)
                                    : onDownload(item, bestQuality.id)
                                }
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Stream and download in real-time"
                              >
                                <Radio className="w-3 h-3 text-white animate-pulse" />
                                <span>Stream</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                              title="Delete from vault"
                              aria-label="Delete video from vault"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
