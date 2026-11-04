import { useEffect } from 'react';

interface GlobalShortcutsOptions {
  onToggleVault: () => void;
  onTriggerAction: () => void;
  onCloseModals: () => void;
  onToggleBatch?: () => void;
  onToggleRealtimeMonitor?: () => void;
  onOpenShortcutsModal?: () => void;
}

export function useGlobalShortcuts({
  onToggleVault,
  onTriggerAction,
  onCloseModals,
  onToggleBatch,
  onToggleRealtimeMonitor,
  onOpenShortcutsModal,
}: GlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Escape: Always close any open modals
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseModals();
        return;
      }

      // Ctrl/Cmd + K: Toggle History Vault
      if (isModifier && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onToggleVault();
        return;
      }

      // Ctrl/Cmd + Enter: Trigger Download / Extract action
      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        onTriggerAction();
        return;
      }

      // Ctrl/Cmd + B: Toggle Batch Downloader mode
      if (isModifier && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onToggleBatch?.();
        return;
      }

      // Ctrl/Cmd + J: Toggle Real-time Monitor
      if (isModifier && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        onToggleRealtimeMonitor?.();
        return;
      }

      // '?' or Ctrl/Cmd + '/': Open keyboard shortcuts cheat sheet
      if (
        (isModifier && e.key === '/') ||
        (!isInput && e.key === '?' && !e.shiftKey) ||
        (!isInput && e.key === '?' && e.shiftKey)
      ) {
        e.preventDefault();
        onOpenShortcutsModal?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleVault,
    onTriggerAction,
    onCloseModals,
    onToggleBatch,
    onToggleRealtimeMonitor,
    onOpenShortcutsModal,
  ]);
}
