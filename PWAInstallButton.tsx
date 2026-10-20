import React, { useState } from 'react';
import { Smartphone, Download, Check, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-400">
        <Check className="w-3.5 h-3.5" />
        <span>INSTALLED</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-950/50 active:scale-95 transition"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>INSTALL ON ANDROID</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>INSTALL APP</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-sky-400">Install on iOS / Safari</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-xl bg-sky-500 font-bold text-xs text-slate-950 uppercase"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback indicator on browser
  return (
    <button
      onClick={() => {
        alert(
          'To install on Android: In Chrome, tap the 3-dots menu (⋮) > "Install app" or "Add to Home screen".'
        );
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 font-bold text-xs uppercase tracking-wider border border-sky-500/30 active:scale-95 transition"
    >
      <Smartphone className="w-3.5 h-3.5" />
      <span>INSTALL TO HOME SCREEN</span>
    </button>
  );
};
