import React from 'react';
import {
  Download,
  Shield,
  Smartphone,
  Sun,
  Moon,
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Keyboard,
  Radio,
} from 'lucide-react';
import { VaultSettings } from '../types/media.js';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  onOpenSync: () => void;
  onOpenSecurity: () => void;
  onOpenShortcuts?: () => void;
  onToggleRealtimeMonitor?: () => void;
  activeStreamingCount?: number;
  historyCount: number;
  settings: VaultSettings;
  activeTab: 'single' | 'batch' | 'history';
  setActiveTab: (tab: 'single' | 'batch' | 'history') => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenHistory,
  onOpenSync,
  onOpenSecurity,
  onOpenShortcuts,
  onToggleRealtimeMonitor,
  activeStreamingCount = 0,
  historyCount,
  settings,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-200 border-zinc-200/80 bg-white/85 dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Download className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
                OmniSave
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 tracking-wide uppercase">
                HD Pro
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Pinterest</span>
              <span aria-hidden="true">·</span>
              <span>Instagram Reels</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Lightning Fast</span>
            </div>
          </div>
        </div>

        {/* Center Mode Navigation Tabs */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'single'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Single URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'batch'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Downloader</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              onOpenHistory();
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Vault History ({historyCount})</span>
            <kbd className="hidden lg:inline px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              Ctrl+K
            </kbd>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Real-time Streaming Monitor Trigger */}
          {activeStreamingCount > 0 && (
            <button
              type="button"
              onClick={onToggleRealtimeMonitor}
              title="Toggle Live Real-Time Stream Monitor"
              aria-label="Toggle Real-Time Stream Monitor"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{activeStreamingCount} Live</span>
            </button>
          )}

          {/* Keyboard Shortcuts Cheat Sheet Button */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (Press ? or Ctrl+/)"
            aria-label="View keyboard shortcuts"
            className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Security Vault Lock */}
          <button
            type="button"
            onClick={onOpenSecurity}
            title={settings.pinCode ? 'Vault PIN is Configured' : 'Configure PIN Vault Protection'}
            aria-label="Security settings"
            className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors relative"
          >
            {settings.isLocked ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : settings.pinCode ? (
              <Unlock className="w-4 h-4 text-emerald-500" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
          </button>

          {/* Cross-Platform Sync */}
          <button
            type="button"
            onClick={onOpenSync}
            title="Cross-Device Sync & QR Mobile Transfer"
            aria-label="Open cross-device sync modal"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Sync Device</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
