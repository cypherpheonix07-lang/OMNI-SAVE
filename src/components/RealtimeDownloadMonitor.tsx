import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RealtimeDownloadTask } from '../types/realtime.js';
import { formatSpeed, formatEta } from '../utils/realtime-engine.js';
import { formatFileSize } from '../utils/media-parser.js';
import { MediaItem } from '../types/media.js';

interface RealtimeDownloadMonitorProps {
  tasks: RealtimeDownloadTask[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onCancelTask: (taskId: string) => void;
  onClearCompleted: () => void;
  onOpenTheater: (item: MediaItem) => void;
}

export const RealtimeDownloadMonitor: React.FC<RealtimeDownloadMonitorProps> = ({
  tasks,
  isOpen,
  onToggleOpen,
  onClose,
  onCancelTask,
  onClearCompleted,
  onOpenTheater,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activePlaybackTaskId, setActivePlaybackTaskId] = useState<string | null>(null);
  const [isPlayingLive, setIsPlayingLive] = useState(true);
  const [isLiveMuted, setIsLiveMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Set default active playback task to the latest streaming or completed task
  useEffect(() => {
    if (tasks.length > 0 && (!activePlaybackTaskId || !tasks.some((t) => t.id === activePlaybackTaskId))) {
      setActivePlaybackTaskId(tasks[tasks.length - 1].id);
    }
  }, [tasks, activePlaybackTaskId]);

  if (!isOpen || tasks.length === 0) return null;

  const activeTask = tasks.find((t) => t.id === activePlaybackTaskId) || tasks[tasks.length - 1];
  const streamingCount = tasks.filter((t) => t.status === 'streaming' || t.status === 'connecting').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const totalSpeed = tasks
    .filter((t) => t.status === 'streaming')
    .reduce((sum, t) => sum + t.speedBytesPerSec, 0);

  // Minimized Floating Pill Widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40 animate-slideUp">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950/95 text-white border border-zinc-800 shadow-2xl backdrop-blur-md hover:scale-102 transition-all cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span>Real-Time Stream Monitor</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                {streamingCount > 0 ? `${streamingCount} Active` : `${completedCount} Ready`}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {streamingCount > 0 ? `${formatSpeed(totalSpeed)} · Live` : 'All tasks completed'}
            </div>
          </div>
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        </button>
      </div>
    );
  }

  // Expanded Real-Time Command Center Dock
  return (
    <div
      role="region"
      aria-label="Real-Time Download & Stream Monitor"
      className="fixed bottom-6 right-4 sm:right-6 z-40 w-[94vw] sm:w-[480px] max-h-[85vh] flex flex-col bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800/90 overflow-hidden animate-slideUp"
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-600/30 text-rose-400 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-tight">Real-Time Streaming Downloader</h3>
              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Engine
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              {streamingCount > 0
                ? `${streamingCount} streaming at ${formatSpeed(totalSpeed)}`
                : `${completedCount} downloads completed`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize monitor"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close real-time monitor"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Video Player Area (Watches the stream in real-time) */}
      {activeTask && (
        <div className="relative aspect-video w-full bg-black shrink-0 overflow-hidden group">
          <video
            ref={videoRef}
            src={activeTask.blobUrl || `/api/download-proxy?url=${encodeURIComponent(activeTask.streamUrl)}&inline=1`}
            autoPlay
            playsInline
            loop
            muted={isLiveMuted}
            className="w-full h-full object-contain"
            onPlay={() => setIsPlayingLive(true)}
            onPause={() => setIsPlayingLive(false)}
          />

          {/* Live Stream Overlay Tag */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-600/90 text-white tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live Stream
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-black/60 text-white backdrop-blur-xs border border-white/10">
              {activeTask.qualityLabel}
            </span>
          </div>

          {/* Quick Overlay Controls */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlayingLive) {
                      videoRef.current.pause();
                    } else {
                      videoRef.current.play();
                    }
                  }
                }}
                className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-xs transition-colors"
                aria-label={isPlayingLive ? 'Pause live stream' : 'Play live stream'}
              >
                {isPlayingLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsLiveMuted(!isLiveMuted)}
                className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-xs transition-colors"
                aria-label={isLiveMuted ? 'Unmute stream' : 'Mute stream'}
              >
                {isLiveMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenTheater(activeTask.item)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-xs text-[11px] font-semibold text-white transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Theater</span>
            </button>
          </div>
        </div>
      )}

      {/* Task Queue List */}
      <div className="p-4 flex-1 overflow-y-auto max-h-60 space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {tasks.map((task) => {
          const isSelected = activePlaybackTaskId === task.id;
          const isDone = task.status === 'completed';
          const isError = task.status === 'error';
          const isStreaming = task.status === 'streaming' || task.status === 'connecting';

          return (
            <div
              key={task.id}
              onClick={() => setActivePlaybackTaskId(task.id)}
              className={`pt-3 first:pt-0 cursor-pointer rounded-xl p-2 transition-colors ${
                isSelected ? 'bg-zinc-100 dark:bg-zinc-900/80' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                        task.platform === 'pinterest'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                      }`}
                    >
                      {task.platform}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {task.qualityLabel.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-rose-500">· Playing in Real Time</span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={task.title}>
                    {task.title}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  {isDone ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Saved
                    </span>
                  ) : isError ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {task.progressPct}%
                      </span>
                      <span className="text-[10px] text-rose-500 font-mono font-medium">
                        {formatSpeed(task.speedBytesPerSec)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time animated progress bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isDone
                      ? 'bg-emerald-500'
                      : isError
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 animate-pulse'
                  }`}
                  style={{ width: `${task.progressPct}%` }}
                />
              </div>

              {/* Progress details stats row */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-1.5">
                <span>
                  {formatFileSize(task.receivedBytes)}
                  {task.totalBytes > 0 && ` / ${formatFileSize(task.totalBytes)}`}
                </span>
                <div className="flex items-center gap-2">
                  <span>{task.chunksCount} chunks</span>
                  {isStreaming && (
                    <span className="flex items-center gap-0.5 text-zinc-700 dark:text-zinc-300">
                      <Clock className="w-3 h-3" />
                      {formatEta(task.etaSeconds)}
                    </span>
                  )}
                  {isStreaming && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelTask(task.id);
                      }}
                      className="text-zinc-400 hover:text-rose-500 text-[10px]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer controls */}
      <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
        <span className="text-[11px]">Click any item to view its real-time stream</span>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Clear completed
          </button>
        )}
      </div>
    </div>
  );
};
