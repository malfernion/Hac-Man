import { LevelParams } from '../types';

/**
 * Classic Pac-Man difficulty parameters per level.
 * Speeds are in pixels/second. Base tile speed ≈ 210 px/s (7.5 tiles/sec × 28px/tile).
 */

const BASE = 210; // px/s at 100%

function pct(p: number): number {
  return BASE * p;
}

const levelParamTable: LevelParams[] = [
  // Level 1 – deliberately forgiving for new players
  {
    playerSpeed:             pct(0.80),
    ghostSpeed:              pct(0.75),
    frightenedSpeed:         pct(0.50),
    eatenSpeed:              pct(1.50),
    tunnelSpeed:             pct(0.40),
    frightenedDuration:      6000,
    frightenedFlashAt:       2000,
    elroyDotsThreshold1:     20,
    elroySpeed1:             pct(0.80),
    elroyDotsThreshold2:     10,
    elroySpeed2:             pct(0.85),
    bonusFruitScore:         100,
    bonusFruitType:          'cherry',
  },
  // Level 2
  {
    playerSpeed:             pct(0.90),
    ghostSpeed:              pct(0.85),
    frightenedSpeed:         pct(0.55),
    eatenSpeed:              pct(1.50),
    tunnelSpeed:             pct(0.45),
    frightenedDuration:      5000,
    frightenedFlashAt:       2000,
    elroyDotsThreshold1:     30,
    elroySpeed1:             pct(0.90),
    elroyDotsThreshold2:     15,
    elroySpeed2:             pct(0.95),
    bonusFruitScore:         300,
    bonusFruitType:          'strawberry',
  },
  // Level 3
  {
    playerSpeed:             pct(0.90),
    ghostSpeed:              pct(0.85),
    frightenedSpeed:         pct(0.55),
    eatenSpeed:              pct(1.50),
    tunnelSpeed:             pct(0.45),
    frightenedDuration:      4000,
    frightenedFlashAt:       1500,
    elroyDotsThreshold1:     40,
    elroySpeed1:             pct(0.90),
    elroyDotsThreshold2:     20,
    elroySpeed2:             pct(0.95),
    bonusFruitScore:         500,
    bonusFruitType:          'peach',
  },
  // Level 4
  {
    playerSpeed:             pct(0.90),
    ghostSpeed:              pct(0.85),
    frightenedSpeed:         pct(0.55),
    eatenSpeed:              pct(1.50),
    tunnelSpeed:             pct(0.45),
    frightenedDuration:      3000,
    frightenedFlashAt:       1000,
    elroyDotsThreshold1:     40,
    elroySpeed1:             pct(0.90),
    elroyDotsThreshold2:     20,
    elroySpeed2:             pct(0.95),
    bonusFruitScore:         500,
    bonusFruitType:          'apple',
  },
  // Level 5+
  {
    playerSpeed:             pct(1.00),
    ghostSpeed:              pct(0.95),
    frightenedSpeed:         pct(0.60),
    eatenSpeed:              pct(1.50),
    tunnelSpeed:             pct(0.50),
    frightenedDuration:      2000,
    frightenedFlashAt:       500,
    elroyDotsThreshold1:     40,
    elroySpeed1:             pct(1.00),
    elroyDotsThreshold2:     20,
    elroySpeed2:             pct(1.05),
    bonusFruitScore:         700,
    bonusFruitType:          'grapes',
  },
];

/** Returns difficulty params for the given level index (0-based). Clamps to max. */
export function getLevelParams(levelIndex: number): LevelParams {
  const clamped = Math.min(levelIndex, levelParamTable.length - 1);
  return levelParamTable[clamped];
}

/** Global mode schedule (scatter/chase durations in ms) per level index */
interface ModeScheduleEntry {
  mode: 'scatter' | 'chase';
  duration: number; // ms; Infinity = indefinite
}

const MODE_SCHEDULE_L1: ModeScheduleEntry[] = [
  { mode: 'scatter', duration: 7000  },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 7000  },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000  },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000  },
  { mode: 'chase',   duration: Infinity },
];

const MODE_SCHEDULE_L2: ModeScheduleEntry[] = [
  { mode: 'scatter', duration: 7000  },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 7000  },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000  },
  { mode: 'chase',   duration: 1033  },
  { mode: 'scatter', duration: 17    }, // brief scatter before permanent chase
  { mode: 'chase',   duration: Infinity },
];

const MODE_SCHEDULE_L5: ModeScheduleEntry[] = [
  { mode: 'scatter', duration: 5000  },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000  },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000  },
  { mode: 'chase',   duration: 1033  },
  { mode: 'scatter', duration: 17    },
  { mode: 'chase',   duration: Infinity },
];

export function getModeSchedule(levelIndex: number): ModeScheduleEntry[] {
  if (levelIndex === 0) return MODE_SCHEDULE_L1;
  if (levelIndex <= 3)  return MODE_SCHEDULE_L2;
  return MODE_SCHEDULE_L5;
}
