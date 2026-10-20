import React, { useState } from 'react';
import { MissionConfig } from '../game/engine';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Play,
  Sliders,
  Smartphone,
  Shield,
  Trophy,
  Flame,
  Crosshair,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../game/audio';

export const MISSIONS: MissionConfig[] = [
  {
    id: 1,
    title: 'OUTPOST INFILTRATION',
    codename: 'OPERATION BLACK ICE',
    objectiveText: 'Eliminate 5 Hostile Mercenaries and reach Helipad Extraction',
    targetKills: 5,
    difficulty: 'STANDARD',
  },
  {
    id: 2,
    title: 'PERIMETER DEFENSE',
    codename: 'IRON CLAD',
    objectiveText: 'Neutralize 8 Hostile Commandos including Heavy Cyber-Soldiers',
    targetKills: 8,
    difficulty: 'HARD',
  },
  {
    id: 3,
    title: 'CONTAINMENT PROTOCOL',
    codename: 'SHADOW FALL',
    objectiveText: 'Purge all 10 Elite Guards and extract tactical data',
    targetKills: 10,
    difficulty: 'NIGHTMARE',
  },
];

interface MainMenuProps {
  onStartMission: (mission: MissionConfig) => void;
  onOpenSettings: () => void;
  onOpenAndroidExport: () => void;
  bestScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartMission,
  onOpenSettings,
  onOpenAndroidExport,
  bestScore,
}) => {
  const [selectedMission, setSelectedMission] = useState<MissionConfig>(MISSIONS[0]);
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 bg-slate-950/70 text-slate-100 select-none overflow-y-auto">
      {/* Background Animated Tactical Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Bar: Brand, High Score, Install & Sound */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-sky-400 uppercase">
              TACTICAL COMBAT PROTOCOL
            </div>
            <div className="text-xs font-bold text-slate-400">MIL-SPEC 3D ENGINE</div>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-3">
          {/* Best Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>BEST SCORE: {bestScore}</span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleMute}
            aria-label="Toggle Mute"
            className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700 hover:bg-slate-800 flex items-center justify-center text-slate-300"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Center: Title & Mission Selector */}
      <div className="relative z-10 flex flex-col items-center my-auto py-4">
        {/* Animated Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-500/40 text-sky-300 text-[11px] font-mono tracking-widest uppercase mb-2">
            <Crosshair className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>NATIVE 3D THIRD-PERSON SHOOTER</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-slate-100 to-amber-300 drop-shadow-lg">
            SHADOW STRIKE
          </h1>
          <div className="text-lg sm:text-xl font-black tracking-[0.3em] uppercase text-amber-400 mt-1">
            SURVIVAL
          </div>
        </div>

        {/* Mission Selection Grid */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {MISSIONS.map((m) => {
            const isSelected = selectedMission.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMission(m)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-500/30 shadow-lg shadow-sky-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                    MISSION 0{m.id}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      m.difficulty === 'STANDARD'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : m.difficulty === 'HARD'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {m.difficulty}
                  </span>
                </div>
                <div className="font-black text-sm text-slate-100 truncate">{m.title}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                  {m.objectiveText}
                </div>
              </button>
            );
          })}
        </div>

        {/* Primary Deploy Button */}
        <button
          onClick={() => onStartMission(selectedMission)}
          className="group relative py-3.5 px-10 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider flex items-center gap-3 shadow-xl shadow-sky-500/30 active:scale-95 transition"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>DEPLOY INTO COMBAT</span>
          <span className="text-xs font-mono font-bold text-slate-950/80 bg-white/20 px-2 py-0.5 rounded ml-1">
            0{selectedMission.id}
          </span>
        </button>
      </div>

      {/* Bottom Bar: Settings & Android Native Hub */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider active:scale-95 transition"
          >
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>GRAPHICS & CONTROLS</span>
          </button>
        </div>

        {/* Android Native APK Exporter */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAndroidExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600/90 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/50 active:scale-95 transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>ANDROID APK & KOTLIN SOURCE (.ZIP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
