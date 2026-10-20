import React from 'react';
import { Trophy, Skull, RotateCcw, Home, Award, Target, Crosshair } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  score: number;
  kills: number;
  targetKills: number;
  missionTitle: string;
  onRestart: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  score,
  kills,
  targetKills,
  missionTitle,
  onRestart,
  onReturnToMenu,
}) => {
  return (
    <div
      data-no-aim
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 pointer-events-auto select-none"
    >
      <div
        className={`w-full max-w-md bg-slate-900 border-2 rounded-2xl shadow-2xl p-6 text-slate-100 relative ${
          isVictory ? 'border-emerald-500/60 shadow-emerald-950/50' : 'border-red-500/60 shadow-red-950/50'
        }`}
      >
        {/* Banner */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border-2 ${
              isVictory
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                : 'bg-red-500/20 border-red-400 text-red-400'
            }`}
          >
            {isVictory ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-black tracking-widest uppercase ${
              isVictory ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isVictory ? 'MISSION ACCOMPLISHED' : 'KIA — MISSION FAILED'}
          </h2>

          <div className="text-xs font-mono font-bold text-slate-400 uppercase mt-1">
            {missionTitle}
          </div>
        </div>

        {/* Mission Stats */}
        <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Final Tactical Score:</span>
            </span>
            <span className="font-mono font-black text-amber-400 text-sm">{score}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-sky-400" />
              <span>Hostiles Neutralized:</span>
            </span>
            <span className="font-mono font-bold text-slate-200">
              {kills} / {targetKills}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Extraction Status:</span>
            </span>
            <span
              className={`font-mono font-bold ${
                isVictory ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isVictory ? 'EXTRACTION SUCCESS' : 'ABORTED'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToMenu}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>

          <button
            onClick={onRestart}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 text-slate-950 active:scale-95 transition shadow-lg ${
              isVictory
                ? 'bg-emerald-500 hover:bg-emerald-400'
                : 'bg-red-500 hover:bg-red-400'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
