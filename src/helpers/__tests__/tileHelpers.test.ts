import {
  pixelToTile,
  tileToPixel,
  stepTile,
  reverseDirection,
  wrapTile,
  getTileAt,
  isWalkable,
  euclideanDistance,
  manhattanDistance,
  computeGrid,
  bfsPath,
  wrapPosition,
  TILE_SIZE,
  BOARD_TILES,
  BOARD_SIZE,
} from '../tileHelpers';
import { Tile } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('TILE_SIZE is 28', () => expect(TILE_SIZE).toBe(28));
  it('BOARD_TILES is 29', () => expect(BOARD_TILES).toBe(29));
  it('BOARD_SIZE is 812', () => expect(BOARD_SIZE).toBe(812));
});

// ─── pixelToTile ─────────────────────────────────────────────────────────────

describe('pixelToTile', () => {
  it('converts tile-center pixel to correct tile', () => {
    expect(pixelToTile({ x: 14, y: 14 })).toEqual({ col: 0, row: 0 });
    expect(pixelToTile({ x: 42, y: 14 })).toEqual({ col: 1, row: 0 });
    expect(pixelToTile({ x: 14, y: 42 })).toEqual({ col: 0, row: 1 });
  });

  it('converts exact tile-start pixel', () => {
    expect(pixelToTile({ x: 0, y: 0 })).toEqual({ col: 0, row: 0 });
    expect(pixelToTile({ x: 28, y: 0 })).toEqual({ col: 1, row: 0 });
  });

  it('converts pixel just inside tile boundary', () => {
    expect(pixelToTile({ x: 27, y: 0 })).toEqual({ col: 0, row: 0 });
    expect(pixelToTile({ x: 55, y: 0 })).toEqual({ col: 1, row: 0 });
  });

  it('converts player default start position', () => {
    // Player starts at col=14, row=22 → pixel center: x=406, y=630
    expect(pixelToTile({ x: 406, y: 630 })).toEqual({ col: 14, row: 22 });
  });
});

// ─── tileToPixel ─────────────────────────────────────────────────────────────

describe('tileToPixel', () => {
  it('returns the center pixel of a tile', () => {
    expect(tileToPixel({ col: 0, row: 0 })).toEqual({ x: 14, y: 14 });
    expect(tileToPixel({ col: 1, row: 0 })).toEqual({ x: 42, y: 14 });
    expect(tileToPixel({ col: 0, row: 1 })).toEqual({ x: 14, y: 42 });
  });

  it('round-trips with pixelToTile', () => {
    for (let col = 0; col < 29; col++) {
      for (let row = 0; row < 29; row++) {
        const pixel = tileToPixel({ col, row });
        expect(pixelToTile(pixel)).toEqual({ col, row });
      }
    }
  });

  it('tile centers are always integers', () => {
    for (let col = 0; col < 29; col++) {
      const pixel = tileToPixel({ col, row: 0 });
      expect(Number.isInteger(pixel.x)).toBe(true);
      expect(Number.isInteger(pixel.y)).toBe(true);
    }
  });
});

// ─── stepTile ────────────────────────────────────────────────────────────────

describe('stepTile', () => {
  const origin = { col: 5, row: 5 };

  it('UP decreases row', () => expect(stepTile(origin, 'UP')).toEqual({ col: 5, row: 4 }));
  it('DOWN increases row', () => expect(stepTile(origin, 'DOWN')).toEqual({ col: 5, row: 6 }));
  it('LEFT decreases col', () => expect(stepTile(origin, 'LEFT')).toEqual({ col: 4, row: 5 }));
  it('RIGHT increases col', () => expect(stepTile(origin, 'RIGHT')).toEqual({ col: 6, row: 5 }));
});

// ─── reverseDirection ────────────────────────────────────────────────────────

describe('reverseDirection', () => {
  it('UP ↔ DOWN', () => {
    expect(reverseDirection('UP')).toBe('DOWN');
    expect(reverseDirection('DOWN')).toBe('UP');
  });
  it('LEFT ↔ RIGHT', () => {
    expect(reverseDirection('LEFT')).toBe('RIGHT');
    expect(reverseDirection('RIGHT')).toBe('LEFT');
  });
});

// ─── wrapTile ────────────────────────────────────────────────────────────────

describe('wrapTile', () => {
  it('wraps negative col to right edge', () => {
    expect(wrapTile({ col: -1, row: 14 })).toEqual({ col: 28, row: 14 });
  });
  it('wraps col beyond board to left edge', () => {
    expect(wrapTile({ col: 29, row: 14 })).toEqual({ col: 0, row: 14 });
  });
  it('leaves in-bounds tiles unchanged', () => {
    expect(wrapTile({ col: 14, row: 14 })).toEqual({ col: 14, row: 14 });
  });
  it('wraps both axes simultaneously', () => {
    expect(wrapTile({ col: -1, row: -1 })).toEqual({ col: 28, row: 28 });
  });
});

// ─── isWalkable ───────────────────────────────────────────────────────────────

describe('isWalkable', () => {
  it('OPEN is walkable for everyone', () => {
    expect(isWalkable(Tile.OPEN, false)).toBe(true);
    expect(isWalkable(Tile.OPEN, true)).toBe(true);
  });
  it('TUNNEL is walkable for everyone', () => {
    expect(isWalkable(Tile.TUNNEL, false)).toBe(true);
    expect(isWalkable(Tile.TUNNEL, true)).toBe(true);
  });
  it('WALL is walkable for no one', () => {
    expect(isWalkable(Tile.WALL, false)).toBe(false);
    expect(isWalkable(Tile.WALL, true)).toBe(false);
  });
  it('GHOST_HOUSE is only walkable for ghosts', () => {
    expect(isWalkable(Tile.GHOST_HOUSE, false)).toBe(false);
    expect(isWalkable(Tile.GHOST_HOUSE, true)).toBe(true);
  });
  it('GHOST_DOOR is only walkable for ghosts', () => {
    expect(isWalkable(Tile.GHOST_DOOR, false)).toBe(false);
    expect(isWalkable(Tile.GHOST_DOOR, true)).toBe(true);
  });
});

// ─── euclideanDistance ────────────────────────────────────────────────────────

describe('euclideanDistance', () => {
  it('same tile is zero', () => {
    expect(euclideanDistance({ col: 5, row: 5 }, { col: 5, row: 5 })).toBe(0);
  });
  it('adjacent tile is 1', () => {
    expect(euclideanDistance({ col: 5, row: 5 }, { col: 6, row: 5 })).toBe(1);
  });
  it('diagonal is √2', () => {
    expect(euclideanDistance({ col: 0, row: 0 }, { col: 1, row: 1 })).toBeCloseTo(Math.SQRT2);
  });
  it('3-4-5 triangle', () => {
    expect(euclideanDistance({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(5);
  });
});

// ─── manhattanDistance ────────────────────────────────────────────────────────

describe('manhattanDistance', () => {
  it('same tile is zero', () => {
    expect(manhattanDistance({ col: 5, row: 5 }, { col: 5, row: 5 })).toBe(0);
  });
  it('adjacent tile is 1', () => {
    expect(manhattanDistance({ col: 5, row: 5 }, { col: 6, row: 5 })).toBe(1);
  });
  it('3,4 apart is 7', () => {
    expect(manhattanDistance({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(7);
  });
});

// ─── computeGrid ─────────────────────────────────────────────────────────────

describe('computeGrid', () => {
  const simpleGhostHouse = {
    interiorCol: 5,
    interiorRow: 5,
    interiorWidth: 3,
    interiorHeight: 2,
  };
  const doorTiles = [{ col: 6, row: 4 }];
  const tunnelRow = 14;

  it('starts as all OPEN then applies walls', () => {
    const walls = [[0, 0, 2, 1]] as [number, number, number, number][];
    const grid = computeGrid(walls, simpleGhostHouse, doorTiles, tunnelRow);
    expect(grid[0][0]).toBe(Tile.WALL);
    expect(grid[0][1]).toBe(Tile.WALL);
    expect(grid[0][2]).toBe(Tile.OPEN);
  });

  it('marks ghost house interior as GHOST_HOUSE', () => {
    const grid = computeGrid([], simpleGhostHouse, doorTiles, tunnelRow);
    expect(grid[5][5]).toBe(Tile.GHOST_HOUSE);
    expect(grid[5][6]).toBe(Tile.GHOST_HOUSE);
    expect(grid[5][7]).toBe(Tile.GHOST_HOUSE);
    expect(grid[6][5]).toBe(Tile.GHOST_HOUSE);
  });

  it('ghost house does not affect surrounding tiles', () => {
    const grid = computeGrid([], simpleGhostHouse, doorTiles, tunnelRow);
    // Row 4 col 6 is the door tile; check a tile NOT in the house and NOT the door
    expect(grid[4][4]).toBe(Tile.OPEN);  // left of door row, outside house
    expect(grid[7][6]).toBe(Tile.OPEN);  // row below house interior
    expect(grid[5][4]).toBe(Tile.OPEN);  // left of house interior
  });

  it('marks ghost door tiles as GHOST_DOOR overriding wall', () => {
    const walls = [[4, 4, 5, 1]] as [number, number, number, number][];
    const grid = computeGrid(walls, simpleGhostHouse, doorTiles, tunnelRow);
    expect(grid[4][5]).toBe(Tile.WALL);   // wall before door
    expect(grid[4][6]).toBe(Tile.GHOST_DOOR); // door tile
    expect(grid[4][7]).toBe(Tile.WALL);   // wall after door
  });

  it('marks open cells on tunnel row as TUNNEL', () => {
    const grid = computeGrid([], simpleGhostHouse, doorTiles, tunnelRow);
    expect(grid[tunnelRow][0]).toBe(Tile.TUNNEL);
    expect(grid[tunnelRow][28]).toBe(Tile.TUNNEL);
  });

  it('does not mark wall cells on tunnel row as TUNNEL', () => {
    const walls = [[0, tunnelRow, 2, 1]] as [number, number, number, number][];
    const grid = computeGrid(walls, simpleGhostHouse, doorTiles, tunnelRow);
    expect(grid[tunnelRow][0]).toBe(Tile.WALL);
    expect(grid[tunnelRow][2]).toBe(Tile.TUNNEL);
  });

  it('ignores out-of-bounds wall definitions (negative x)', () => {
    const walls = [[-1, 0, 3, 1]] as [number, number, number, number][];
    // Should not throw, negative col is clamped
    expect(() => computeGrid(walls, simpleGhostHouse, doorTiles, tunnelRow)).not.toThrow();
    const grid = computeGrid(walls, simpleGhostHouse, doorTiles, tunnelRow);
    expect(grid[0][0]).toBe(Tile.WALL);   // col 0 and 1 should be wall
    expect(grid[0][1]).toBe(Tile.WALL);
  });
});

// ─── bfsPath ─────────────────────────────────────────────────────────────────

describe('bfsPath', () => {
  /** Build a simple open grid for path testing */
  function openGrid(): Tile[][] {
    return Array.from({ length: 29 }, () => new Array<Tile>(29).fill(Tile.OPEN));
  }

  it('returns empty path when already at destination', () => {
    const grid = openGrid();
    expect(bfsPath({ col: 5, row: 5 }, { col: 5, row: 5 }, grid)).toEqual([]);
  });

  it('finds single-step path', () => {
    const grid = openGrid();
    const path = bfsPath({ col: 5, row: 5 }, { col: 6, row: 5 }, grid);
    expect(path).toEqual(['RIGHT']);
  });

  it('finds path around a wall', () => {
    const grid = openGrid();
    // Block direct right path: wall at (6,5)
    grid[5][6] = Tile.WALL;
    const path = bfsPath({ col: 5, row: 5 }, { col: 7, row: 5 }, grid);
    // Must go around (up or down then right)
    expect(path.length).toBeGreaterThan(2);
    // Following the path should reach destination
    let tile = { col: 5, row: 5 };
    for (const dir of path) {
      tile = wrapTile(stepTile(tile, dir));
    }
    expect(tile).toEqual({ col: 7, row: 5 });
  });

  it('path actually leads to destination', () => {
    const grid = openGrid();
    // Some walls in the way
    grid[5][6] = Tile.WALL;
    grid[6][6] = Tile.WALL;
    const from = { col: 5, row: 5 };
    const to = { col: 8, row: 7 };
    const path = bfsPath(from, to, grid);

    let tile = { ...from };
    for (const dir of path) {
      tile = wrapTile(stepTile(tile, dir));
    }
    expect(tile).toEqual(to);
  });

  it('returns empty path when destination is unreachable', () => {
    // Fully enclose the start tile (all 4 neighbours are walls)
    const grid = openGrid();
    grid[4][5] = Tile.WALL; // UP
    grid[6][5] = Tile.WALL; // DOWN
    grid[5][4] = Tile.WALL; // LEFT
    grid[5][6] = Tile.WALL; // RIGHT
    const path = bfsPath({ col: 5, row: 5 }, { col: 10, row: 10 }, grid);
    expect(path).toEqual([]);
  });
});

// ─── wrapPosition ────────────────────────────────────────────────────────────

describe('wrapPosition', () => {
  it('wraps x beyond right edge to left', () => {
    const pos = wrapPosition({ x: 812, y: 100 });
    expect(pos.x).toBe(0);
  });
  it('wraps negative x to right edge', () => {
    const pos = wrapPosition({ x: -1, y: 100 });
    expect(pos.x).toBe(811);
  });
  it('wraps y similarly', () => {
    expect(wrapPosition({ x: 100, y: 812 }).y).toBe(0);
    expect(wrapPosition({ x: 100, y: -1 }).y).toBe(811);
  });
  it('leaves in-bounds positions unchanged', () => {
    expect(wrapPosition({ x: 400, y: 400 })).toEqual({ x: 400, y: 400 });
  });
});
