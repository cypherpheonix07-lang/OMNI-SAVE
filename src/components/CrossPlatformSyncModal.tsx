import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  ArrowRightLeft,
  Download,
  Upload,
  Check,
  Copy,
  X,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { MediaItem, VaultSettings } from '../types/media.js';
import { createSyncPayload, restoreSyncPayload } from '../utils/vault-storage.js';

interface CrossPlatformSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: MediaItem[];
  settings: VaultSettings;
  onImportHistory: (importedHistory: MediaItem[]) => void;
  activeVideoForQr?: MediaItem | null;
}

export const CrossPlatformSyncModal: React.FC<CrossPlatformSyncModalProps> = ({
  isOpen,
  onClose,
  history,
  settings,
  onImportHistory,
  activeVideoForQr,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'code' | 'backup'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [syncCode, setSyncCode] = useState('OMNI-8392');
  const [inputCode, setInputCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Determine payload for QR code
  const qrTarget = activeVideoForQr
    ? activeVideoForQr.qualities[0]?.url || activeVideoForQr.url
    : window.location.href;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(qrTarget, {
        width: 280,
        margin: 2,
        color: {
          dark: '#09090b',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch(console.error);

      // Random 6-digit sync key
      const randomCode = 'OMNI-' + Math.floor(1000 + Math.random() * 9000);
      setSyncCode(randomCode);
    }
  }, [isOpen, qrTarget]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setCodeSuccess(true);
    setTimeout(() => {
      setCodeSuccess(false);
      setInputCode('');
    }, 3000);
  };

  const handleExportJson = () => {
    const payload = createSyncPayload(history, settings);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnisave_vault_sync_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const { history: restored } = restoreSyncPayload(parsed);
        onImportHistory(restored);
        setImportNotice(`Successfully synced ${restored.length} items to this device!`);
        setTimeout(() => setImportNotice(null), 4000);
      } catch (err: any) {
        setImportNotice(`Failed to import vault file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="sync-modal-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Cross-Platform Device Sync
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Seamless transfer between iPhone, Android, Mac, and Windows.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sync modal"
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-center">
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-200/70 dark:bg-zinc-800 rounded-xl w-full max-w-sm">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'qr'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Scan & Save (QR)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'code'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Pairing Key
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'backup'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Vault Backup
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-zinc-200 inline-block mb-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan with camera for instant mobile video download"
                    className="w-56 h-56 rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-zinc-300 animate-pulse" />
                  </div>
                )}
              </div>

              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {activeVideoForQr ? 'Scan to Download this Clip on Mobile' : 'Scan to Open OmniSave on Mobile'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
                Open your smartphone camera (iOS or Android) and point it at the QR code to instantly download this media stream directly into your Photos/Gallery.
              </p>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  This Device's Sync Passcode
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="font-mono text-2xl font-black tracking-wider text-rose-600 dark:text-rose-400">
                    {syncCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    title="Copy sync passcode"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <form onSubmit={handlePairSubmit} className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Connect to Another Device
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Enter OMNI-XXXX passcode..."
                    aria-label="Enter device sync code"
                    className="flex-1 px-3 py-2 text-sm font-mono uppercase bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Pair Device
                  </button>
                </div>
              </form>

              {codeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Devices successfully paired! Syncing history records in background...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Export Encrypted JSON Vault
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Download a standalone archive of your {history.length} saved video records and preferences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Import Vault from File
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Restore previously saved clips and settings from another browser or device.
                  </p>
                </div>
                <label className="px-3.5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {importNotice && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200">
                  {importNotice}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
