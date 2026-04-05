// ─── Primitives ───────────────────────────────────────────────────────────────

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GhostId = 'blinky' | 'pinky' | 'inky' | 'clyde';

/**
 * 'home'      – bouncing inside the ghost house waiting to be released
 * 'leaving'   – moving from house interior up to the door tile
 * 'scatter'   – moving toward home corner (circling)
 * 'chase'     – using personality-based targeting to pursue player
 * 'frightened'– blue, moves randomly, can be eaten
 * 'eaten'     – eyes only, moving back to ghost house via BFS path
 */
export type GhostMode = 'home' | 'leaving' | 'scatter' | 'chase' | 'frightened' | 'eaten';

// ─── Tile Grid ────────────────────────────────────────────────────────────────

export enum Tile {
  OPEN = 0,
  WALL = 1,
  GHOST_HOUSE = 2, // only ghosts may enter; acts as wall for player
  GHOST_DOOR = 3,  // ghosts pass through when leaving/entering house
  TUNNEL = 4,      // walkable; ghosts move at reduced speed here
}

// ─── Coordinates ──────────────────────────────────────────────────────────────

export interface Position {
  x: number; // pixel x (0–812)
  y: number; // pixel y (0–812)
}

export interface TileCoord {
  col: number; // 0–28
  row: number; // 0–28
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface PlayerState {
  position: Position;
  size: number;
  speed: number;
  direction: Direction | null;
  nextDirection: Direction | null;
  spriteCords: [number, number];
  animationFrameCount: number;
  framesPerSprite: number;
  sprites: Record<Direction, [number, number][]>;
}

// ─── Ghost ────────────────────────────────────────────────────────────────────

export interface GhostState {
  id: GhostId;
  position: Position;
  direction: Direction;
  mode: GhostMode;
  /** Mode to restore after frightened ends (scatter or chase) */
  previousMode: 'scatter' | 'chase';
  targetTile: TileCoord;
  /** Home corner for scatter mode */
  homeCorner: TileCoord;
  /** Pixel position inside house to bounce toward */
  homePosition: Position;
  /** Dots eaten by player while this ghost is in the house */
  dotCounter: number;
  /** Dot count required before this ghost leaves the house */
  dotLimit: number;
  frightenedFlashing: boolean;
  /** BFS path back to house (used only in 'eaten' mode) */
  returnPath: Direction[];
}

export interface GhostsSlice {
  ghosts: GhostState[];
  globalMode: 'scatter' | 'chase';
  globalModePhase: number;  // 0–7 cycling through scatter/chase schedule
  globalModeTimer: number;  // ms elapsed in current phase
  frightenedTimer: number;  // ms remaining in frightened mode (0 = not frightened)
  eatCombo: number;         // consecutive eats in one power mode (for score multiplier)
  forceReleaseTimer: number; // ms since last dot eaten (triggers force release at 4000ms)
}

// ─── Level data ───────────────────────────────────────────────────────────────

/** [x0, y0, width, height] in tile units */
export type WallDef = [number, number, number, number];

/** [col, row] in tile units (fractional = tile center, e.g. 1.5 = col 1 center) */
export type ItemPosition = [number, number];

export interface GhostHouseArea {
  /** First interior column (not the wall itself) */
  interiorCol: number;
  /** First interior row */
  interiorRow: number;
  interiorWidth: number;
  interiorHeight: number;
}

export interface LevelDefinition {
  name: string;
  walls: WallDef[];
  coins: ItemPosition[];
  pills: ItemPosition[];
  ghostHouseArea: GhostHouseArea;
  ghostDoorTiles: TileCoord[];
  tunnelRow: number;
  playerStart: TileCoord;
  ghostStarts: Record<GhostId, TileCoord>;
  blinkyStartsOutside: boolean;
}

/** Level definition after processing: pixel-scaled positions and computed grid */
export interface ComputedLevel {
  name: string;
  /** 29×29 tile grid */
  grid: Tile[][];
  /** Original wall defs (for GameBackground renderer) */
  walls: WallDef[];
  /** Pixel-scaled coin positions (mutable – coins removed as collected) */
  coins: Position[];
  /** Pixel-scaled pill positions (mutable – pills removed as collected) */
  pills: Position[];
  ghostHouseArea: GhostHouseArea;
  ghostDoorTiles: TileCoord[];
  tunnelRow: number;
  playerStart: TileCoord;
  ghostStarts: Record<GhostId, TileCoord>;
}

// ─── Level params ─────────────────────────────────────────────────────────────

export interface LevelParams {
  playerSpeed: number;         // pixels/sec
  ghostSpeed: number;          // pixels/sec (normal)
  frightenedSpeed: number;     // pixels/sec
  eatenSpeed: number;          // pixels/sec (eyes returning)
  tunnelSpeed: number;         // pixels/sec (in tunnel)
  frightenedDuration: number;  // ms
  frightenedFlashAt: number;   // ms before end when flashing starts
  elroyDotsThreshold1: number; // remaining dots for Blinky speed boost 1
  elroySpeed1: number;         // pixels/sec
  elroyDotsThreshold2: number; // remaining dots for Blinky speed boost 2
  elroySpeed2: number;         // pixels/sec
  bonusFruitScore: number;
  bonusFruitType: string;
}

// ─── Game info ────────────────────────────────────────────────────────────────

export interface ScorePopup {
  id: number;
  value: number;
  position: Position;
  createdAt: number; // timestamp ms
}

export interface GameInfoState {
  score: number;
  lives: number;
  showGameOver: boolean;
  gameStarted: boolean;
  playingIntro: boolean;
  showStageName: boolean;
  levelCompleted: boolean;
  levelIndex: number;
  poweredUp: boolean;
  powerModeEndsAt: number | null;
  scorePopups: ScorePopup[];
  playerDying: boolean;
  playerDyingAt: number | null;
  highScore: number;
}

// ─── Redux root ───────────────────────────────────────────────────────────────

export interface LevelsState {
  currentLevelIndex: number;
  currentLevel: ComputedLevel;
}

export interface RootState {
  player: PlayerState;
  ghosts: GhostsSlice;
  levels: LevelsState;
  gameInfo: GameInfoState;
}
