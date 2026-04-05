import { Tile, Position, TileCoord, Direction, WallDef, GhostHouseArea } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const BOARD_TILES = 29;
export const TILE_SIZE = 28;
export const BOARD_SIZE = BOARD_TILES * TILE_SIZE; // 812

// ─── Coordinate conversions ───────────────────────────────────────────────────

/** Convert pixel position to the tile that contains it */
export function pixelToTile(pos: Position): TileCoord {
  return {
    col: Math.floor(pos.x / TILE_SIZE),
    row: Math.floor(pos.y / TILE_SIZE),
  };
}

/** Returns the pixel center of a tile */
export function tileToPixel(tile: TileCoord): Position {
  return {
    x: tile.col * TILE_SIZE + TILE_SIZE / 2,
    y: tile.row * TILE_SIZE + TILE_SIZE / 2,
  };
}

// ─── Direction utils ──────────────────────────────────────────────────────────

export function stepTile(tile: TileCoord, direction: Direction): TileCoord {
  switch (direction) {
    case 'UP':    return { col: tile.col,     row: tile.row - 1 };
    case 'DOWN':  return { col: tile.col,     row: tile.row + 1 };
    case 'LEFT':  return { col: tile.col - 1, row: tile.row     };
    case 'RIGHT': return { col: tile.col + 1, row: tile.row     };
  }
}

export function reverseDirection(dir: Direction): Direction {
  switch (dir) {
    case 'UP':    return 'DOWN';
    case 'DOWN':  return 'UP';
    case 'LEFT':  return 'RIGHT';
    case 'RIGHT': return 'LEFT';
  }
}

export const ALL_DIRECTIONS: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];

// ─── Grid access ─────────────────────────────────────────────────────────────

/** Wraps tile coordinates to board bounds (handles tunnel transitions) */
export function wrapTile(tile: TileCoord): TileCoord {
  return {
    col: ((tile.col % BOARD_TILES) + BOARD_TILES) % BOARD_TILES,
    row: ((tile.row % BOARD_TILES) + BOARD_TILES) % BOARD_TILES,
  };
}

/** Safe grid read – returns WALL for out-of-bounds unless wrapped */
export function getTileAt(grid: Tile[][], tile: TileCoord): Tile {
  const wrapped = wrapTile(tile);
  return grid[wrapped.row]?.[wrapped.col] ?? Tile.WALL;
}

/**
 * Returns true if the tile type is walkable for the given actor.
 * Players cannot enter GHOST_HOUSE or GHOST_DOOR.
 * Ghosts can pass through GHOST_DOOR when leaving/entering (caller checks mode).
 */
export function isWalkable(tileType: Tile, isGhost = false): boolean {
  switch (tileType) {
    case Tile.OPEN:
    case Tile.TUNNEL:
      return true;
    case Tile.GHOST_DOOR:
    case Tile.GHOST_HOUSE:
      return isGhost;
    case Tile.WALL:
    default:
      return false;
  }
}

// ─── Distance ─────────────────────────────────────────────────────────────────

export function euclideanDistanceSq(a: TileCoord, b: TileCoord): number {
  const dx = a.col - b.col;
  const dy = a.row - b.row;
  return dx * dx + dy * dy;
}

export function euclideanDistance(a: TileCoord, b: TileCoord): number {
  return Math.sqrt(euclideanDistanceSq(a, b));
}

export function manhattanDistance(a: TileCoord, b: TileCoord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

// ─── Grid construction ────────────────────────────────────────────────────────

/**
 * Builds a 29×29 Tile[][] from level definition data.
 * Priority: WALL < GHOST_HOUSE < GHOST_DOOR < TUNNEL
 */
export function computeGrid(
  walls: WallDef[],
  ghostHouseArea: GhostHouseArea,
  ghostDoorTiles: TileCoord[],
  tunnelRow: number,
): Tile[][] {
  const grid: Tile[][] = Array.from({ length: BOARD_TILES }, () =>
    new Array<Tile>(BOARD_TILES).fill(Tile.OPEN),
  );

  // 1. Apply wall rectangles
  for (const [x0, y0, w, h] of walls) {
    for (let row = y0; row < y0 + h; row++) {
      for (let col = x0; col < x0 + w; col++) {
        if (col >= 0 && col < BOARD_TILES && row >= 0 && row < BOARD_TILES) {
          grid[row][col] = Tile.WALL;
        }
      }
    }
  }

  // 2. Mark ghost house interior (overrides walls inside house bounds)
  const { interiorCol, interiorRow, interiorWidth, interiorHeight } = ghostHouseArea;
  for (let row = interiorRow; row < interiorRow + interiorHeight; row++) {
    for (let col = interiorCol; col < interiorCol + interiorWidth; col++) {
      if (col >= 0 && col < BOARD_TILES && row >= 0 && row < BOARD_TILES) {
        grid[row][col] = Tile.GHOST_HOUSE;
      }
    }
  }

  // 3. Mark ghost door tiles (overrides wall at house opening)
  for (const door of ghostDoorTiles) {
    if (door.col >= 0 && door.col < BOARD_TILES && door.row >= 0 && door.row < BOARD_TILES) {
      grid[door.row][door.col] = Tile.GHOST_DOOR;
    }
  }

  // 4. Mark open tiles on tunnel row as TUNNEL
  for (let col = 0; col < BOARD_TILES; col++) {
    if (grid[tunnelRow][col] === Tile.OPEN) {
      grid[tunnelRow][col] = Tile.TUNNEL;
    }
  }

  return grid;
}

// ─── BFS pathfinding ──────────────────────────────────────────────────────────

/**
 * BFS from `from` to `to`. Used by eaten ghosts to navigate back to the house.
 * Returns an ordered list of directions to follow.
 */
export function bfsPath(
  from: TileCoord,
  to: TileCoord,
  grid: Tile[][],
): Direction[] {
  const key = (t: TileCoord) => `${t.col},${t.row}`;
  const startKey = key(from);
  const goalKey = key(to);

  if (startKey === goalKey) return [];

  const queue: Array<{ tile: TileCoord; path: Direction[] }> = [
    { tile: from, path: [] },
  ];
  const visited = new Set<string>([startKey]);

  while (queue.length > 0) {
    const { tile, path } = queue.shift()!;

    for (const dir of ALL_DIRECTIONS) {
      const next = wrapTile(stepTile(tile, dir));
      const nextKey = key(next);

      if (nextKey === goalKey) {
        return [...path, dir];
      }

      if (!visited.has(nextKey)) {
        const tileType = getTileAt(grid, next);
        // Eaten ghosts can pass through doors and house
        if (tileType !== Tile.WALL) {
          visited.add(nextKey);
          queue.push({ tile: next, path: [...path, dir] });
        }
      }
    }
  }

  return []; // unreachable
}

// ─── Position wrapping ────────────────────────────────────────────────────────

/** Wraps pixel position to board bounds (handles tunnel exit/entry) */
export function wrapPosition(pos: Position): Position {
  return {
    x: ((pos.x % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE,
    y: ((pos.y % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE,
  };
}
