import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine, EngineStats, MissionConfig } from './game/engine';
import { PlayerInput } from './game/player';
import { MainMenu, MISSIONS } from './components/MainMenu';
import { TacticalHUD } from './components/TacticalHUD';
import { TouchAimPad } from './components/TouchAimPad';
import { SettingsModal, GameSettings } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { AndroidExportModal } from './components/AndroidExportModal';
import { Smartphone, Menu } from 'lucide-react';

const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'HIGH',
  masterVolume: 0.8,
  sfxVolume: 0.9,
  musicVolume: 0.4,
  sensitivity: 1.0,
  invertPitch: false,
};

export default function App() {
  const [screenState, setScreenState] = useState<'PLAYING' | 'MENU'>('PLAYING');
  const [currentMission, setCurrentMission] = useState<MissionConfig>(MISSIONS[0]);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAndroidExport, setShowAndroidExport] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('shadow_strike_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Engine & Canvas Refs
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // HUD Stats state
  const [engineStats, setEngineStats] = useState<EngineStats | null>(null);

  // Input states accumulated for frame update
  const inputRef = useRef<PlayerInput>({
    moveForward: 0,
    moveRight: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    isFiring: false,
    isAiming: false,
    isSprinting: false,
    isJumping: false,
    reloadTriggered: false,
  });

  // Track keyboard keys for desktop testing
  const keysDownRef = useRef<{ [key: string]: boolean }>({});

  // Orientation warning on mobile
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsPortrait(isMobile && window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Load best score from local storage
  useEffect(() => {
    try {
      const savedScore = localStorage.getItem('shadow_strike_best_score');
      if (savedScore) setBestScore(parseInt(savedScore, 10));
    } catch {}
  }, []);

  // Save settings when modified
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('shadow_strike_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // Keyboard and Mouse Event Listeners for Desktop Testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = true;

      if (screenState === 'PLAYING') {
        if (e.code === 'KeyR') {
          inputRef.current.reloadTriggered = true;
        }
        if (e.code === 'Space') {
          inputRef.current.isJumping = true;
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          inputRef.current.isSprinting = true;
        }
        if (e.code === 'KeyP' || e.code === 'Escape') {
          setIsPaused((prev) => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = false;

      if (screenState === 'PLAYING') {
        if (e.code === 'Space') {
          inputRef.current.isJumping = false;
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          inputRef.current.isSprinting = false;
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (screenState === 'PLAYING' && !isPaused) {
        if (e.button === 0) {
          // Left click: Fire
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('[data-no-aim]')) {
            inputRef.current.isFiring = true;
          }
        } else if (e.button === 2) {
          // Right click: ADS
          e.preventDefault();
          inputRef.current.isAiming = !inputRef.current.isAiming;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        inputRef.current.isFiring = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (screenState === 'PLAYING') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [screenState, isPaused]);

  // Mount 3D Game Engine immediately
  useEffect(() => {
    if (!canvasMountRef.current) return;

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    const engine = new GameEngine(
      canvasMountRef.current,
      currentMission,
      settings.graphicsQuality,
      (stats) => {
        setEngineStats(stats);
        if (stats.score > bestScore) {
          setBestScore(stats.score);
          try {
            localStorage.setItem('shadow_strike_best_score', stats.score.toString());
          } catch {}
        }
      }
    );

    // Provide single input supplier for frame synchronization
    engine.inputSupplier = () => {
      let forward = inputRef.current.moveForward;
      let right = inputRef.current.moveRight;

      if (keysDownRef.current['KeyW'] || keysDownRef.current['ArrowUp']) forward += 1;
      if (keysDownRef.current['KeyS'] || keysDownRef.current['ArrowDown']) forward -= 1;
      if (keysDownRef.current['KeyD'] || keysDownRef.current['ArrowRight']) right += 1;
      if (keysDownRef.current['KeyA'] || keysDownRef.current['ArrowLeft']) right -= 1;

      forward = Math.max(-1, Math.min(1, forward));
      right = Math.max(-1, Math.min(1, right));

      engine.player.cameraSensitivity = settings.sensitivity;

      const currentInput: PlayerInput = {
        ...inputRef.current,
        moveForward: forward,
        moveRight: right,
      };

      // Reset single-frame values
      inputRef.current.lookDeltaX = 0;
      inputRef.current.lookDeltaY = 0;
      inputRef.current.reloadTriggered = false;

      return currentInput;
    };

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [currentMission, settings.graphicsQuality]);

  // Sync pause state with engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(isPaused || screenState === 'MENU');
    }
  }, [isPaused, screenState]);

  // Start / Select Mission
  const handleStartMission = useCallback((mission: MissionConfig) => {
    setCurrentMission(mission);
    setScreenState('PLAYING');
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.restart(mission);
    }
  }, []);

  // Restart Mission
  const handleRestartMission = () => {
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.restart(currentMission);
    }
  };

  // Return to Menu
  const handleReturnToMenu = () => {
    setIsPaused(false);
    setScreenState('MENU');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 3D Canvas Mount Point - Active immediately */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      />

      {/* In-Game Touch Aim Pad & Tactical HUD (visible in PLAYING mode) */}
      {screenState === 'PLAYING' && engineStats && (
        <TouchAimPad
          onLookDelta={(dx, dy) => {
            if (!isPaused) {
              inputRef.current.lookDeltaX += dx;
              inputRef.current.lookDeltaY += settings.invertPitch ? -dy : dy;
            }
          }}
        >
          <TacticalHUD
            stats={engineStats}
            onMove={(fwd, rt) => {
              inputRef.current.moveForward = fwd;
              inputRef.current.moveRight = rt;
            }}
            onFireChange={(firing) => {
              inputRef.current.isFiring = firing;
            }}
            onAimToggle={() => {
              inputRef.current.isAiming = !inputRef.current.isAiming;
            }}
            onJump={() => {
              inputRef.current.isJumping = true;
              setTimeout(() => {
                inputRef.current.isJumping = false;
              }, 100);
            }}
            onSprintToggle={() => {
              inputRef.current.isSprinting = !inputRef.current.isSprinting;
            }}
            onReload={() => {
              inputRef.current.reloadTriggered = true;
            }}
            onPause={() => setIsPaused(true)}
          />

          {/* Quick Menu Button in top center */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto z-30">
            <button
              onClick={() => setScreenState('MENU')}
              aria-label="Open Missions Menu"
              className="px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-sky-400 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>MISSIONS & ANDROID EXPORT</span>
            </button>
          </div>
        </TouchAimPad>
      )}

      {/* Main Menu Screen (Overlay on top of live 3D world) */}
      {screenState === 'MENU' && (
        <MainMenu
          onStartMission={handleStartMission}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAndroidExport={() => setShowAndroidExport(true)}
          bestScore={bestScore}
        />
      )}

      {/* In-Game Tactical Pause Modal */}
      {screenState === 'PLAYING' && isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onRestart={handleRestartMission}
          onOpenSettings={() => setShowSettings(true)}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Game Over / Mission Complete Modal */}
      {screenState === 'PLAYING' && engineStats && engineStats.missionStatus !== 'ACTIVE' && (
        <GameOverModal
          isVictory={engineStats.missionStatus === 'VICTORY'}
          score={engineStats.score}
          kills={engineStats.kills}
          targetKills={engineStats.targetKills}
          missionTitle={currentMission.title}
          onRestart={handleRestartMission}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Native Android Project & APK Hub */}
      {showAndroidExport && (
        <AndroidExportModal onClose={() => setShowAndroidExport(false)} />
      )}

      {/* Portrait Notice for Mobile Devices */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-slate-100 pointer-events-auto">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 mb-4 animate-bounce">
            <Smartphone className="w-8 h-8 rotate-90" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-sky-300">
            ROTATE TO LANDSCAPE
          </h2>
          <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
            Shadow Strike is designed for landscape military spec-ops gameplay. Rotate your device for tactical dual-joystick controls.
          </p>
          <button
            onClick={() => setIsPortrait(false)}
            className="mt-6 px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 uppercase border border-slate-700"
          >
            CONTINUE ANYWAY
          </button>
        </div>
      )}
    </div>
  );
}
