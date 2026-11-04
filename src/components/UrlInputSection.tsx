import React, { useState } from 'react';
import {
  Link2,
  Search,
  Sparkles,
  Clipboard,
  X,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { detectPlatform, parseBatchUrls, SAMPLE_MEDIA_ITEMS } from '../utils/media-parser.js';

interface UrlInputSectionProps {
  mode: 'single' | 'batch';
  onExtractSingle: (url: string) => Promise<void>;
  onExtractBatch: (urls: string[]) => Promise<void>;
  isLoading: boolean;
  singleUrl?: string;
  setSingleUrl?: (val: string) => void;
  batchText?: string;
  setBatchText?: (val: string) => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  mode,
  onExtractSingle,
  onExtractBatch,
  isLoading,
  singleUrl: externalSingleUrl,
  setSingleUrl: externalSetSingleUrl,
  batchText: externalBatchText,
  setBatchText: externalSetBatchText,
}) => {
  const [internalSingleUrl, setInternalSingleUrl] = useState('');
  const [internalBatchText, setInternalBatchText] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const singleUrl = externalSingleUrl !== undefined ? externalSingleUrl : internalSingleUrl;
  const setSingleUrl = externalSetSingleUrl || setInternalSingleUrl;

  const batchText = externalBatchText !== undefined ? externalBatchText : internalBatchText;
  const setBatchText = externalSetBatchText || setInternalBatchText;

  const detectedPlatform = detectPlatform(singleUrl);

  const handlePasteClipboard = async (target: 'single' | 'batch') => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (target === 'single') {
          setSingleUrl(text.trim());
          setErrorNotice(null);
        } else {
          setBatchText(batchText ? `${batchText}\n${text.trim()}` : text.trim());
        }
      }
    } catch {
      setErrorNotice('Clipboard access was blocked by browser. Please paste directly.');
    }
  };

  const handleSingleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleUrl.trim()) {
      setErrorNotice('Please paste a Pinterest or Instagram video link.');
      return;
    }
    setErrorNotice(null);
    await onExtractSingle(singleUrl.trim());
  };

  const handleBatchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const urls = parseBatchUrls(batchText);
    if (urls.length === 0) {
      setErrorNotice('No valid Pinterest or Instagram URLs detected in the input.');
      return;
    }
    setErrorNotice(null);
    await onExtractBatch(urls);
  };

  const loadSample = (sampleUrl: string) => {
    setSingleUrl(sampleUrl);
    setErrorNotice(null);
  };

  const loadBatchSample = () => {
    const sampleBatch = [
      'https://www.pinterest.com/pin/102342419034298123/',
      'https://www.instagram.com/reel/C8k9vXYZ123/',
      'https://pin.it/7xK9pL2q1',
    ].join('\n');
    setBatchText(sampleBatch);
    setErrorNotice(null);
  };

  const batchDetectedUrls = parseBatchUrls(batchText);

  return (
    <section className="w-full py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero title & subtitle */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 mb-3">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Ultra-HD Pinterest & Instagram Media Extractor</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-sans">
            Download Pins & Reels in <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">True 1080p HD</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            High-speed server processing, multi-link batch queues, watermark-free streams, encrypted vault storage, and instant mobile sync.
          </p>
        </div>

        {errorNotice && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="flex-1">{errorNotice}</p>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-900"
              aria-label="Dismiss error notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'single' ? (
          /* Single URL Input Form */
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 transition-all">
            <form onSubmit={handleSingleSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3.5 text-zinc-400 dark:text-zinc-500">
                  <Link2 className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={singleUrl}
                  onChange={(e) => {
                    setSingleUrl(e.target.value);
                    if (errorNotice) setErrorNotice(null);
                  }}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSingleSubmit();
                    }
                  }}
                  placeholder="Paste Pinterest Pin link or Instagram Reel URL..."
                  aria-label="Pinterest or Instagram video URL"
                  className="w-full pl-11 pr-24 py-3.5 text-sm sm:text-base bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />

                <div className="absolute right-2.5 flex items-center gap-1">
                  {detectedPlatform !== 'unknown' && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        detectedPlatform === 'pinterest'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                      }`}
                    >
                      {detectedPlatform === 'pinterest' ? 'Pinterest' : 'Instagram'}
                    </span>
                  )}
                  {singleUrl ? (
                    <button
                      type="button"
                      onClick={() => setSingleUrl('')}
                      aria-label="Clear URL input"
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePasteClipboard('single')}
                      className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-md transition-colors flex items-center gap-1"
                      title="Paste link from clipboard"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Paste</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-60 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Extract & Save</span>
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono bg-black/20 text-white/90 rounded border border-white/20">
                      Ctrl+↵
                    </kbd>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Samples */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Try Live Samples:</span>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_MEDIA_ITEMS[0].url)}
                className="text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 underline decoration-zinc-300 dark:decoration-zinc-700 transition-colors"
              >
                Japandi Interior Pin
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_MEDIA_ITEMS[1].url)}
                className="text-zinc-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 underline decoration-zinc-300 dark:decoration-zinc-700 transition-colors"
              >
                Tokyo Street Food Reel
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_MEDIA_ITEMS[2].url)}
                className="text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 underline decoration-zinc-300 dark:decoration-zinc-700 transition-colors"
              >
                Pottery Timelapse Pin
              </button>
            </div>
          </div>
        ) : (
          /* Batch URLs Input Form */
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Batch Processing Queue</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  ({batchDetectedUrls.length} valid links detected)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadBatchSample}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Load 3 Sample Links
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteClipboard('batch')}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Paste Lines
                </button>
              </div>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-3">
              <textarea
                rows={5}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleBatchSubmit();
                  }
                }}
                placeholder="Paste multiple Pinterest & Instagram links (one per line, up to 20 links)...&#10;https://www.pinterest.com/pin/...&#10;https://www.instagram.com/reel/..."
                aria-label="Multiple Pinterest and Instagram URLs for batch download"
                className="w-full p-3.5 text-sm font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Supports concurrent resolution, direct ZIP bundling, and high-res streams</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {batchText && (
                    <button
                      type="button"
                      onClick={() => setBatchText('')}
                      className="px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || batchDetectedUrls.length === 0}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing Batch ({batchDetectedUrls.length})...</span>
                      </>
                    ) : (
                      <>
                        <span>Extract Batch ({batchDetectedUrls.length})</span>
                        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono bg-black/20 text-white/90 rounded border border-white/20">
                          Ctrl+↵
                        </kbd>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};
