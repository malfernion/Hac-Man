import { Position, GhostState, GhostMode } from '../types';

interface Character {
  position: Position;
  size: number;
}

type PointArray = [number, number];

// ─── Collectible collision ────────────────────────────────────────────────────

function findCollidingPoint(character: Character, points: PointArray[]): PointArray | undefined {
  const { position, size } = character;
  const halfSize = size / 2;
  const lx = position.x - halfSize;
  const rx = position.x + halfSize;
  const ly = position.y - halfSize;
  const ry = position.y + halfSize;

  for (const point of points) {
    const cx = point[0];
    const cy = point[1];
    if (cx > lx && cx < rx && cy > ly && cy < ry) {
      return point;
    }
  }
  return undefined;
}

/**
 * Returns the first coin whose position is inside the character's bounding box,
 * or undefined if none.
 */
export function findCollidingCoin(
  character: Character,
  coins: PointArray[],
): PointArray | undefined {
  return findCollidingPoint(character, coins);
}

/**
 * Returns the first pill whose position is inside the character's bounding box,
 * or undefined if none.
 */
export function findCollidingPill(
  character: Character,
  pills: PointArray[],
): PointArray | undefined {
  return findCollidingPoint(character, pills);
}

// ─── Ghost collision ──────────────────────────────────────────────────────────

const GHOST_COLLISION_RADIUS = 12; // px

/**
 * Returns the first ghost that is colliding with the player, or undefined.
 * Ghosts in 'eaten' mode are ignored (transparent).
 */
export function findCollidingGhost(
  player: Character,
  ghosts: GhostState[],
): GhostState | undefined {
  const r = GHOST_COLLISION_RADIUS + player.size / 2;
  return ghosts.find(ghost => {
    if (ghost.mode === 'eaten' || ghost.mode === 'home' || ghost.mode === 'leaving') {
      return false;
    }
    const dx = player.position.x - ghost.position.x;
    const dy = player.position.y - ghost.position.y;
    return dx * dx + dy * dy < r * r;
  });
}

/**
 * Returns true if the given ghost is colliding with the player.
 */
export function isGhostCollidingWithPlayer(
  player: Character,
  ghost: GhostState,
): boolean {
  if (ghost.mode === 'eaten' || ghost.mode === 'home' || ghost.mode === 'leaving') {
    return false;
  }
  const r = GHOST_COLLISION_RADIUS + player.size / 2;
  const dx = player.position.x - ghost.position.x;
  const dy = player.position.y - ghost.position.y;
  return dx * dx + dy * dy < r * r;
}
