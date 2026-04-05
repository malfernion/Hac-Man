/**
 * Pure game loop tick function.
 *
 * tickGameState is a pure function that takes the current game state,
 * a delta time, and a timestamp, and returns a list of Redux actions to
 * dispatch. This makes the game logic testable without a DOM or Redux store.
 *
 * The game loop in App.tsx calls this every animation frame and dispatches
 * the returned actions.
 */

import {
  RootState,
  Direction,
  GhostState,
  GhostMode,
  Position,
  Tile,
} from './types';
import {
  moveCharacter,
  canChangeDirection,
} from './helpers/movementHelpers';
import {
  findCollidingCoin,
  findCollidingPill,
  findCollidingGhost,
} from './helpers/collisionHelpers';
import {
  pixelToTile,
  getTileAt,
  bfsPath,
  reverseDirection,
  TILE_SIZE,
} from './helpers/tileHelpers';
import {
  getChaseTarget,
  chooseBestDirection,
  chooseRandomDirection,
  atTileCenter,
  GHOST_HOME_CORNERS,
} from './helpers/ghostHelpers';
import { getLevelParams, getModeSchedule } from './data/levelParams';

// ─── Ghost house / release logic ─────────────────────────────────────────────

const FORCE_RELEASE_MS = 4000;
const HOME_BOUNCE_SPEED = 40; // px/s inside house

/** Returns the ghost that should be force-released next (lowest dotLimit among home ghosts) */
function nextGhostToForceRelease(ghosts: GhostState[]): GhostState | undefined {
  const homeGhosts = ghosts.filter(g => g.mode === 'home');
  if (homeGhosts.length === 0) return undefined;
  return homeGhosts.reduce((a, b) => a.dotLimit <= b.dotLimit ? a : b);
}

// ─── Ghost movement (single ghost per frame) ──────────────────────────────────

function tickGhost(
  ghost: GhostState,
  player: RootState['player'],
  allGhosts: GhostState[],
  grid: Tile[][],
  params: ReturnType<typeof getLevelParams>,
  globalMode: 'scatter' | 'chase',
  frightenedTimer: number,
  frightenedFlashAt: number,
  deltaMs: number,
  _timestamp: number,
): Partial<GhostState> {
  const { mode } = ghost;

  // ── Home mode: bounce vertically in house ──
  if (mode === 'home') {
    const result = moveCharacter(ghost.position, ghost.direction, HOME_BOUNCE_SPEED, deltaMs, grid, true);
    const newDir = result.blocked ? reverseDirection(ghost.direction) : ghost.direction;
    return { position: result.position, direction: newDir, mode: 'home' };
  }

  // ── Leaving mode: navigate to house center column, then move UP through door ──
  if (mode === 'leaving') {
    // Find center door column (middle of the three door tiles)
    let doorCol = 14;
    let doorRow = 11;
    for (let r = 0; r < grid.length; r++) {
      const c = grid[r].indexOf(Tile.GHOST_DOOR);
      if (c >= 0) {
        doorCol = c + 1; // center tile of three-tile door
        doorRow = r;
        break;
      }
    }
    const centerX = doorCol * TILE_SIZE + TILE_SIZE / 2; // pixel center of exit column
    const speed = params.ghostSpeed * 0.5;
    const currentTile = pixelToTile(ghost.position);

    // If ghost has cleared the door row, transition to game
    if (currentTile.row < doorRow) {
      const newMode: GhostMode = globalMode;
      return { direction: 'LEFT', mode: newMode, targetTile: GHOST_HOME_CORNERS[ghost.id] };
    }

    // Phase 1: move horizontally to align with exit column
    const dx = centerX - ghost.position.x;
    if (Math.abs(dx) > 2) {
      const dir: Direction = dx > 0 ? 'RIGHT' : 'LEFT';
      const result = moveCharacter(ghost.position, dir, speed, deltaMs, grid, true);
      return { position: result.position, direction: dir };
    }

    // Phase 2: aligned – move UP through door
    const snappedPos = { x: centerX, y: ghost.position.y };
    const result = moveCharacter(snappedPos, 'UP', speed, deltaMs, grid, true);
    return { position: result.position, direction: 'UP' };
  }

  // ── Eaten mode: follow BFS path back to house ──
  if (mode === 'eaten') {
    const result = moveCharacter(ghost.position, ghost.direction, params.eatenSpeed, deltaMs, grid, true);
    const currentTile = pixelToTile(result.position);
    const tileType = getTileAt(grid, currentTile);

    // Arrived at ghost house
    if (tileType === Tile.GHOST_HOUSE || tileType === Tile.GHOST_DOOR) {
      return { position: result.position, mode: 'home', direction: 'DOWN', returnPath: [] };
    }

    // Follow return path
    let { returnPath, direction } = ghost;
    if (returnPath.length === 0 || atTileCenter(result.position, currentTile, 2)) {
      if (returnPath.length > 0) {
        returnPath = returnPath.slice(1);
        direction = returnPath[0] ?? direction;
      } else {
        // Recalculate path
        const houseEntrance = grid.reduce<{ col: number; row: number } | null>((found, row, r) => {
          if (found) return found;
          const c = row.indexOf(Tile.GHOST_DOOR);
          return c >= 0 ? { col: c, row: r } : null;
        }, null) ?? { col: 14, row: 11 };
        returnPath = bfsPath(currentTile, houseEntrance, grid);
        direction = returnPath[0] ?? direction;
      }
    }

    return { position: result.position, direction, returnPath };
  }

  // ── Frightened mode: random movement ──
  if (mode === 'frightened') {
    const flashing = frightenedTimer > 0 && frightenedTimer <= frightenedFlashAt;
    const currentTile = pixelToTile(ghost.position);
    let { direction } = ghost;

    if (atTileCenter(ghost.position, currentTile, 2)) {
      direction = chooseRandomDirection(currentTile, direction, grid);
    }

    const result = moveCharacter(ghost.position, direction, params.frightenedSpeed, deltaMs, grid, true);
    return { position: result.position, direction, frightenedFlashing: flashing };
  }

  // ── Scatter / chase mode ──
  const effectiveMode = mode;
  let target = effectiveMode === 'scatter'
    ? ghost.homeCorner
    : getChaseTarget(ghost, player, allGhosts);

  const currentTile = pixelToTile(ghost.position);

  // Determine speed (Cruise Elroy for Blinky handled externally)
  const tileType = getTileAt(grid, currentTile);
  const speed = tileType === Tile.TUNNEL ? params.tunnelSpeed : params.ghostSpeed;

  let { direction } = ghost;

  if (atTileCenter(ghost.position, currentTile, 2)) {
    direction = chooseBestDirection(currentTile, direction, target, grid, effectiveMode);
  }

  const result = moveCharacter(ghost.position, direction, speed, deltaMs, grid, true);
  return { position: result.position, direction, targetTile: target };
}

// ─── Action type definitions (inline to avoid circular deps) ─────────────────

type TickAction =
  | { type: 'MOVE';                  timeElapsed: number; position: Position }
  | { type: 'COLLIDED';              timeElapsed: number; position: Position }
  | { type: 'CHANGE_TO_NEXT_DIRECTION' }
  | { type: 'COIN_COLLECTED';        coin: Position }
  | { type: 'PILL_COLLECTED';        pill: Position }
  | { type: 'INCREASE_SCORE';        score: number }
  | { type: 'LEVEL_COMPLETED' }
  | { type: 'RESET_PLAYER_ANIMATION' }
  | { type: 'POWER_MODE_STARTED';    endsAt: number }
  | { type: 'POWER_MODE_ENDED' }
  | { type: 'GHOST_TICK';            payload: Partial<GhostState> & { id: GhostState['id'] } }
  | { type: 'GHOSTS_FRIGHTENED';     endsAt: number }
  | { type: 'FRIGHTENED_ENDED' }
  | { type: 'GLOBAL_MODE_TICK';      deltaMs: number }
  | { type: 'DOT_EATEN_GHOST' }
  | { type: 'GHOSTS_REVERSE'; newPhase: number }
  | { type: 'PLAYER_DYING';          timestamp: number }
  | { type: 'LOST_LIFE' }
  | { type: 'PLAYER_RESPAWN' }
  | { type: 'RESET_PLAYER' }
  | { type: 'RESET_GHOSTS' }
  | { type: 'GAME_OVER' }
  | { type: 'ADD_SCORE_POPUP';       popup: { id: number; value: number; position: Position; createdAt: number } }
  | { type: 'REMOVE_SCORE_POPUP';    id: number }
  | { type: 'EXTRA_LIFE' };

let popupId = 1000;

// ─── Main tick function ───────────────────────────────────────────────────────

/**
 * Computes the next set of Redux actions from the current game state and
 * the elapsed frame time. This is a pure function suitable for unit testing.
 *
 * @param state     Full Redux state
 * @param deltaMs   Milliseconds elapsed since last frame (clamped internally)
 * @param timestamp Current animation timestamp (from requestAnimationFrame)
 */
export function tickGameState(
  state: RootState,
  deltaMs: number,
  timestamp: number,
): TickAction[] {
  const clampedDelta = Math.min(deltaMs, 100); // cap at 100ms to handle tab backgrounding
  const actions: TickAction[] = [];

  const { player, ghosts: ghostsSlice, levels, gameInfo } = state;
  const { currentLevel } = levels;
  const { grid } = currentLevel;
  const params = getLevelParams(gameInfo.levelIndex);

  // ── 1. Power mode expiry ──────────────────────────────────────────────────
  if (gameInfo.poweredUp && gameInfo.powerModeEndsAt !== null) {
    if (timestamp >= gameInfo.powerModeEndsAt) {
      actions.push({ type: 'POWER_MODE_ENDED' });
      actions.push({ type: 'FRIGHTENED_ENDED' });
    }
  }

  // ── 2. Global mode timer ─────────────────────────────────────────────────
  {
    const schedule = getModeSchedule(gameInfo.levelIndex);
    actions.push({ type: 'GLOBAL_MODE_TICK', deltaMs: clampedDelta });

    const newTimer = ghostsSlice.globalModeTimer + clampedDelta;
    const currentPhase = schedule[ghostsSlice.globalModePhase];
    if (currentPhase && newTimer >= currentPhase.duration && currentPhase.duration !== Infinity) {
      // Mode phase ends – advance to next phase and reverse ghost directions
      const newPhase = ghostsSlice.globalModePhase + 1;
      actions.push({ type: 'GHOSTS_REVERSE', newPhase } as TickAction);
    }
  }

  // ── 3. Score popup expiry ────────────────────────────────────────────────
  for (const popup of gameInfo.scorePopups) {
    if (timestamp - popup.createdAt > 1200) {
      actions.push({ type: 'REMOVE_SCORE_POPUP', id: popup.id });
    }
  }

  // ── 4. Player movement ───────────────────────────────────────────────────
  let effectiveDirection = player.direction;

  if (canChangeDirection(player.position, player.nextDirection, grid, false)) {
    actions.push({ type: 'CHANGE_TO_NEXT_DIRECTION' });
    effectiveDirection = player.nextDirection;
  }

  if (effectiveDirection) {
    const moveResult = moveCharacter(
      player.position,
      effectiveDirection,
      params.playerSpeed,
      clampedDelta,
      grid,
      false,
    );

    if (moveResult.blocked) {
      actions.push({ type: 'COLLIDED', timeElapsed: clampedDelta / 1000, position: moveResult.position });
    } else {
      actions.push({ type: 'MOVE', timeElapsed: clampedDelta / 1000, position: moveResult.position });
    }

    const playerForCollision = { position: moveResult.position, size: player.size };

    // ── 4a. Coin collision ──────────────────────────────────────────────
    const collidingCoin = findCollidingCoin(playerForCollision, currentLevel.coins);
    if (collidingCoin) {
      actions.push({ type: 'COIN_COLLECTED', coin: collidingCoin });
      actions.push({ type: 'INCREASE_SCORE', score: 10 });
      actions.push({ type: 'DOT_EATEN_GHOST' });

      // Extra life at 10,000 points
      const newScore = gameInfo.score + 10;
      if (Math.floor(newScore / 10000) > Math.floor(gameInfo.score / 10000)) {
        actions.push({ type: 'EXTRA_LIFE' });
      }

      if (currentLevel.coins.length <= 1) {
        actions.push({ type: 'LEVEL_COMPLETED' });
        actions.push({ type: 'RESET_PLAYER_ANIMATION' });
      }
    }

    // ── 4b. Pill collision ──────────────────────────────────────────────
    const collidingPill = findCollidingPill(playerForCollision, currentLevel.pills);
    if (collidingPill) {
      actions.push({ type: 'PILL_COLLECTED', pill: collidingPill });
      actions.push({ type: 'INCREASE_SCORE', score: 50 });
      const endsAt = timestamp + params.frightenedDuration;
      actions.push({ type: 'POWER_MODE_STARTED', endsAt });
      actions.push({ type: 'GHOSTS_FRIGHTENED', endsAt });
    }
  }

  // ── 5. Ghost ticks ───────────────────────────────────────────────────────
  const schedule = getModeSchedule(gameInfo.levelIndex);
  const currentPhaseEntry = schedule[ghostsSlice.globalModePhase];
  const globalMode = currentPhaseEntry?.mode ?? 'chase';

  // Cruise Elroy: Blinky speed boost
  const remainingDots = currentLevel.coins.length;
  const blinkyElroySpeed =
    remainingDots <= params.elroyDotsThreshold2 ? params.elroySpeed2 :
    remainingDots <= params.elroyDotsThreshold1 ? params.elroySpeed1 :
    params.ghostSpeed;

  for (const ghost of ghostsSlice.ghosts) {
    // Check if ghost should leave house (dot counter or force release)
    let activeGhost = ghost;
    if (ghost.mode === 'home') {
      const shouldRelease =
        ghost.dotCounter >= ghost.dotLimit ||
        (ghostsSlice.forceReleaseTimer >= FORCE_RELEASE_MS &&
          nextGhostToForceRelease(ghostsSlice.ghosts)?.id === ghost.id);

      if (shouldRelease) {
        activeGhost = { ...ghost, mode: 'leaving', direction: 'UP' };
        actions.push({ type: 'GHOST_TICK', payload: { ...activeGhost } });
        continue;
      }
    }

    const ghostParams = { ...params };
    if (ghost.id === 'blinky') {
      ghostParams.ghostSpeed = blinkyElroySpeed;
    }

    const updates = tickGhost(
      activeGhost,
      player,
      ghostsSlice.ghosts,
      grid,
      ghostParams,
      globalMode,
      ghostsSlice.frightenedTimer,
      params.frightenedFlashAt,
      clampedDelta,
      timestamp,
    );

    actions.push({ type: 'GHOST_TICK', payload: { id: ghost.id, ...updates } as Partial<GhostState> & { id: GhostState['id'] } });
  }

  // ── 6. Ghost-player collision ────────────────────────────────────────────
  if (!gameInfo.playerDying && effectiveDirection) {
    const playerChar = {
      position: player.position,
      size: player.size,
    };
    const collidingGhost = findCollidingGhost(playerChar, ghostsSlice.ghosts);

    if (collidingGhost) {
      if (collidingGhost.mode === 'frightened') {
        // Eat ghost
        const comboIndex = ghostsSlice.eatCombo;
        const eatScore = 200 * Math.pow(2, comboIndex);
        actions.push({ type: 'GHOST_TICK', payload: { id: collidingGhost.id, mode: 'eaten', frightenedFlashing: false } as Partial<GhostState> & { id: GhostState['id'] } });
        actions.push({ type: 'INCREASE_SCORE', score: eatScore });
        actions.push({
          type: 'ADD_SCORE_POPUP',
          popup: {
            id: ++popupId,
            value: eatScore,
            position: { ...collidingGhost.position },
            createdAt: timestamp,
          },
        });
      } else if (collidingGhost.mode === 'scatter' || collidingGhost.mode === 'chase') {
        // Player dies
        actions.push({ type: 'PLAYER_DYING', timestamp });
      }
    }
  }

  // ── 7. Player death sequence ─────────────────────────────────────────────
  if (gameInfo.playerDying && gameInfo.playerDyingAt !== null) {
    const elapsed = timestamp - gameInfo.playerDyingAt;
    if (elapsed >= 1500) {
      // Death animation complete
      const newLives = gameInfo.lives - 1;
      actions.push({ type: 'LOST_LIFE' });
      if (newLives <= 0) {
        actions.push({ type: 'GAME_OVER' });
      } else {
        actions.push({ type: 'PLAYER_RESPAWN' });
        actions.push({ type: 'RESET_PLAYER' });
        actions.push({ type: 'RESET_GHOSTS' });
      }
    }
  }

  return actions;
}
