import { GhostState, TileCoord, Direction } from '../types';

// ─── Action types ─────────────────────────────────────────────────────────────

export const GHOST_TICK         = 'GHOST_TICK';
export const GHOSTS_INITIALIZED = 'GHOSTS_INITIALIZED';
export const GHOST_EATEN        = 'GHOST_EATEN';
export const GHOSTS_FRIGHTENED  = 'GHOSTS_FRIGHTENED';
export const FRIGHTENED_ENDED   = 'FRIGHTENED_ENDED';
export const GLOBAL_MODE_TICK   = 'GLOBAL_MODE_TICK';
export const DOT_EATEN_GHOST    = 'DOT_EATEN_GHOST'; // increment per-ghost dot counters
export const RESET_GHOSTS       = 'RESET_GHOSTS';
export const GHOSTS_REVERSE     = 'GHOSTS_REVERSE';  // on global mode switch

// ─── Action creators ──────────────────────────────────────────────────────────

export interface GhostTickPayload {
  id: GhostState['id'];
  position: GhostState['position'];
  direction: Direction;
  mode: GhostState['mode'];
  targetTile: TileCoord;
  returnPath: Direction[];
  frightenedFlashing: boolean;
}

export function ghostTick(payload: GhostTickPayload) {
  return { type: GHOST_TICK as typeof GHOST_TICK, payload };
}

export function ghostsInitialized(ghosts: GhostState[]) {
  return { type: GHOSTS_INITIALIZED as typeof GHOSTS_INITIALIZED, ghosts };
}

export function ghostEaten(id: GhostState['id'], timestamp: number, eatCombo: number) {
  return { type: GHOST_EATEN as typeof GHOST_EATEN, id, timestamp, eatCombo };
}

export function ghostsFrightened(endsAt: number) {
  return { type: GHOSTS_FRIGHTENED as typeof GHOSTS_FRIGHTENED, endsAt };
}

export function frightenedEnded() {
  return { type: FRIGHTENED_ENDED as typeof FRIGHTENED_ENDED };
}

export function globalModeTick(deltaMs: number) {
  return { type: GLOBAL_MODE_TICK as typeof GLOBAL_MODE_TICK, deltaMs };
}

export function dotEatenGhost() {
  return { type: DOT_EATEN_GHOST as typeof DOT_EATEN_GHOST };
}

export function resetGhosts() {
  return { type: RESET_GHOSTS as typeof RESET_GHOSTS };
}

export function ghostsReverse(newPhase: number) {
  return { type: GHOSTS_REVERSE as typeof GHOSTS_REVERSE, newPhase };
}

export type GhostAction =
  | ReturnType<typeof ghostTick>
  | ReturnType<typeof ghostsInitialized>
  | ReturnType<typeof ghostEaten>
  | ReturnType<typeof ghostsFrightened>
  | ReturnType<typeof frightenedEnded>
  | ReturnType<typeof globalModeTick>
  | ReturnType<typeof dotEatenGhost>
  | ReturnType<typeof resetGhosts>
  | ReturnType<typeof ghostsReverse>;
