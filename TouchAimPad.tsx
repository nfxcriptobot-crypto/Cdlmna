import React, { useRef } from 'react';

interface TouchAimPadProps {
  onLookDelta: (deltaX: number, deltaY: number) => void;
  children?: React.ReactNode;
}

export const TouchAimPad: React.FC<TouchAimPadProps> = ({ onLookDelta, children }) => {
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only capture if clicked directly on pad or not on an interactive button
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-aim]')) return;

    touchIdRef.current = e.pointerId;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (touchIdRef.current !== e.pointerId || !lastPosRef.current) return;

    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;

    lastPosRef.current = { x: e.clientX, y: e.clientY };
    onLookDelta(dx, dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (touchIdRef.current === e.pointerId) {
      touchIdRef.current = null;
      lastPosRef.current = null;
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 touch-none select-none"
    >
      {children}
    </div>
  );
};
