import React, { useState } from 'react';
import { Shield, Lock, Unlock, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { VaultSettings } from '../types/media.js';

interface VaultSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VaultSettings;
  onSavePin: (pin: string | undefined) => void;
  onToggleLock: (locked: boolean) => void;
}

export const VaultSecurityModal: React.FC<VaultSecurityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSavePin,
  onToggleLock,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    onSavePin(pin);
    setError(null);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  const handleRemovePin = () => {
    onSavePin(undefined);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 text-zinc-900 dark:text-zinc-100">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close security modal"
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 id="security-modal-title" className="text-base font-bold">
              Vault Security & PIN Lock
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Keep your saved media and download history private.
            </p>
          </div>
        </div>

        {savedSuccess ? (
          <div className="py-6 flex flex-col items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
            <h3 className="text-sm font-bold">PIN Passcode Configured</h3>
            <p className="text-xs text-zinc-500 mt-1">Your history vault is now protected.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.pinCode ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold block">PIN Protection Active</span>
                    <span className="text-[11px] text-zinc-500">
                      Vault is currently {settings.isLocked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleLock(!settings.isLocked)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
                  >
                    {settings.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{settings.isLocked ? 'Unlock Now' : 'Lock Vault Now'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePin}
                  className="w-full py-2.5 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Disable PIN Protection
                </button>
              </div>
            ) : (
              <form onSubmit={handleSetPin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Set 4-Digit Passcode
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    aria-label="New 4-digit PIN"
                    className="w-full p-2.5 rounded-xl text-center text-lg tracking-widest bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Confirm Passcode
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Repeat PIN..."
                    aria-label="Confirm 4-digit PIN"
                    className="w-full p-2.5 rounded-xl text-center text-lg tracking-widest bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

                <button
                  type="submit"
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Enable PIN Protection
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
