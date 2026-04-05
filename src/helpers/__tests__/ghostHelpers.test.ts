import {
  blinkyTarget,
  pinkyTarget,
  inkyTarget,
  clydeTarget,
  chooseBestDirection,
  ghostCanEnterTile,
  chooseRandomDirection,
  GHOST_HOME_CORNERS,
} from '../ghostHelpers';
import { tileToPixel } from '../tileHelpers';
import { GhostMode, GhostState, PlayerState, Tile, TileCoord } from '../../types';

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makePlayer(col: number, row: number, direction: PlayerState['direction'] = 'RIGHT'): PlayerState {
  return {
    position: tileToPixel({ col, row }),
    direction,
    nextDirection: null,
    size: 27,
    speed: 120,
    spriteCords: [34, 0],
    animationFrameCount: 0,
    framesPerSprite: 3,
    sprites: {
      RIGHT: [[34, 0], [18, 0], [2, 0]],
      LEFT:  [[34, 0], [18, 16], [2, 16]],
      DOWN:  [[34, 0], [18, 48], [2, 48]],
      UP:    [[34, 0], [18, 32], [2, 32]],
    },
  };
}

function makeGhost(id: GhostState['id'], col: number, row: number): GhostState {
  return {
    id,
    position: tileToPixel({ col, row }),
    direction: 'RIGHT',
    mode: 'chase',
    previousMode: 'scatter',
    targetTile: { col, row },
    homeCorner: GHOST_HOME_CORNERS[id],
    homePosition: tileToPixel({ col, row }),
    dotCounter: 0,
    dotLimit: 0,
    frightenedFlashing: false,
    returnPath: [],
  };
}

// ─── blinkyTarget ────────────────────────────────────────────────────────────

describe('blinkyTarget', () => {
  it('targets the player tile exactly', () => {
    const player = makePlayer(10, 15);
    expect(blinkyTarget(player)).toEqual({ col: 10, row: 15 });
  });

  it('updates when player moves', () => {
    expect(blinkyTarget(makePlayer(5, 5))).toEqual({ col: 5, row: 5 });
    expect(blinkyTarget(makePlayer(20, 3))).toEqual({ col: 20, row: 3 });
  });
});

// ─── pinkyTarget ─────────────────────────────────────────────────────────────

describe('pinkyTarget', () => {
  it('targets 4 tiles ahead when facing RIGHT', () => {
    const player = makePlayer(10, 10, 'RIGHT');
    expect(pinkyTarget(player)).toEqual({ col: 14, row: 10 });
  });

  it('targets 4 tiles ahead when facing DOWN', () => {
    const player = makePlayer(10, 10, 'DOWN');
    expect(pinkyTarget(player)).toEqual({ col: 10, row: 14 });
  });

  it('targets 4 tiles ahead when facing LEFT', () => {
    const player = makePlayer(10, 10, 'LEFT');
    expect(pinkyTarget(player)).toEqual({ col: 6, row: 10 });
  });

  it('replicates classic UP overflow bug (4 up + 4 left when facing UP)', () => {
    const player = makePlayer(10, 10, 'UP');
    // Classic Pac-Man bug: UP adds (-4, -4) not just (0, -4)
    expect(pinkyTarget(player)).toEqual({ col: 6, row: 6 });
  });

  it('targets player tile when direction is null', () => {
    const player = makePlayer(10, 10, null);
    expect(pinkyTarget(player)).toEqual({ col: 10, row: 10 });
  });
});

// ─── inkyTarget ──────────────────────────────────────────────────────────────

describe('inkyTarget', () => {
  it('doubles the blinky→2-ahead vector', () => {
    // Player at (10, 10) facing RIGHT → pivot = (12, 10)
    // Blinky at (8, 10) → vector = (12-8, 10-10) = (4, 0)
    // Inky target = pivot + vector = (12+4, 10) = (16, 10)
    const player = makePlayer(10, 10, 'RIGHT');
    const blinky = makeGhost('blinky', 8, 10);
    expect(inkyTarget(player, blinky)).toEqual({ col: 16, row: 10 });
  });

  it('applies UP overflow to pivot calculation', () => {
    // Player at (10, 10) facing UP → pivot = (8, 8) (UP overflow: -2, -2)
    // Blinky at (10, 12) → vector = (8-10, 8-12) = (-2, -4)
    // Inky target = pivot + vector = (8-2, 8-4) = (6, 4)
    const player = makePlayer(10, 10, 'UP');
    const blinky = makeGhost('blinky', 10, 12);
    expect(inkyTarget(player, blinky)).toEqual({ col: 6, row: 4 });
  });

  it('targets far away when blinky is at same position as player', () => {
    const player = makePlayer(10, 10, 'RIGHT');
    const blinky = makeGhost('blinky', 10, 10);
    // pivot = (12, 10), blinky = (10, 10) → vector = (2, 0)
    // target = (12+2, 10) = (14, 10)
    expect(inkyTarget(player, blinky)).toEqual({ col: 14, row: 10 });
  });
});

// ─── clydeTarget ─────────────────────────────────────────────────────────────

describe('clydeTarget', () => {
  it('chases player when distance > 8 tiles', () => {
    const player = makePlayer(20, 10);
    const clyde = makeGhost('clyde', 5, 10); // 15 tiles away
    expect(clydeTarget(player, clyde)).toEqual({ col: 20, row: 10 });
  });

  it('retreats to home corner when distance ≤ 8 tiles', () => {
    const player = makePlayer(10, 10);
    const clyde = makeGhost('clyde', 14, 10); // 4 tiles away
    expect(clydeTarget(player, clyde)).toEqual(GHOST_HOME_CORNERS.clyde);
  });

  it('uses home corner when exactly 8 tiles away', () => {
    const player = makePlayer(10, 10);
    const clyde = makeGhost('clyde', 18, 10); // exactly 8 tiles (distSq=64, NOT > 64)
    expect(clydeTarget(player, clyde)).toEqual(GHOST_HOME_CORNERS.clyde);
  });

  it('oscillates near the 8-tile boundary', () => {
    // When Clyde is 9 tiles away → chase
    const player = makePlayer(10, 10);
    const clydeClose = makeGhost('clyde', 19, 10); // 9 tiles
    expect(clydeTarget(player, clydeClose)).toEqual({ col: 10, row: 10 });

    // When Clyde is 8 tiles away → retreat
    const clydeAt8 = makeGhost('clyde', 18, 10); // 8 tiles
    expect(clydeTarget(player, clydeAt8)).toEqual(GHOST_HOME_CORNERS.clyde);
  });
});

// ─── ghostCanEnterTile ────────────────────────────────────────────────────────

describe('ghostCanEnterTile', () => {
  const modes: GhostMode[] = ['home', 'leaving', 'scatter', 'chase', 'frightened', 'eaten'];

  it.each(modes)('OPEN is walkable in %s mode', (mode) => {
    expect(ghostCanEnterTile(Tile.OPEN, mode)).toBe(true);
  });

  it.each(modes)('TUNNEL is walkable in %s mode', (mode) => {
    expect(ghostCanEnterTile(Tile.TUNNEL, mode)).toBe(true);
  });

  it.each(modes)('WALL is never walkable', (mode) => {
    expect(ghostCanEnterTile(Tile.WALL, mode)).toBe(false);
  });

  it('GHOST_DOOR only accessible in leaving/eaten modes', () => {
    expect(ghostCanEnterTile(Tile.GHOST_DOOR, 'leaving')).toBe(true);
    expect(ghostCanEnterTile(Tile.GHOST_DOOR, 'eaten')).toBe(true);
    expect(ghostCanEnterTile(Tile.GHOST_DOOR, 'scatter')).toBe(false);
    expect(ghostCanEnterTile(Tile.GHOST_DOOR, 'chase')).toBe(false);
    expect(ghostCanEnterTile(Tile.GHOST_DOOR, 'frightened')).toBe(false);
  });

  it('GHOST_HOUSE accessible in home/leaving/eaten modes', () => {
    expect(ghostCanEnterTile(Tile.GHOST_HOUSE, 'home')).toBe(true);
    expect(ghostCanEnterTile(Tile.GHOST_HOUSE, 'leaving')).toBe(true);
    expect(ghostCanEnterTile(Tile.GHOST_HOUSE, 'eaten')).toBe(true);
    expect(ghostCanEnterTile(Tile.GHOST_HOUSE, 'scatter')).toBe(false);
    expect(ghostCanEnterTile(Tile.GHOST_HOUSE, 'chase')).toBe(false);
    expect(ghostCanEnterTile(Tile.GHOST_HOUSE, 'frightened')).toBe(false);
  });
});

// ─── chooseBestDirection ─────────────────────────────────────────────────────

function openGrid29(): Tile[][] {
  return Array.from({ length: 29 }, () => new Array<Tile>(29).fill(Tile.OPEN));
}

describe('chooseBestDirection', () => {
  it('picks direction that minimises distance to target', () => {
    const grid = openGrid29();
    const current = { col: 5, row: 5 };
    const target = { col: 8, row: 5 }; // directly to the right
    const dir = chooseBestDirection(current, 'UP', target, grid, 'chase');
    expect(dir).toBe('RIGHT');
  });

  it('never reverses current direction (no U-turns)', () => {
    const grid = openGrid29();
    // Target is directly behind us, but we can't reverse
    const current = { col: 5, row: 5 };
    const target = { col: 3, row: 5 }; // to the left, but we're going right
    const dir = chooseBestDirection(current, 'RIGHT', target, grid, 'chase');
    // Should NOT be LEFT (the reverse)
    expect(dir).not.toBe('LEFT');
  });

  it('applies tiebreaker UP > LEFT > DOWN > RIGHT', () => {
    const grid = openGrid29();
    const current = { col: 5, row: 5 };
    // Target is equidistant in UP and DOWN
    const target = { col: 5, row: 5 }; // same tile
    // UP and DOWN are both equidistant; UP should win
    const dir = chooseBestDirection(current, 'LEFT', target, grid, 'chase');
    // UP wins over DOWN in tiebreaker (both equidistant from same tile)
    expect(dir).toBe('UP');
  });

  it('avoids wall tiles', () => {
    const grid = openGrid29();
    grid[5][6] = Tile.WALL; // RIGHT is walled
    // Current direction UP; reverse (DOWN) is excluded. Valid: UP and LEFT.
    // LEFT leads to (4,5): distSq to target (8,5) = (8-4)^2 + 0 = 16
    // UP leads to (5,4):   distSq to target (8,5) = (8-5)^2 + (5-4)^2 = 9+1 = 10
    // UP is closer → UP wins
    const current = { col: 5, row: 5 };
    const target  = { col: 8, row: 5 };
    const dir = chooseBestDirection(current, 'UP', target, grid, 'chase');
    expect(dir).not.toBe('RIGHT'); // wall
    expect(dir).not.toBe('DOWN');  // reverse
    expect(dir).toBe('UP');        // closest to target among valid options
  });

  it('never enters GHOST_HOUSE in scatter mode', () => {
    const grid = openGrid29();
    grid[6][5] = Tile.GHOST_HOUSE;
    const current = { col: 5, row: 5 };
    const target = { col: 5, row: 10 }; // target is below ghost house
    const dir = chooseBestDirection(current, 'LEFT', target, grid, 'scatter');
    expect(dir).not.toBe('DOWN'); // DOWN leads into ghost house
  });

  it('can enter GHOST_HOUSE in eaten mode', () => {
    const grid = openGrid29();
    grid[6][5] = Tile.GHOST_HOUSE;
    grid[6][4] = Tile.WALL;
    grid[6][6] = Tile.WALL;
    // Only option is DOWN (into ghost house) or UP
    const current = { col: 5, row: 5 };
    const target = { col: 5, row: 10 }; // deep inside house
    const dir = chooseBestDirection(current, 'LEFT', target, grid, 'eaten');
    expect(dir).toBe('DOWN');
  });

  it('allows reversal when completely stuck (no other option)', () => {
    const grid = openGrid29();
    // Block all directions except back
    grid[4][5] = Tile.WALL; // UP
    grid[6][5] = Tile.WALL; // DOWN
    grid[5][6] = Tile.WALL; // RIGHT
    const current = { col: 5, row: 5 };
    const target = { col: 0, row: 0 };
    const dir = chooseBestDirection(current, 'RIGHT', target, grid, 'chase');
    expect(dir).toBe('LEFT'); // only option is reverse
  });
});

// ─── chooseRandomDirection ────────────────────────────────────────────────────

describe('chooseRandomDirection', () => {
  it('never returns a U-turn', () => {
    const grid = openGrid29();
    const current = { col: 5, row: 5 };
    // Run many times to catch randomness
    for (let i = 0; i < 100; i++) {
      const dir = chooseRandomDirection(current, 'RIGHT', grid);
      expect(dir).not.toBe('LEFT');
    }
  });

  it('never picks a wall direction', () => {
    const grid = openGrid29();
    grid[5][6] = Tile.WALL; // RIGHT is blocked
    grid[4][5] = Tile.WALL; // UP is blocked
    const current = { col: 5, row: 5 };
    for (let i = 0; i < 100; i++) {
      const dir = chooseRandomDirection(current, 'DOWN', grid);
      expect(dir).not.toBe('RIGHT');
      expect(dir).not.toBe('UP');
    }
  });

  it('uses provided rng function', () => {
    const grid = openGrid29();
    const current = { col: 5, row: 5 };
    // rng always returns 0 → first valid direction
    const dir1 = chooseRandomDirection(current, 'DOWN', grid, () => 0);
    // rng always returns 0.99 → last valid direction
    const dir2 = chooseRandomDirection(current, 'DOWN', grid, () => 0.99);
    // Both should be valid (non-reverse, non-wall)
    expect(['UP', 'LEFT', 'RIGHT']).toContain(dir1);
    expect(['UP', 'LEFT', 'RIGHT']).toContain(dir2);
  });
});

// ─── GHOST_HOME_CORNERS ───────────────────────────────────────────────────────

describe('GHOST_HOME_CORNERS', () => {
  it('all four ghosts have unique corners', () => {
    const corners = Object.values(GHOST_HOME_CORNERS);
    const keys = corners.map(c => `${c.col},${c.row}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(4);
  });

  it('blinky and pinky are in top half, inky and clyde in bottom', () => {
    expect(GHOST_HOME_CORNERS.blinky.row).toBeLessThan(14);
    expect(GHOST_HOME_CORNERS.pinky.row).toBeLessThan(14);
    expect(GHOST_HOME_CORNERS.inky.row).toBeGreaterThan(14);
    expect(GHOST_HOME_CORNERS.clyde.row).toBeGreaterThan(14);
  });
});
