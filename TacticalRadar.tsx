import React from 'react';

interface RadarProps {
  playerYaw: number;
  playerX: number;
  playerZ: number;
  enemies: Array<{ x: number; z: number; isAlive: boolean; isAlert: boolean }>;
  drops: Array<{ x: number; z: number; type: 'ammo' | 'health' }>;
  extraction: { x: number; z: number; inRange: boolean };
}

export const TacticalRadar: React.FC<RadarProps> = ({
  playerYaw,
  playerX,
  playerZ,
  enemies,
  drops,
  extraction,
}) => {
  const radarRadius = 54; // px
  const radarRange = 40; // world meters

  // Helper to transform world coordinates into radar coordinates relative to player facing direction
  const transformToRadar = (worldX: number, worldZ: number) => {
    const dx = worldX - playerX;
    const dz = worldZ - playerZ;

    // Rotate by -playerYaw so radar stays "forward is up"
    const cosY = Math.cos(playerYaw);
    const sinY = Math.sin(playerYaw);

    const relX = dx * cosY - dz * sinY;
    const relY = dx * sinY + dz * cosY;

    // Scale to radar circle
    const normX = (relX / radarRange) * radarRadius;
    const normY = (-relY / radarRange) * radarRadius; // flip Y for screen

    const dist = Math.sqrt(normX * normX + normY * normY);
    const clampedDist = Math.min(radarRadius - 4, dist);
    const angle = Math.atan2(normY, normX);

    return {
      x: radarRadius + Math.cos(angle) * clampedDist,
      y: radarRadius + Math.sin(angle) * clampedDist,
      isClamped: dist > radarRadius - 4,
    };
  };

  const extPoint = transformToRadar(extraction.x, extraction.z);
  const extDist = Math.round(
    Math.sqrt((extraction.x - playerX) ** 2 + (extraction.z - playerZ) ** 2)
  );

  return (
    <div
      data-no-aim
      className="relative w-28 h-28 rounded-full bg-slate-950/85 border-2 border-sky-500/60 shadow-lg shadow-black/60 overflow-hidden pointer-events-auto"
    >
      {/* Radar concentric range rings */}
      <div className="absolute inset-2 rounded-full border border-sky-500/20 pointer-events-none" />
      <div className="absolute inset-6 rounded-full border border-sky-500/20 pointer-events-none" />
      <div className="absolute inset-10 rounded-full border border-sky-500/20 pointer-events-none" />

      {/* Crosshair lines */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-sky-500/30 pointer-events-none" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-sky-500/30 pointer-events-none" />

      {/* Rotating radar sweep */}
      <div
        className="absolute inset-0 pointer-events-none origin-center animate-[spin_4s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.25) 0deg, transparent 60deg, transparent 360deg)',
        }}
      />

      {/* Player Icon (Center chevron facing North) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none">
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-sky-400 drop-shadow" />
      </div>

      {/* Enemies */}
      {enemies
        .filter((e) => e.isAlive)
        .map((enemy, idx) => {
          const pt = transformToRadar(enemy.x, enemy.z);
          return (
            <div
              key={idx}
              style={{ left: pt.x - 3, top: pt.y - 3 }}
              className={`absolute w-2 h-2 rounded-full pointer-events-none shadow-sm ${
                enemy.isAlert ? 'bg-red-500 ring-2 ring-red-400 animate-pulse' : 'bg-red-400'
              }`}
            />
          );
        })}

      {/* Drops */}
      {drops.map((drop, idx) => {
        const pt = transformToRadar(drop.x, drop.z);
        return (
          <div
            key={idx}
            style={{ left: pt.x - 2.5, top: pt.y - 2.5 }}
            className={`absolute w-1.5 h-1.5 rounded-sm pointer-events-none ${
              drop.type === 'ammo' ? 'bg-emerald-400' : 'bg-cyan-400'
            }`}
          />
        );
      })}

      {/* Extraction Zone Waypoint */}
      <div
        style={{ left: extPoint.x - 4, top: extPoint.y - 4 }}
        className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-300 animate-pulse pointer-events-none"
      />

      {/* Top Heading Badge */}
      <div className="absolute top-1 inset-x-0 text-center text-[8px] font-mono font-bold text-sky-400/80 uppercase pointer-events-none">
        RADAR {extDist}m
      </div>
    </div>
  );
};
