import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  ExternalLink,
  Info,
  Maximize,
  RotateCcw,
} from 'lucide-react';
import { MediaItem } from '../types/media.js';

interface VideoModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onDownload: (item: MediaItem, qualityId: string) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  item,
  onClose,
  onDownload,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (item) {
      setSelectedQuality(item.selectedQualityId || item.qualities[0]?.id || '1080p');
      setIsPlaying(true);
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const activeQuality =
    item.qualities.find((q) => q.id === selectedQuality) || item.qualities[0];

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video player modal"
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/70 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Canvas */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] md:min-h-[500px]">
          <video
            ref={videoRef}
            src={activeQuality?.url}
            poster={item.thumbnail}
            autoPlay
            playsInline
            loop
            muted={isMuted}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full max-h-[75vh] object-contain cursor-pointer"
          />

          {/* Player Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="font-mono text-zinc-300">{item.duration || '0:30'}</span>
            </div>

            {/* Playback speed selector */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
              {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    playbackSpeed === spd ? 'bg-white text-black' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Info & Format Selector Sidebar */}
        <div className="w-full md:w-80 p-5 bg-zinc-900 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 text-white overflow-y-auto">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    item.platform === 'pinterest' ? 'bg-red-600' : 'bg-pink-600'
                  }`}
                >
                  {item.platform}
                </span>
                <span className="text-xs text-zinc-400">{item.author.name}</span>
              </div>
              <h2 id="video-modal-title" className="text-base font-bold text-zinc-100 line-clamp-2">
                {item.title}
              </h2>
              {item.caption && (
                <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{item.caption}</p>
              )}
            </div>

            {/* Technical Metadata */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>Media Stream Properties</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-500">Resolution</span>
                <span className="font-mono">{activeQuality?.resolution || '1080p'}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-500">Container Format</span>
                <span className="font-mono uppercase">{activeQuality?.format || 'mp4'}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-500">Estimated Size</span>
                <span className="font-mono">{activeQuality?.sizeEstimate || 'Variable'}</span>
              </div>
            </div>

            {/* Quality Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Download Quality Format</label>
              <div className="space-y-1.5">
                {item.qualities.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuality(q.id)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      selectedQuality === q.id
                        ? 'border-rose-500 bg-rose-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span>{q.label}</span>
                    <span className="font-mono text-zinc-400 text-[11px]">{q.sizeEstimate}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={() => onDownload(item, selectedQuality)}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download {activeQuality?.label.split(' ')[0]} Now</span>
            </button>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 text-center text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Source on {item.platform === 'pinterest' ? 'Pinterest' : 'Instagram'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
