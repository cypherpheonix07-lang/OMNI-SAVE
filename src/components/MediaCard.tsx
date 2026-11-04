import React, { useState, useRef } from 'react';
import {
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Smartphone,
  Bookmark,
  Share2,
  Trash2,
  Check,
  Music,
  Video as VideoIcon,
  Maximize2,
  Radio,
} from 'lucide-react';
import { MediaItem } from '../types/media.js';
import { generateSafeFilename } from '../utils/media-parser.js';

interface MediaCardProps {
  item: MediaItem;
  onDownload: (item: MediaItem, qualityId: string) => void;
  onDownloadRealtime?: (item: MediaItem, qualityId: string) => void;
  onPreview: (item: MediaItem) => void;
  onSendToPhone: (item: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onDownload,
  onDownloadRealtime,
  onPreview,
  onSendToPhone,
  onToggleFavorite,
  onRemove,
}) => {
  const [selectedQuality, setSelectedQuality] = useState<string>(
    item.selectedQualityId || item.qualities[0]?.id || '1080p'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeQuality =
    item.qualities.find((q) => q.id === selectedQuality) || item.qualities[0];

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeQuality.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const isPinterest = item.platform === 'pinterest';

  return (
    <article className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Video / Thumbnail Canvas Container */}
      <div className="relative aspect-[9/14] sm:aspect-[9/13] w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        {/* Actual video element for instant live preview */}
        <video
          ref={videoRef}
          src={activeQuality?.url}
          poster={item.thumbnail}
          playsInline
          loop
          muted={isMuted}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Ambient Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider text-white shadow-xs ${
                isPinterest ? 'bg-red-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'
              }`}
            >
              {isPinterest ? 'Pinterest' : 'Instagram'}
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-black/60 backdrop-blur-md text-white border border-white/10">
              {activeQuality?.resolution || '1080p'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleFavorite(item.id)}
              aria-label={item.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-amber-400 hover:bg-black/80 transition-colors"
            >
              <Bookmark
                className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="Remove item"
              className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-rose-400 hover:bg-black/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Play/Pause Trigger */}
        <button
          type="button"
          onClick={handleVideoToggle}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          className="absolute z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 hover:scale-108 transition-all shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white text-white" />
          ) : (
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          )}
        </button>

        {/* Bottom Video Controls Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white z-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute preview' : 'Mute preview'}
              className="p-1.5 rounded-md bg-black/60 backdrop-blur-md hover:bg-black/80 text-white/90"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-xs">
              {item.duration || '0:30'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onPreview(item)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white/90 hover:bg-black/80 transition-colors text-xs font-medium"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Theater</span>
          </button>
        </div>
      </div>

      {/* Media Details & Controls Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Creator Info & Title */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {item.author.avatar ? (
              <img
                src={item.author.avatar}
                alt={item.author.name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
              />
            ) : null}
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              {item.author.name}
            </span>
            {item.author.username && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                @{item.author.username}
              </span>
            )}
          </div>

          <h3
            className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug"
            title={item.title}
          >
            {item.title}
          </h3>

          {item.caption && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {item.caption}
            </p>
          )}
        </div>

        {/* Quality / Resolution Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
            <span>Select Resolution</span>
            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px]">
              Est. {activeQuality?.sizeEstimate || 'Variable'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
            {item.qualities.map((q) => {
              const isSelected = selectedQuality === q.id;
              const isAudio = q.format === 'mp3';
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQuality(q.id)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {isAudio ? <Music className="w-3 h-3 text-amber-500" /> : <VideoIcon className="w-3 h-3 text-rose-500" />}
                  <span>{q.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Main Download Options */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onDownloadRealtime
                  ? onDownloadRealtime(item, selectedQuality)
                  : onDownload(item, selectedQuality)
              }
              className="py-2.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Stream and watch video in real-time while downloading"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
              <span>Real-Time</span>
            </button>
            <button
              type="button"
              onClick={() => onDownload(item, selectedQuality)}
              className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Direct file download"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save {activeQuality?.label.split(' ')[0]}</span>
            </button>
          </div>

          {/* Quick Utility Row */}
          <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => onSendToPhone(item)}
              className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Generate QR code for mobile download"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Send to Phone</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Stream</span>
                </>
              )}
            </button>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Open original post on platform"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Source</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};
