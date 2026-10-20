import React from 'react';
import { EngineStats } from '../game/engine';
import { TacticalRadar } from './TacticalRadar';
import { VirtualJoystick } from './VirtualJoystick';
import {
  Crosshair,
  Shield,
  Heart,
  RotateCcw,
  Zap,
  Target,
  Pause,
  Award,
  Compass,
} from 'lucide-react';

interface TacticalHUDProps {
  stats: EngineStats;
  onMove: (forward: number, right: number) => void;
  onFireChange: (isFiring: boolean) => void;
  onAimToggle: () => void;
  onJump: () => void;
  onSprintToggle: () => void;
  onReload: () => void;
  onPause: () => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  stats,
  onMove,
  onFireChange,
  onAimToggle,
  onJump,
  onSprintToggle,
  onReload,
  onPause,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
  const armorPercent = Math.max(0, Math.min(100, (stats.armor / stats.maxArmor) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* 1. Red Damage Vignette on hit */}
      {stats.damageVignette > 0 && (
        <div
          style={{ opacity: stats.damageVignette }}
          className="absolute inset-0 pointer-events-none transition-opacity duration-75 shadow-[inset_0_0_100px_rgba(239,68,68,0.7)]"
        />
      )}

      {/* 2. Top Tactical Status Bar */}
      <div className="absolute top-2 inset-x-3 flex items-start justify-between pointer-events-none z-20">
        {/* Left: Player Vitals & Radar */}
        <div className="flex items-start gap-3">
          <TacticalRadar {...stats.radarData} />

          <div className="flex flex-col gap-1.5 bg-slate-950/70 border border-slate-700/60 rounded-xl p-2.5 shadow-lg backdrop-blur-none pointer-events-auto">
            {/* Health Bar */}
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <div className="w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  style={{ width: `${healthPercent}%` }}
                  className={`h-full transition-all duration-150 ${
                    healthPercent > 50
                      ? 'bg-emerald-500'
                      : healthPercent > 25
                      ? 'bg-amber-500'
                      : 'bg-red-500 animate-pulse'
                  }`}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-200 min-w-[28px]">
                {Math.round(stats.health)}
              </span>
            </div>

            {/* Armor Bar */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400 fill-sky-400/20" />
              <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  style={{ width: `${armorPercent}%` }}
                  className="h-full bg-sky-400 transition-all duration-150"
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-sky-300 min-w-[28px]">
                {Math.round(stats.armor)}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mission Objective Banner */}
        <div className="flex flex-col items-center">
          <div
            className={`px-4 py-1.5 rounded-full border shadow-lg flex items-center gap-2 backdrop-blur-none pointer-events-auto ${
              stats.canExtract
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/80 border-amber-500/60 text-amber-300'
            }`}
          >
            <Target className="w-4 h-4 text-current animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase">
              {stats.objectiveText}
            </span>
          </div>

          {stats.canExtract && (
            <span className="mt-1 text-[10px] font-mono font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              EXTRACTION ZONE MARKED ON RADAR
            </span>
          )}
        </div>

        {/* Right: Score, Kills, Pause Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-none pointer-events-auto">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Award className="w-4 h-4" />
              <span className="text-xs font-mono font-black">{stats.score}</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-xs font-mono font-bold text-slate-300">
              KILLS: <span className="text-sky-400">{stats.kills}</span>/{stats.targetKills}
            </div>
          </div>

          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 pointer-events-auto active:scale-95 shadow-lg"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Center Tactical Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        {/* Hit Marker indicator */}
        {stats.hitMarkerActive && (
          <div className="absolute w-8 h-8 pointer-events-none animate-ping">
            <div className="w-full h-full border-2 border-red-500 rotate-45" />
          </div>
        )}

        {/* Dynamic Crosshairs */}
        <div
          className={`relative transition-all duration-150 ${
            stats.isAiming ? 'w-4 h-4 opacity-90' : 'w-7 h-7 opacity-75'
          }`}
        >
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-sm" />
          {/* Crosshair tics */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-sky-400/80" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-sky-400/80" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-sky-400/80" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-sky-400/80" />
        </div>

        {/* Reloading text/spinner */}
        {stats.isReloading && (
          <div className="absolute top-8 flex items-center gap-2 bg-slate-950/80 border border-sky-500/40 px-3 py-1 rounded-full text-xs font-mono font-bold text-sky-400">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            <span>RELOADING...</span>
          </div>
        )}
      </div>

      {/* 4. Bottom-Left: Virtual Movement Joystick */}
      <div className="absolute bottom-4 left-6 pointer-events-auto">
        <VirtualJoystick onMove={onMove} size={135} />
      </div>

      {/* 5. Bottom-Right: Tactical Action Buttons (Landscape layout) */}
      <div className="absolute bottom-4 right-6 flex items-end gap-3 pointer-events-auto">
        {/* Column of auxiliary tactical controls: ADS, Sprint, Jump */}
        <div className="flex flex-col gap-2.5 items-center">
          {/* ADS Aim Toggle */}
          <button
            onClick={onAimToggle}
            aria-label="Aim Down Sights"
            className={`w-13 h-13 rounded-full flex items-center justify-center border-2 active:scale-95 shadow-lg transition-colors ${
              stats.isAiming
                ? 'bg-sky-500 border-sky-300 text-slate-950 ring-4 ring-sky-500/30'
                : 'bg-slate-900/80 border-sky-500/50 text-sky-400'
            }`}
          >
            <Crosshair className="w-6 h-6" />
          </button>

          {/* Sprint Toggle */}
          <button
            onClick={onSprintToggle}
            aria-label="Sprint"
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 active:scale-95 shadow-lg transition-colors ${
              stats.isSprinting
                ? 'bg-amber-500 border-amber-300 text-slate-950 ring-4 ring-amber-500/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Jump Button */}
          <button
            onClick={onJump}
            aria-label="Jump"
            className="w-12 h-12 rounded-full bg-slate-900/80 border-2 border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center active:scale-95 shadow-lg"
          >
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-current" />
          </button>
        </div>

        {/* Primary Fire & Reload Cluster */}
        <div className="flex flex-col gap-2 items-center">
          {/* Reload Button with Ammo Gauge */}
          <button
            onClick={onReload}
            aria-label="Reload Weapon"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 border border-sky-500/40 active:scale-95 shadow-md"
          >
            <RotateCcw className={`w-4 h-4 text-sky-400 ${stats.isReloading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-mono font-black text-slate-100">
              <span className={stats.ammo < 6 ? 'text-red-400' : 'text-sky-400'}>{stats.ammo}</span>
              <span className="text-slate-500">/{stats.reserveAmmo}</span>
            </span>
          </button>

          {/* Primary FIRE Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              onFireChange(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onFireChange(false);
            }}
            onPointerCancel={() => onFireChange(false)}
            aria-label="Fire Weapon"
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-600 border-3 border-amber-400 active:scale-90 active:from-red-700 active:to-amber-700 flex flex-col items-center justify-center text-white shadow-xl shadow-red-950/70 select-none touch-none ring-4 ring-red-500/20"
          >
            <Crosshair className="w-7 h-7 stroke-[2.5]" />
            <span className="text-[10px] font-black tracking-widest uppercase">FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
