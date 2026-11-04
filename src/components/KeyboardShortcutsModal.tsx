import React from 'react';
import { X, Command, Keyboard, Zap, Shield, Layers, Radio } from 'lucide-react';
import { getModifierKey } from '../utils/realtime-engine.js';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const modKey = getModifierKey();

  const shortcuts = [
    {
      category: 'Primary Actions',
      items: [
        {
          keys: [modKey, 'Enter'],
          description: 'Trigger Extract / Real-Time Download from inputs or queue',
          icon: <Zap className="w-3.5 h-3.5 text-rose-500" />,
        },
        {
          keys: [modKey, 'K'],
          description: 'Open or toggle the Secure History Vault modal',
          icon: <Shield className="w-3.5 h-3.5 text-emerald-500" />,
        },
        {
          keys: [modKey, 'B'],
          description: 'Switch between Single URL and Batch Downloader mode',
          icon: <Layers className="w-3.5 h-3.5 text-amber-500" />,
        },
      ],
    },
    {
      category: 'Real-Time Streaming & Controls',
      items: [
        {
          keys: [modKey, 'J'],
          description: 'Toggle Live Real-Time Download & Streaming Monitor',
          icon: <Radio className="w-3.5 h-3.5 text-blue-500" />,
        },
        {
          keys: ['Esc'],
          description: 'Close active modal, video player, or floating viewer',
          icon: <X className="w-3.5 h-3.5 text-zinc-400" />,
        },
        {
          keys: ['?'],
          description: 'Show this keyboard shortcuts cheat sheet',
          icon: <Keyboard className="w-3.5 h-3.5 text-purple-500" />,
        },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
              <Keyboard className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Global Keyboard Shortcuts
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Boost your media extraction speed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts listing */}
        <div className="p-6 space-y-6">
          {shortcuts.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.category}
              </h3>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                      {item.icon}
                      <span className="font-medium">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="px-2 py-1 text-[11px] font-mono font-bold rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shadow-xs">
                            {k}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span className="text-zinc-400 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-zinc-400" />
            <span>Shortcuts are active across all app pages</span>
          </div>
          <span className="font-mono text-[11px]">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};
