/**
 * Unified input hook using Pointer Events API only.
 *
 * Why no touch events: The old code mixed onPointerDown/Up with onTouchStart/End,
 * causing double-firing on mobile, a missing onTouchCancel (stale swipe state),
 * and fights with browser scroll gestures.
 *
 * Fix: Use only pointer events. Add touch-action: none in CSS.
 * setPointerCapture ensures we receive pointerup even if the pointer leaves
 * the element, preventing lost-gesture bugs.
 */

import { useRef, useCallback } from 'react';
import { Direction } from '../types';

const SWIPE_THRESHOLD = 40; // px

interface InputHandlers {
  /** Attach to the swipeable canvas/wrapper element */
  swipeHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp:   (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  /** Returns a handler for a directional button (onPointerDown) */
  directionButtonHandler: (direction: Direction) => (e: React.PointerEvent) => void;
  /** Handler for the reset button (onPointerDown) */
  resetButtonHandler: (e: React.PointerEvent) => void;
}

interface UseInputOptions {
  onDirection: (direction: Direction) => void;
  onReset: () => void;
}

export function useInput({ onDirection, onReset }: UseInputOptions): InputHandlers {
  const swipeOrigin = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Capture pointer so we receive pointerup even if finger leaves element
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    swipeOrigin.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const origin = swipeOrigin.current;
    if (!origin || origin.pointerId !== e.pointerId) return;
    swipeOrigin.current = null;

    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= SWIPE_THRESHOLD) {
      const direction: Direction = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'RIGHT' : 'LEFT')
        : (dy > 0 ? 'DOWN' : 'UP');
      onDirection(direction);
    }
  }, [onDirection]);

  const onPointerCancel = useCallback((_e: React.PointerEvent) => {
    // Critical bug fix from old code: touch cancel must clear the swipe state
    swipeOrigin.current = null;
  }, []);

  const directionButtonHandler = useCallback(
    (direction: Direction) => (e: React.PointerEvent) => {
      e.preventDefault(); // block any synthetic mouse events from touch
      e.stopPropagation(); // don't bubble to swipe wrapper
      onDirection(direction);
    },
    [onDirection],
  );

  const resetButtonHandler = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReset();
  }, [onReset]);

  return {
    swipeHandlers: { onPointerDown, onPointerUp, onPointerCancel },
    directionButtonHandler,
    resetButtonHandler,
  };
}
