import React from 'react';
import { Play, RotateCcw, Sliders, Home, Shield, X } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onReturnToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onReturnToMenu,
}) => {
  return (
    <div
      data-no-aim
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto select-none"
    >
      <div className="w-full max-w-sm bg-slate-900 border-2 border-sky-500/50 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-black tracking-wider uppercase text-slate-100">
              TACTICAL PAUSE
            </h2>
          </div>
          <button
            onClick={onResume}
            aria-label="Resume"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-5 space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART MISSION</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>SETTINGS & AUDIO</span>
          </button>

          <button
            onClick={onReturnToMenu}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Home className="w-4 h-4" />
            <span>ABORT TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
