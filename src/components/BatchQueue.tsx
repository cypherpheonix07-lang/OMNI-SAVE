import React from 'react';
import {
  Archive,
  Download,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MediaItem } from '../types/media.js';

interface BatchQueueProps {
  items: MediaItem[];
  onDownloadZip: () => void;
  onDownloadSequential: () => void;
  onClearAll: () => void;
  isZipping: boolean;
  zipProgress?: string;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  onDownloadZip,
  onDownloadSequential,
  onClearAll,
  isZipping,
  zipProgress,
}) => {
  if (items.length === 0) return null;

  const readyCount = items.filter((i) => i.status === 'ready' || i.status === 'downloaded').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white shadow-xl border border-zinc-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Status summary */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Active Batch Queue</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {readyCount} of {items.length} Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bulk processed videos ready for one-click ZIP download or individual retrieval.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={onDownloadZip}
              disabled={isZipping || readyCount === 0}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isZipping ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{zipProgress || 'Bundling ZIP...'}</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Download All as ZIP</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onDownloadSequential}
              disabled={readyCount === 0}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sequential Save</span>
            </button>

            <button
              type="button"
              onClick={onClearAll}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Clear Batch Queue"
              aria-label="Clear all queue items"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
