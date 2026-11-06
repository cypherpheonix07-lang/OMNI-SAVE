import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { UrlInputSection } from './components/UrlInputSection.js';
import { MediaCard } from './components/MediaCard.js';
import { BatchQueue } from './components/BatchQueue.js';
import { VideoModal } from './components/VideoModal.js';
import { HistoryVault } from './components/HistoryVault.js';
import { CrossPlatformSyncModal } from './components/CrossPlatformSyncModal.js';
import { VaultSecurityModal } from './components/VaultSecurityModal.js';
import { MediaItem, VaultSettings } from './types/media.js';
import { RealtimeDownloadTask } from './types/realtime.js';
import {
  loadHistory,
  saveHistory,
  loadSettings,
  saveSettings,
} from './utils/vault-storage.js';
import { SAMPLE_MEDIA_ITEMS, generateSafeFilename, parseBatchUrls } from './utils/media-parser.js';
import { calculateProgress, calculateSpeed, calculateEta } from './utils/realtime-engine.js';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts.js';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.js';
import { RealtimeDownloadMonitor } from './components/RealtimeDownloadMonitor.js';
import { FrontierAtlasWorkspace } from './components/FrontierAtlasWorkspace.js';
import {
  Sparkles,
  Download,
  Shield,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Radio,
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'history' | 'frontier'>('single');
  const [singleUrl, setSingleUrl] = useState('');
  const [batchText, setBatchText] = useState('');
  const [items, setItems] = useState<MediaItem[]>(SAMPLE_MEDIA_ITEMS);
  const [history, setHistory] = useState<MediaItem[]>(() => {
    const saved = loadHistory();
    return saved.length > 0 ? saved : SAMPLE_MEDIA_ITEMS;
  });
  const [settings, setSettings] = useState<VaultSettings>(loadSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');
  const [previewVideo, setPreviewVideo] = useState<MediaItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRealtimeMonitorOpen, setIsRealtimeMonitorOpen] = useState(false);
  const [realtimeTasks, setRealtimeTasks] = useState<RealtimeDownloadTask[]>([]);
  const [activeVideoForQr, setActiveVideoForQr] = useState<MediaItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync theme with HTML document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persist history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Persist settings changes
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Single URL Extraction
  const handleExtractSingle = async (url: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract video stream.');
      }

      const newItem: MediaItem = data.item;
      // Prepend to items list and history
      setItems((prev) => [newItem, ...prev.filter((i) => i.url !== newItem.url)]);
      setHistory((prev) => [newItem, ...prev.filter((i) => i.url !== newItem.url)]);
      showToast(`Extracted ${newItem.platform === 'pinterest' ? 'Pin' : 'Reel'}: ${newItem.title.slice(0, 30)}...`);
    } catch (err: any) {
      showToast(err.message || 'Error extracting video', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Batch Extraction
  const handleExtractBatch = async (urls: string[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/batch-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch extraction failed.');
      }

      const newItems: MediaItem[] = data.items || [];
      if (newItems.length > 0) {
        setItems((prev) => [...newItems, ...prev]);
        setHistory((prev) => [...newItems, ...prev]);
        showToast(`Successfully extracted ${newItems.length} videos into batch queue!`);
      } else {
        showToast('No videos could be retrieved from the supplied links.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Batch extraction error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Download a single item with chosen quality
  const handleDownload = (item: MediaItem, qualityId: string) => {
    const quality = item.qualities.find((q) => q.id === qualityId) || item.qualities[0];
    const filename = generateSafeFilename(
      item.title,
      item.platform,
      quality.resolution,
      quality.format
    );

    // Increment download count and update history
    setHistory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, downloadCount: (i.downloadCount || 0) + 1 } : i))
    );

    // Call server-side download proxy to bypass CORS and force file attachment download
    const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(quality.url)}&filename=${encodeURIComponent(
      filename
    )}&type=${quality.format}`;

    const link = document.createElement('a');
    link.href = proxyUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloading ${quality.label} (${filename})`);
  };

  // Real-Time streaming download with live progress and inline viewer
  const handleDownloadRealtime = async (item: MediaItem, qualityId: string) => {
    const quality = item.qualities.find((q) => q.id === qualityId) || item.qualities[0];
    const filename = generateSafeFilename(
      item.title,
      item.platform,
      quality.resolution,
      quality.format
    );

    const taskId = 'task_' + Math.random().toString(36).substring(2, 9);
    const newTask: RealtimeDownloadTask = {
      id: taskId,
      itemId: item.id,
      title: item.title,
      platform: item.platform,
      qualityId: quality.id,
      qualityLabel: quality.label,
      format: quality.format,
      receivedBytes: 0,
      totalBytes: 0,
      progressPct: 0,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      chunksCount: 0,
      status: 'connecting',
      streamUrl: quality.url,
      thumbnail: item.thumbnail,
      filename,
      startTime: Date.now(),
      item,
    };

    setRealtimeTasks((prev) => [newTask, ...prev.filter((t) => t.id !== taskId)]);
    setIsRealtimeMonitorOpen(true);
    showToast(`Streaming ${filename} in real-time...`);

    try {
      const streamUrl = `/api/download-proxy?url=${encodeURIComponent(quality.url)}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(streamUrl);

      if (!response.ok || !response.body) {
        throw new Error(`Failed to stream video: ${response.statusText}`);
      }

      const totalHeader = response.headers.get('content-length');
      const totalBytes = totalHeader ? parseInt(totalHeader, 10) : 18 * 1024 * 1024;

      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let receivedBytes = 0;
      let chunksCount = 0;
      const startTime = Date.now();
      let lastUpdate = Date.now();

      setRealtimeTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'streaming', totalBytes } : t))
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;
        chunksCount++;

        const now = Date.now();
        if (now - lastUpdate > 100) {
          const elapsedMs = now - startTime;
          const speed = calculateSpeed(receivedBytes, elapsedMs);
          const remaining = Math.max(0, totalBytes - receivedBytes);
          const eta = calculateEta(remaining, speed);
          const pct = calculateProgress(receivedBytes, totalBytes);

          setRealtimeTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    receivedBytes,
                    chunksCount,
                    speedBytesPerSec: speed,
                    etaSeconds: eta,
                    progressPct: pct,
                  }
                : t
            )
          );
          lastUpdate = now;
        }
      }

      // Final complete build
      const blob = new Blob(chunks, { type: quality.format === 'mp3' ? 'audio/mpeg' : 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);

      setRealtimeTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                receivedBytes,
                totalBytes: receivedBytes,
                progressPct: 100,
                status: 'completed',
                blobUrl,
              }
            : t
        )
      );

      // Trigger automatic save to user's disk
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment download counter
      setHistory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, downloadCount: (i.downloadCount || 0) + 1 } : i))
      );
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, downloadCount: (i.downloadCount || 0) + 1 } : i))
      );

      showToast(`Real-time download of ${filename} complete!`);
    } catch (err: any) {
      setRealtimeTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'error', error: err.message } : t))
      );
      showToast(err.message || 'Real-time stream error', 'error');
    }
  };

  // Register global keyboard shortcuts
  useGlobalShortcuts({
    onToggleVault: () => {
      setIsHistoryOpen((prev) => !prev);
    },
    onTriggerAction: () => {
      if (activeTab === 'single' && singleUrl.trim()) {
        handleExtractSingle(singleUrl.trim());
      } else if (activeTab === 'batch' && batchText.trim()) {
        const urls = parseBatchUrls(batchText);
        if (urls.length > 0) {
          handleExtractBatch(urls);
        } else {
          showToast('No valid Pinterest or Instagram links in batch input', 'error');
        }
      } else if (items.length > 0) {
        // Instant Real-Time Download the first item in queue
        const target = items[0];
        handleDownloadRealtime(target, target.selectedQualityId || '1080p');
      } else {
        showToast('Paste a video link or choose a sample to extract!', 'info');
      }
    },
    onCloseModals: () => {
      setIsHistoryOpen(false);
      setIsSyncOpen(false);
      setIsSecurityOpen(false);
      setPreviewVideo(null);
      setIsShortcutsOpen(false);
    },
    onToggleBatch: () => {
      setActiveTab((prev) => (prev === 'batch' ? 'single' : 'batch'));
    },
    onToggleRealtimeMonitor: () => {
      setIsRealtimeMonitorOpen((prev) => !prev);
    },
    onOpenShortcutsModal: () => {
      setIsShortcutsOpen(true);
    },
  });

  // Batch ZIP Download
  const handleDownloadZip = async () => {
    if (items.length === 0) return;
    setIsZipping(true);
    setZipProgress('Initiating ZIP archive...');

    try {
      const payloadItems = items.map((item) => {
        const quality = item.qualities[0];
        const filename = generateSafeFilename(item.title, item.platform, quality.resolution, quality.format);
        return {
          url: quality.url,
          filename,
        };
      });

      setZipProgress(`Bundling ${payloadItems.length} videos...`);
      const res = await fetch('/api/batch-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (!res.ok) {
        throw new Error('Server was unable to bundle ZIP file.');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `omnisave_batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`Downloaded batch archive with ${payloadItems.length} videos!`);
    } catch (err: any) {
      showToast(err.message || 'ZIP creation failed', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  // Sequential individual downloads
  const handleDownloadSequential = () => {
    items.forEach((item, index) => {
      setTimeout(() => {
        handleDownload(item, item.qualities[0].id);
      }, index * 1200); // 1.2s delay between files to avoid browser congestion
    });
    showToast(`Started sequential saving of ${items.length} clips.`);
  };

  const handleToggleFavorite = (id: string) => {
    const update = (list: MediaItem[]) =>
      list.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
    setItems(update);
    setHistory(update);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRemoveHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your saved vault history?')) {
      setHistory([]);
      showToast('Vault history cleared.');
    }
  };

  const handleUnlockVault = (pin: string): boolean => {
    if (settings.pinCode === pin) {
      setSettings((prev) => ({ ...prev, isLocked: false }));
      return true;
    }
    return false;
  };

  const handleSavePin = (pin: string | undefined) => {
    setSettings((prev) => ({
      ...prev,
      pinCode: pin,
      isLocked: !!pin,
    }));
    showToast(pin ? 'PIN passcode enabled!' : 'PIN passcode removed.');
  };

  const handleSendToPhone = (item: MediaItem) => {
    setActiveVideoForQr(item);
    setIsSyncOpen(true);
  };

  const handleExportBackup = () => {
    setActiveVideoForQr(null);
    setIsSyncOpen(true);
  };

  const handleImportHistory = (restored: MediaItem[]) => {
    setHistory(restored);
    setItems(restored);
    showToast(`Restored ${restored.length} clips from backup!`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-rose-500 selection:text-white">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md border ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                : 'bg-zinc-900/90 text-white border-zinc-800 dark:bg-white/95 dark:text-zinc-900'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Primary Navigation & Header */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSync={() => {
          setActiveVideoForQr(null);
          setIsSyncOpen(true);
        }}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onToggleRealtimeMonitor={() => setIsRealtimeMonitorOpen((prev) => !prev)}
        activeStreamingCount={
          realtimeTasks.filter((t) => t.status === 'streaming' || t.status === 'connecting').length
        }
        historyCount={history.length}
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'frontier' ? (
          <FrontierAtlasWorkspace onToast={showToast} />
        ) : (
          <>
            {/* URL Input Hero Section */}
            <UrlInputSection
              mode={activeTab === 'batch' ? 'batch' : 'single'}
              onExtractSingle={handleExtractSingle}
              onExtractBatch={handleExtractBatch}
              isLoading={isLoading}
              singleUrl={singleUrl}
              setSingleUrl={setSingleUrl}
              batchText={batchText}
              setBatchText={setBatchText}
            />

            {/* Batch Queue Bar (visible when batch items exist) */}
            {activeTab === 'batch' && (
              <BatchQueue
                items={items}
                onDownloadZip={handleDownloadZip}
                onDownloadSequential={handleDownloadSequential}
                onClearAll={() => setItems([])}
                isZipping={isZipping}
                zipProgress={zipProgress}
              />
            )}

            {/* Media Results Gallery */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {activeTab === 'batch' ? 'Batch Queue Results' : 'Extracted Media & Downloads'}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {items.length} Ready
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="hidden sm:inline">Automatic 1080p stream selector</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      disabled={isZipping}
                      className="font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Zip All ({items.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                  <Download className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    No active videos in queue
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Paste any Pinterest Pin or Instagram Reel link above to begin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {items.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onDownload={handleDownload}
                      onDownloadRealtime={handleDownloadRealtime}
                      onPreview={(previewItem) => setPreviewVideo(previewItem)}
                      onSendToPhone={handleSendToPhone}
                      onToggleFavorite={handleToggleFavorite}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Feature Highlights Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-zinc-200 dark:border-zinc-800/80">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Lightning Server-Side Processing
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Server-side stream resolution with memory caching returns direct MP4 video URLs in milliseconds, bypassing client network restrictions.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Batch Queuing & ZIP Bundles
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Queue up to 20 Pinterest pins and Instagram reels concurrently. Package entire collections into one uncompressed ZIP file with a single click.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Encrypted Vault & QR Sync
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    PIN-protected history keeps your personal media archives private. Instant QR code rendering lets you scan with any phone camera to save directly.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white dark:bg-zinc-950 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">OmniSave Studio</span>
            <span aria-hidden="true">·</span>
            <span>Personal Archival & Media Downloader</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Pinterest &amp; Instagram compliant extraction</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online (v2.4)
            </span>
          </div>
        </div>
      </footer>

      {/* Theater Video Player Modal */}
      <VideoModal
        item={previewVideo}
        onClose={() => setPreviewVideo(null)}
        onDownload={handleDownload}
      />

      {/* History Vault Modal */}
      <HistoryVault
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        settings={settings}
        onUnlockVault={handleUnlockVault}
        onDownload={handleDownload}
        onDownloadRealtime={handleDownloadRealtime}
        onPreview={(item) => setPreviewVideo(item)}
        onToggleFavorite={handleToggleFavorite}
        onRemoveItem={handleRemoveHistoryItem}
        onClearHistory={handleClearHistory}
        onExportBackup={handleExportBackup}
      />

      {/* Cross-Platform Device Sync Modal */}
      <CrossPlatformSyncModal
        isOpen={isSyncOpen}
        onClose={() => {
          setIsSyncOpen(false);
          setActiveVideoForQr(null);
        }}
        history={history}
        settings={settings}
        onImportHistory={handleImportHistory}
        activeVideoForQr={activeVideoForQr}
      />

      {/* Vault PIN Security Modal */}
      <VaultSecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        settings={settings}
        onSavePin={handleSavePin}
        onToggleLock={(locked) => setSettings((s) => ({ ...s, isLocked: locked }))}
      />

      {/* Real-Time Download & Stream Monitor */}
      <RealtimeDownloadMonitor
        tasks={realtimeTasks}
        isOpen={isRealtimeMonitorOpen}
        onToggleOpen={() => setIsRealtimeMonitorOpen((prev) => !prev)}
        onClose={() => setIsRealtimeMonitorOpen(false)}
        onCancelTask={(id) => {
          setRealtimeTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'cancelled' } : t))
          );
        }}
        onClearCompleted={() => {
          setRealtimeTasks((prev) =>
            prev.filter((t) => t.status === 'streaming' || t.status === 'connecting')
          );
        }}
        onOpenTheater={(item) => setPreviewVideo(item)}
      />

      {/* Global Keyboard Shortcuts Cheat Sheet */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
