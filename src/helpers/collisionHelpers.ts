import { Position, GhostState } from '../types';

interface Character {
  position: Position;
  size: number;
}

// ─── Collectible collision ────────────────────────────────────────────────────

function pointInBounds(px: number, py: number, lx: number, rx: number, ly: number, ry: number): boolean {
  return px > lx && px < rx && py > ly && py < ry;
}

function characterBounds(character: Character) {
  const { position, size } = character;
  const halfSize = size / 2;
  return {
    lx: position.x - halfSize,
    rx: position.x + halfSize,
    ly: position.y - halfSize,
    ry: position.y + halfSize,
  };
}

/**
 * Returns the first coin (as Position) whose position is inside the character's
 * bounding box, or undefined if none.
 */
export function findCollidingCoin(
  character: Character,
  coins: Position[],
): Position | undefined {
  const { lx, rx, ly, ry } = characterBounds(character);
  return coins.find(c => pointInBounds(c.x, c.y, lx, rx, ly, ry));
}

/**
 * Returns the first pill (as Position) whose position is inside the character's
 * bounding box, or undefined if none.
 */
export function findCollidingPill(
  character: Character,
  pills: Position[],
): Position | undefined {
  const { lx, rx, ly, ry } = characterBounds(character);
  return pills.find(p => pointInBounds(p.x, p.y, lx, rx, ly, ry));
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
