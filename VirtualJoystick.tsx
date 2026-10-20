import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (forward: number, right: number) => void;
  size?: number;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, size = 130 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const radius = size / 2;
  const maxDistance = radius * 0.75;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    touchIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActive(true);
    updateKnob(e.clientX, e.clientY);
  };

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDistance) {
      dx = (dx / dist) * maxDistance;
      dy = (dy / dist) * maxDistance;
    }

    setKnobPos({ x: dx, y: dy });

    // Normalized values:
    // right is +X, forward is -Y
    const normRight = dx / maxDistance;
    const normForward = -dy / maxDistance;
    onMove(normForward, normRight);
  }, [maxDistance, onMove]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active || e.pointerId !== touchIdRef.current) return;
    e.preventDefault();
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== touchIdRef.current) return;
    setActive(false);
    touchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  useEffect(() => {
    return () => {
      onMove(0, 0);
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: size, height: size }}
      aria-label="Virtual Movement Joystick"
      className="relative rounded-full bg-slate-900/60 border-2 border-sky-500/40 backdrop-blur-none touch-none select-none flex items-center justify-center shadow-lg shadow-black/50 pointer-events-auto"
    >
      {/* Outer directional indicators */}
      <div className="absolute inset-2 rounded-full border border-dashed border-sky-400/20 pointer-events-none" />
      <div className="absolute top-1 text-[9px] font-mono text-sky-400/60 uppercase pointer-events-none">FWD</div>
      <div className="absolute bottom-1 text-[9px] font-mono text-sky-400/60 uppercase pointer-events-none">BCK</div>
      <div className="absolute left-1 text-[9px] font-mono text-sky-400/60 uppercase pointer-events-none">L</div>
      <div className="absolute right-1 text-[9px] font-mono text-sky-400/60 uppercase pointer-events-none">R</div>

      {/* Joystick Thumb Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: active ? 'none' : 'transform 0.15s ease-out',
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center pointer-events-none shadow-md ${
          active
            ? 'bg-sky-500 text-slate-950 ring-4 ring-sky-400/30 shadow-sky-500/50'
            : 'bg-slate-800/90 text-sky-400 border border-sky-500/50'
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-current" />
        </div>
      </div>
    </div>
  );
};
