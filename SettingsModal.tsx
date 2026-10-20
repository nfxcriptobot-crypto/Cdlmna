import React from 'react';
import { Volume2, Sliders, Monitor, ShieldCheck, X } from 'lucide-react';
import { sound } from '../game/audio';

export interface GameSettings {
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  sensitivity: number;
  invertPitch: boolean;
}

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleQualityChange = (q: 'LOW' | 'MEDIUM' | 'HIGH') => {
    onUpdateSettings({ ...settings, graphicsQuality: q });
  };

  const handleMasterVol = (val: number) => {
    const updated = { ...settings, masterVolume: val };
    sound.setVolumes(val, settings.sfxVolume, settings.musicVolume);
    onUpdateSettings(updated);
  };

  const handleSfxVol = (val: number) => {
    const updated = { ...settings, sfxVolume: val };
    sound.setVolumes(settings.masterVolume, val, settings.musicVolume);
    onUpdateSettings(updated);
  };

  const handleMusicVol = (val: number) => {
    const updated = { ...settings, musicVolume: val };
    sound.setVolumes(settings.masterVolume, settings.sfxVolume, val);
    onUpdateSettings(updated);
  };

  return (
    <div
      data-no-aim
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto select-none"
    >
      <div className="w-full max-w-lg bg-slate-900 border-2 border-sky-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black tracking-wider uppercase text-slate-100">
              OPERATIONAL SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Graphics Quality */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-sky-400 uppercase">
              <Monitor className="w-4 h-4" />
              <span>GRAPHICS PRESET (PERFORMANCE / SHADOWS)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleQualityChange(lvl)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition ${
                    settings.graphicsQuality === lvl
                      ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                  <div className="text-[10px] font-mono opacity-80">
                    {lvl === 'LOW' ? '45 FPS / Fast' : lvl === 'MEDIUM' ? '60 FPS / Norm' : 'Max PBR / FX'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-amber-400 uppercase">
              <Volume2 className="w-4 h-4" />
              <span>AUDIO LEVELS</span>
            </div>
            <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
              {/* Master */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Master Volume</span>
                  <span className="font-mono">{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => handleMasterVol(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* SFX */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Sound Effects (Gunfire, Hits)</span>
                  <span className="font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => handleSfxVol(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Music */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Combat Ambience & Synth</span>
                  <span className="font-mono">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => handleMusicVol(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Controls & Camera Sensitivity */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-sky-400 uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>CAMERA & SENSITIVITY</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Look Sensitivity</span>
                  <span className="font-mono">{settings.sensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, sensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Desktop Controls Reference */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300">Desktop Controls:</div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div>WASD: Move</div>
                  <div>Mouse: Aim & Look</div>
                  <div>Left Click: Fire</div>
                  <div>Right Click: Aim ADS</div>
                  <div>Space: Jump</div>
                  <div>Shift: Sprint</div>
                  <div>R: Reload</div>
                  <div>Esc / P: Pause</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 font-bold text-slate-950 text-xs uppercase tracking-wider"
          >
            CONFIRM & RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
