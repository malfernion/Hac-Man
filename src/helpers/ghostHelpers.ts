/**
 * Ghost AI: pure targeting functions and direction selection.
 *
 * Each ghost has a personality that determines its chase-mode target tile.
 * All functions here are pure – given the same inputs they always return the
 * same output, making them easy to unit-test.
 *
 * Ghost movement decision algorithm (at each tile center):
 *  1. Enumerate all 4 directions
 *  2. Remove current direction's reverse (ghosts can't turn 180° except on mode change)
 *  3. Remove directions blocked by walls / unauthorized tiles
 *  4. Among valid directions, pick the one whose next tile is closest (Euclidean) to target
 *  5. Tiebreaker: UP > LEFT > DOWN > RIGHT (classic priority)
 */

import {
  Direction,
  GhostId,
  GhostMode,
  GhostState,
  PlayerState,
  Position,
  Tile,
  TileCoord,
} from '../types';
import {
  ALL_DIRECTIONS,
  euclideanDistanceSq,
  getTileAt,
  isWalkable,
  pixelToTile,
  stepTile,
  wrapTile,
  tileToPixel,
  TILE_SIZE,
} from './tileHelpers';

// ─── Target computation ───────────────────────────────────────────────────────

/**
 * Blinky (red): directly targets the player's current tile.
 * Simplest and most relentlessly aggressive ghost.
 */
export function blinkyTarget(player: PlayerState): TileCoord {
  return pixelToTile(player.position);
}

/**
 * Pinky (pink): targets 4 tiles ahead of the player's facing direction.
 * Replicates the classic UP overflow bug: when player faces UP, target is
 * 4 up AND 4 left (an integer overflow artefact in the original code).
 */
export function pinkyTarget(player: PlayerState): TileCoord {
  const tile = pixelToTile(player.position);
  const n = 4;
  switch (player.direction) {
    case 'UP':    return { col: tile.col - n, row: tile.row - n }; // classic bug replicated
    case 'DOWN':  return { col: tile.col,     row: tile.row + n };
    case 'LEFT':  return { col: tile.col - n, row: tile.row     };
    case 'RIGHT': return { col: tile.col + n, row: tile.row     };
    default:      return tile; // no direction → target player's tile
  }
}

/**
 * Inky (cyan): the most complex ghost.
 * 1. Find the "pivot" tile: 2 tiles ahead of the player (with UP overflow bug)
 * 2. Draw a vector from Blinky's tile to the pivot
 * 3. Double that vector to get Inky's target
 *
 * Inky is unpredictable when Blinky is far away, but flanks effectively
 * when Blinky is close to the player.
 */
export function inkyTarget(player: PlayerState, blinky: GhostState): TileCoord {
  const playerTile = pixelToTile(player.position);
  const blinkyTile = pixelToTile(blinky.position);

  // Pivot: 2 tiles ahead (with UP overflow bug)
  let pivot: TileCoord;
  switch (player.direction) {
    case 'UP':    pivot = { col: playerTile.col - 2, row: playerTile.row - 2 }; break;
    case 'DOWN':  pivot = { col: playerTile.col,     row: playerTile.row + 2 }; break;
    case 'LEFT':  pivot = { col: playerTile.col - 2, row: playerTile.row     }; break;
    case 'RIGHT': pivot = { col: playerTile.col + 2, row: playerTile.row     }; break;
    default:      pivot = playerTile;
  }

  return {
    col: pivot.col + (pivot.col - blinkyTile.col),
    row: pivot.row + (pivot.row - blinkyTile.row),
  };
}

/**
 * Clyde (orange): chases like Blinky when >8 tiles away, retreats to home
 * corner when ≤8 tiles away. Creates erratic circling behaviour near the player.
 */
export function clydeTarget(
  player: PlayerState,
  clyde: GhostState,
): TileCoord {
  const playerTile = pixelToTile(player.position);
  const clydeTile = pixelToTile(clyde.position);
  // Using squared distance avoids sqrt while preserving the 8-tile comparison
  const distSq = euclideanDistanceSq(clydeTile, playerTile);
  return distSq > 64 ? playerTile : clyde.homeCorner;
}

// ─── Chase-mode target dispatcher ────────────────────────────────────────────

/**
 * Returns the chase-mode target tile for a ghost given current game state.
 */
export function getChaseTarget(
  ghost: GhostState,
  player: PlayerState,
  allGhosts: GhostState[],
): TileCoord {
  const blinky = allGhosts.find(g => g.id === 'blinky')!;
  switch (ghost.id) {
    case 'blinky': return blinkyTarget(player);
    case 'pinky':  return pinkyTarget(player);
    case 'inky':   return inkyTarget(player, blinky ?? ghost);
    case 'clyde':  return clydeTarget(player, ghost);
  }
}

// ─── Direction selection ──────────────────────────────────────────────────────

/** Direction priority tiebreaker order: UP > LEFT > DOWN > RIGHT */
const DIRECTION_PRIORITY: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];

/**
 * Returns true if a ghost in the given mode is allowed to enter the given
 * tile type. Rules:
 * - All ghosts avoid WALL
 * - Ghosts in normal modes (scatter/chase/frightened) cannot re-enter the house
 * - Ghosts in 'leaving' or 'eaten' modes can pass through the GHOST_DOOR and house
 * - The 'home' mode moves inside the house only
 */
export function ghostCanEnterTile(tileType: Tile, mode: GhostMode): boolean {
  switch (tileType) {
    case Tile.OPEN:
    case Tile.TUNNEL:
      return true;
    case Tile.GHOST_DOOR:
      // Only leaving/eaten ghosts may pass through the door
      return mode === 'leaving' || mode === 'eaten';
    case Tile.GHOST_HOUSE:
      return mode === 'home' || mode === 'leaving' || mode === 'eaten';
    case Tile.WALL:
    default:
      return false;
  }
}

/**
 * Chooses the best direction for a ghost at a tile center given a target tile.
 *
 * Rules (classic Pac-Man):
 * 1. Cannot reverse current direction (no U-turns during normal movement)
 * 2. Cannot enter WALL or unauthorised tiles for current mode
 * 3. Among valid options, pick the direction whose next tile is closest to target
 * 4. Tiebreaker: UP > LEFT > DOWN > RIGHT
 *
 * @param currentTile    Tile the ghost is currently at (decision point)
 * @param currentDir     Ghost's current direction of travel
 * @param targetTile     Target tile to move toward
 * @param grid           29×29 tile grid
 * @param mode           Current ghost mode (affects which tiles are accessible)
 */
export function chooseBestDirection(
  currentTile: TileCoord,
  currentDir: Direction,
  targetTile: TileCoord,
  grid: Tile[][],
  mode: GhostMode,
): Direction {
  const reverse = reverseDir(currentDir);

  // Collect valid candidate directions
  const candidates: Direction[] = [];
  for (const dir of DIRECTION_PRIORITY) {
    if (dir === reverse) continue; // no U-turns
    const next = wrapTile(stepTile(currentTile, dir));
    const tileType = getTileAt(grid, next);
    if (ghostCanEnterTile(tileType, mode)) {
      candidates.push(dir);
    }
  }

  if (candidates.length === 0) {
    // Completely stuck – allow reverse as last resort
    return reverse;
  }

  // Pick direction that minimises distance to target
  let best = candidates[0];
  let bestDistSq = euclideanDistanceSq(wrapTile(stepTile(currentTile, best)), targetTile);

  for (let i = 1; i < candidates.length; i++) {
    const dir = candidates[i];
    const nextTile = wrapTile(stepTile(currentTile, dir));
    const distSq = euclideanDistanceSq(nextTile, targetTile);
    if (distSq < bestDistSq) {
      best = dir;
      bestDistSq = distSq;
    }
    // Equal distance: tiebreaker already handled by DIRECTION_PRIORITY ordering
  }

  return best;
}

function reverseDir(dir: Direction): Direction {
  switch (dir) {
    case 'UP':    return 'DOWN';
    case 'DOWN':  return 'UP';
    case 'LEFT':  return 'RIGHT';
    case 'RIGHT': return 'LEFT';
  }
}

// ─── Random direction (frightened mode) ──────────────────────────────────────

/**
 * Returns a random valid direction for frightened mode.
 * Still cannot reverse or enter walls.
 */
export function chooseRandomDirection(
  currentTile: TileCoord,
  currentDir: Direction,
  grid: Tile[][],
  rng: () => number = Math.random,
): Direction {
  const reverse = reverseDir(currentDir);
  const valid: Direction[] = [];

  for (const dir of ALL_DIRECTIONS) {
    if (dir === reverse) continue;
    const next = wrapTile(stepTile(currentTile, dir));
    const tileType = getTileAt(grid, next);
    if (isWalkable(tileType, true) || tileType === Tile.GHOST_HOUSE) {
      valid.push(dir);
    }
  }

  if (valid.length === 0) return reverse;
  return valid[Math.floor(rng() * valid.length)];
}

// ─── Ghost speed ──────────────────────────────────────────────────────────────

/**
 * Returns the effective speed for a ghost in the given mode/context.
 * Speeds are percentages of the base speed (210 px/s ≈ 7.5 tiles/s).
 */
export function getGhostSpeed(
  ghost: GhostState,
  mode: GhostMode,
  currentTileType: Tile,
  baseSpeed: number,
  frightenedSpeed: number,
  eatenSpeed: number,
  tunnelSpeed: number,
  elroySpeed: number,
): number {
  if (mode === 'eaten') return eatenSpeed;
  if (mode === 'frightened') return frightenedSpeed;
  if (mode === 'home' || mode === 'leaving') return baseSpeed * 0.5;
  if (currentTileType === Tile.TUNNEL) return tunnelSpeed;
  if (ghost.id === 'blinky') return elroySpeed; // Cruise Elroy handled by caller
  return baseSpeed;
}

// ─── Position helpers ─────────────────────────────────────────────────────────

/**
 * Returns true if the pixel position is within `threshold` px of the tile center.
 * Used to decide when a ghost has "arrived" at a tile center and should make
 * its next direction decision.
 */
export function atTileCenter(pos: Position, tile: TileCoord, threshold = 1): boolean {
  const center = tileToPixel(tile);
  return Math.abs(pos.x - center.x) <= threshold && Math.abs(pos.y - center.y) <= threshold;
}

/**
 * Returns true if the position is close enough to the given tile center to
 * warrant a direction decision.
 */
export function nearTileCenter(pos: Position, threshold = TILE_SIZE * 0.5): boolean {
  const tile = pixelToTile(pos);
  const center = tileToPixel(tile);
  return Math.abs(pos.x - center.x) <= threshold && Math.abs(pos.y - center.y) <= threshold;
}

// ─── Ghost scatter corners ────────────────────────────────────────────────────

export const GHOST_HOME_CORNERS: Record<GhostId, TileCoord> = {
  blinky: { col: 25, row: 0  },
  pinky:  { col: 2,  row: 0  },
  inky:   { col: 27, row: 28 },
  clyde:  { col: 0,  row: 28 },
};
