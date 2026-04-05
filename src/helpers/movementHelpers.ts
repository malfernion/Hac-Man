/**
 * Tile-based movement system.
 *
 * Key design: when a character would enter a WALL tile, they stop at the CENTER
 * of the last valid tile. Tile centers are always at integer coordinates
 * (col * 28 + 14), so there is no floating-point ambiguity. This eliminates
 * the "stuck in wall" class of bugs present in the previous AABB system.
 */

import { Direction, Position, Tile } from '../types';
import {
  TILE_SIZE,
  pixelToTile,
  tileToPixel,
  stepTile,
  wrapTile,
  getTileAt,
  isWalkable,
  wrapPosition,
} from './tileHelpers';

export interface MoveResult {
  position: Position;
  blocked: boolean;
}

// ─── Direction helpers ────────────────────────────────────────────────────────

function axis(direction: Direction): 'x' | 'y' {
  return direction === 'LEFT' || direction === 'RIGHT' ? 'x' : 'y';
}

function perpAxis(direction: Direction): 'x' | 'y' {
  return direction === 'LEFT' || direction === 'RIGHT' ? 'y' : 'x';
}

function step(direction: Direction): 1 | -1 {
  return direction === 'RIGHT' || direction === 'DOWN' ? 1 : -1;
}

// ─── Core movement ────────────────────────────────────────────────────────────

/**
 * Move a character by `speed * (deltaMs / 1000)` pixels in `direction`,
 * stopping at tile centers if a wall tile would be entered.
 *
 * The character's position on the axis perpendicular to movement is snapped to
 * the nearest tile-rail center, preventing gradual drift.
 *
 * @param pos       Current pixel position
 * @param direction Direction of movement
 * @param speed     Speed in pixels/second
 * @param deltaMs   Frame delta in milliseconds
 * @param grid      29×29 tile grid
 * @param isGhost   Whether the mover is a ghost (affects walkable tiles)
 */
export function moveCharacter(
  pos: Position,
  direction: Direction,
  speed: number,
  deltaMs: number,
  grid: Tile[][],
  isGhost = false,
): MoveResult {
  const moveAmount = speed * (deltaMs / 1000);
  if (moveAmount <= 0) {
    return { position: { ...pos }, blocked: false };
  }

  const mvAxis = axis(direction);
  const fixedAxis = perpAxis(direction);
  const mvStep = step(direction);

  // Snap the fixed axis to the nearest tile-rail center.
  // This prevents the character from drifting between tiles when turning.
  const currentTile = pixelToTile(pos);
  const tileCenter = tileToPixel(currentTile);
  const snappedFixedCoord = tileCenter[fixedAxis];

  let currentCoord = pos[mvAxis];
  const targetCoord = currentCoord + mvStep * moveAmount;

  let remaining = Math.abs(targetCoord - currentCoord);
  let checkTile = currentTile;
  let blocked = false;

  while (remaining > 0) {
    const checkCenter = tileToPixel(checkTile);
    const checkCenterCoord = checkCenter[mvAxis];

    // The boundary between checkTile and the next tile in movement direction
    const boundary = checkCenterCoord + mvStep * (TILE_SIZE / 2);
    const distToBoundary = Math.abs(boundary - currentCoord);

    if (remaining <= distToBoundary) {
      // We don't reach the tile boundary this frame – move freely
      currentCoord += mvStep * remaining;
      remaining = 0;
    } else {
      // We would cross into the next tile – check if it's walkable
      const nextTile = wrapTile(stepTile(checkTile, direction));
      if (!isWalkable(getTileAt(grid, nextTile), isGhost)) {
        // Stop exactly at current tile center – always a clean integer
        currentCoord = checkCenterCoord;
        blocked = true;
        remaining = 0;
      } else {
        // Consume movement to boundary and continue from there
        remaining -= distToBoundary;
        currentCoord = boundary;
        checkTile = nextTile;
      }
    }
  }

  const newPos: Position = mvAxis === 'x'
    ? { x: currentCoord, y: snappedFixedCoord }
    : { x: snappedFixedCoord, y: currentCoord };

  return { position: wrapPosition(newPos), blocked };
}

// ─── Direction change ─────────────────────────────────────────────────────────

/**
 * Returns true if the character can change to `nextDirection` from their
 * current position.
 *
 * The character must be close enough to a tile center to "turn" (within 40%
 * of a tile), and the tile in the desired direction must be walkable.
 */
export function canChangeDirection(
  pos: Position,
  nextDirection: Direction | null,
  grid: Tile[][],
  isGhost = false,
): boolean {
  if (!nextDirection) return false;

  const tile = pixelToTile(pos);
  const center = tileToPixel(tile);

  const snapThreshold = TILE_SIZE * 0.4; // 11.2 px
  if (Math.abs(pos.x - center.x) > snapThreshold) return false;
  if (Math.abs(pos.y - center.y) > snapThreshold) return false;

  const nextTile = wrapTile(stepTile(tile, nextDirection));
  return isWalkable(getTileAt(grid, nextTile), isGhost);
}

// ─── Bounds wrapping (kept for backward compat with tests) ────────────────────

/** @deprecated Use wrapPosition from tileHelpers instead */
export function checkAndTransformIntoBounds(position: Position): void {
  const wrapped = wrapPosition(position);
  position.x = wrapped.x;
  position.y = wrapped.y;
}

// ─── Exported for test use ────────────────────────────────────────────────────

/**
 * Returns the next position of a character moving in `direction` with no walls.
 * Used by tests to verify basic movement calculations.
 */
export function getNextCharacterPositionForDirection(
  character: { position: Position; speed: number },
  direction: Direction,
  duration: number,
): Position {
  const emptyGrid: Tile[][] = Array.from({ length: 29 }, () =>
    new Array<Tile>(29).fill(Tile.OPEN),
  );
  return moveCharacter(
    character.position,
    direction,
    character.speed,
    duration * 1000,
    emptyGrid,
    false,
  ).position;
}

/**
 * Legacy wrapper used by existing tests and App.js transition.
 * @deprecated Use moveCharacter directly.
 */
export function getNextCharacterRailPosition(
  character: { position: Position; speed: number; size?: number },
  direction: Direction,
  duration: number,
  walls: [number, number, number, number][],
): MoveResult {
  // Build a minimal grid from the provided wall rects for backward compatibility
  const emptyGrid: Tile[][] = Array.from({ length: 29 }, () =>
    new Array<Tile>(29).fill(Tile.OPEN),
  );
  for (const [x0, y0, w, h] of walls) {
    for (let row = y0; row < y0 + h; row++) {
      for (let col = x0; col < x0 + w; col++) {
        if (col >= 0 && col < 29 && row >= 0 && row < 29) {
          emptyGrid[row][col] = Tile.WALL;
        }
      }
    }
  }

  return moveCharacter(
    character.position,
    direction,
    character.speed,
    duration * 1000,
    emptyGrid,
    false,
  );
}
