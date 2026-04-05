import {
  moveCharacter,
  canChangeDirection,
  checkAndTransformIntoBounds,
  getNextCharacterPositionForDirection,
  getNextCharacterRailPosition,
} from '../movementHelpers';
import { computeGrid, tileToPixel, pixelToTile, TILE_SIZE } from '../tileHelpers';
import { Tile } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Open 29×29 grid with no walls */
function openGrid(): Tile[][] {
  return Array.from({ length: 29 }, () => new Array<Tile>(29).fill(Tile.OPEN));
}

/** Grid with a single wall tile at (wallCol, wallRow) */
function gridWithWall(wallCol: number, wallRow: number): Tile[][] {
  const grid = openGrid();
  grid[wallRow][wallCol] = Tile.WALL;
  return grid;
}

/** Grid with a wall rectangle */
function gridWithWallRect(x0: number, y0: number, w: number, h: number): Tile[][] {
  const grid = openGrid();
  for (let row = y0; row < y0 + h; row++) {
    for (let col = x0; col < x0 + w; col++) {
      grid[row][col] = Tile.WALL;
    }
  }
  return grid;
}

// ─── Basic movement ───────────────────────────────────────────────────────────

describe('moveCharacter – basic movement', () => {
  it('moves right by speed×deltaMs pixels', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 5, row: 5 });
    const result = moveCharacter(pos, 'RIGHT', 100, 100, grid);
    expect(result.position.x).toBeCloseTo(pos.x + 10);
    expect(result.blocked).toBe(false);
  });

  it('moves left by speed×deltaMs pixels', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 5, row: 5 });
    const result = moveCharacter(pos, 'LEFT', 100, 100, grid);
    expect(result.position.x).toBeCloseTo(pos.x - 10);
    expect(result.blocked).toBe(false);
  });

  it('moves up by speed×deltaMs pixels', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 5, row: 5 });
    const result = moveCharacter(pos, 'UP', 100, 100, grid);
    expect(result.position.y).toBeCloseTo(pos.y - 10);
    expect(result.blocked).toBe(false);
  });

  it('moves down by speed×deltaMs pixels', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 5, row: 5 });
    const result = moveCharacter(pos, 'DOWN', 100, 100, grid);
    expect(result.position.y).toBeCloseTo(pos.y + 10);
    expect(result.blocked).toBe(false);
  });

  it('zero delta results in no movement', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 5, row: 5 });
    const result = moveCharacter(pos, 'RIGHT', 100, 0, grid);
    expect(result.position).toEqual(pos);
    expect(result.blocked).toBe(false);
  });

  it('snaps perpendicular axis to tile rail', () => {
    const grid = openGrid();
    // Position slightly off the horizontal rail (y not at tile center)
    const offRail = { x: tileToPixel({ col: 5, row: 5 }).x, y: tileToPixel({ col: 5, row: 5 }).y + 3 };
    const result = moveCharacter(offRail, 'RIGHT', 100, 100, grid);
    // Y should be snapped to tile center
    expect(result.position.y).toBe(tileToPixel({ col: 5, row: 5 }).y);
  });
});

// ─── Wall collision ───────────────────────────────────────────────────────────

describe('moveCharacter – wall collision', () => {
  it('stops at tile center before wall – never enters wall tile', () => {
    // Player at col 5, wall at col 6 → can't move right
    const grid = gridWithWall(6, 5);
    const pos = tileToPixel({ col: 5, row: 5 });
    const result = moveCharacter(pos, 'RIGHT', 1000, 100, grid);

    expect(result.blocked).toBe(true);
    // Must stop at col 5 tile center, not inside the wall
    expect(result.position.x).toBe(tileToPixel({ col: 5, row: 5 }).x);
    // Player is NOT in wall tile
    const finalTile = pixelToTile(result.position);
    expect(finalTile).toEqual({ col: 5, row: 5 });
  });

  it('stop position is always an integer when wall is reached (no float precision issues)', () => {
    // Wall at col 6 – close enough to reach with this speed/delta
    const grid = gridWithWall(6, 5);
    const pos = tileToPixel({ col: 5, row: 5 });
    // Use an odd speed to force non-integer intermediate positions
    const result = moveCharacter(pos, 'RIGHT', 123.456, 789, grid);

    expect(result.blocked).toBe(true);
    // Stop coordinate must be the tile center: always an integer (e.g. 154)
    expect(Number.isInteger(result.position.x)).toBe(true);
    expect(Number.isInteger(result.position.y)).toBe(true);
  });

  it('can move across multiple open tiles in one frame', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 0, row: 5 });
    // Move 5 tiles at once
    const result = moveCharacter(pos, 'RIGHT', TILE_SIZE * 5, 1000, grid);
    expect(result.blocked).toBe(false);
    expect(result.position.x).toBeCloseTo(tileToPixel({ col: 5, row: 5 }).x);
  });

  it('stops at first wall when multiple walls present', () => {
    // Walls at col 7 and col 10
    const grid = gridWithWall(7, 5);
    grid[5][10] = Tile.WALL;
    const pos = tileToPixel({ col: 5, row: 5 });
    const result = moveCharacter(pos, 'RIGHT', 1000, 1000, grid);

    expect(result.blocked).toBe(true);
    expect(pixelToTile(result.position)).toEqual({ col: 6, row: 5 });
  });

  it('handles wall directly ahead: blocks when movement reaches boundary', () => {
    const pos = tileToPixel({ col: 5, row: 5 });
    const grid = gridWithWall(6, 5);
    // Use high enough speed to reach the tile boundary in one frame
    const result = moveCharacter(pos, 'RIGHT', 1000, 100, grid);
    expect(result.blocked).toBe(true);
    expect(result.position.x).toBe(pos.x); // stops at current tile center
  });

  it('wall sticking regression: player never enters wall tile over 60 frames', () => {
    // Simulate the wall-sticking bug: player repeatedly tries to move into wall.
    // NOTE: in the real game, direction is cleared (COLLIDED action) when blocked,
    // so the player stops. This test verifies the core invariant: position is
    // NEVER inside a wall tile, regardless of how many times moveCharacter is called.
    const grid = gridWithWall(6, 5);
    let pos = tileToPixel({ col: 5, row: 5 });

    for (let frame = 0; frame < 60; frame++) {
      const result = moveCharacter(pos, 'RIGHT', 120, 16, grid);
      pos = result.position;
      const tile = pixelToTile(pos);
      expect(grid[tile.row][tile.col]).not.toBe(Tile.WALL);
    }
  });

  it('wall sticking regression: player approaching wall from far away', () => {
    const grid = gridWithWall(14, 5);
    let pos = tileToPixel({ col: 5, row: 5 });

    // Approach the wall at full game speed
    for (let frame = 0; frame < 120; frame++) {
      const result = moveCharacter(pos, 'RIGHT', 120, 16, grid);
      pos = result.position;
      const tile = pixelToTile(pos);
      expect(grid[tile.row][tile.col]).not.toBe(Tile.WALL);
    }
  });
});

// ─── Board wrapping ───────────────────────────────────────────────────────────

describe('moveCharacter – board wrapping', () => {
  it('wraps from right edge to left edge', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 28, row: 14 });
    const result = moveCharacter(pos, 'RIGHT', 1000, 100, grid);
    expect(result.position.x).toBeGreaterThanOrEqual(0);
    expect(result.position.x).toBeLessThan(812);
  });

  it('wraps from left edge to right edge', () => {
    const grid = openGrid();
    const pos = tileToPixel({ col: 0, row: 14 });
    const result = moveCharacter(pos, 'LEFT', 1000, 100, grid);
    expect(result.position.x).toBeGreaterThanOrEqual(0);
    expect(result.position.x).toBeLessThan(812);
  });
});

// ─── canChangeDirection ───────────────────────────────────────────────────────

describe('canChangeDirection', () => {
  it('allows turn when at tile center and path is clear', () => {
    const grid = openGrid();
    const center = tileToPixel({ col: 5, row: 5 });
    expect(canChangeDirection(center, 'RIGHT', grid)).toBe(true);
  });

  it('blocks turn when wall is in desired direction', () => {
    const grid = gridWithWall(6, 5);
    const center = tileToPixel({ col: 5, row: 5 });
    expect(canChangeDirection(center, 'RIGHT', grid)).toBe(false);
  });

  it('blocks turn when far from tile center', () => {
    const grid = openGrid();
    // Offset significantly from tile center
    const offCenter = { x: tileToPixel({ col: 5, row: 5 }).x + 15, y: tileToPixel({ col: 5, row: 5 }).y };
    expect(canChangeDirection(offCenter, 'UP', grid)).toBe(false);
  });

  it('allows turn when slightly off center (within snap threshold)', () => {
    const grid = openGrid();
    const slightlyOff = {
      x: tileToPixel({ col: 5, row: 5 }).x + 5,
      y: tileToPixel({ col: 5, row: 5 }).y,
    };
    expect(canChangeDirection(slightlyOff, 'UP', grid)).toBe(true);
  });

  it('returns false for null direction', () => {
    const grid = openGrid();
    const center = tileToPixel({ col: 5, row: 5 });
    expect(canChangeDirection(center, null, grid)).toBe(false);
  });

  it('blocks ghost from entering GHOST_HOUSE in player mode', () => {
    const grid = openGrid();
    grid[6][5] = Tile.GHOST_HOUSE;
    const center = tileToPixel({ col: 5, row: 5 });
    expect(canChangeDirection(center, 'DOWN', grid, false)).toBe(false);
  });

  it('allows ghost to enter GHOST_HOUSE', () => {
    const grid = openGrid();
    grid[6][5] = Tile.GHOST_HOUSE;
    const center = tileToPixel({ col: 5, row: 5 });
    expect(canChangeDirection(center, 'DOWN', grid, true)).toBe(true);
  });
});

// ─── Legacy wrappers ──────────────────────────────────────────────────────────

describe('checkAndTransformIntoBounds (legacy)', () => {
  it('wraps position that is beyond the right edge', () => {
    const pos = { x: 820, y: 100 };
    checkAndTransformIntoBounds(pos);
    expect(pos.x).toBe(8);
  });

  it('wraps negative x', () => {
    const pos = { x: -5, y: 100 };
    checkAndTransformIntoBounds(pos);
    expect(pos.x).toBe(807);
  });
});

describe('getNextCharacterPositionForDirection (legacy)', () => {
  it('moves right by speed×duration (with rail snap)', () => {
    const character = { position: tileToPixel({ col: 1, row: 1 }), speed: 28 };
    const result = getNextCharacterPositionForDirection(character, 'RIGHT', 1);
    expect(result.x).toBe(tileToPixel({ col: 1, row: 1 }).x + 28);
  });
});

describe('getNextCharacterRailPosition (legacy)', () => {
  it('stops at wall and reports blocked', () => {
    const character = {
      position: tileToPixel({ col: 1, row: 1 }),
      speed: 1000,
    };
    const walls: [number, number, number, number][] = [[2, 0, 1, 29]]; // wall at col 2
    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, walls);

    expect(result.blocked).toBe(true);
    expect(pixelToTile(result.position).col).toBe(1);
  });

  it('moves freely with empty walls', () => {
    const character = {
      position: tileToPixel({ col: 1, row: 1 }),
      speed: 28,
    };
    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, []);
    expect(result.blocked).toBe(false);
  });
});
