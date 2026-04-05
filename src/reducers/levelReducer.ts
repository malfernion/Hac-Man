import { LevelsState, Position } from '../types';
import { computedLevels } from '../data/levels';

// ─── Action types ─────────────────────────────────────────────────────────────

export const COIN_COLLECTED       = 'COIN_COLLECTED';
export const PILL_COLLECTED       = 'PILL_COLLECTED';
export const RESET_LEVEL_PROGRESS = 'RESET_LEVEL_PROGRESS';
export const SET_LEVEL_INDEX      = 'SET_LEVEL_INDEX';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function removePosition(arr: Position[], target: Position): Position[] {
  // Remove by reference equality or close proximity (handles float comparison)
  return arr.filter(p => !(
    Math.abs(p.x - target.x) < 0.5 &&
    Math.abs(p.y - target.y) < 0.5
  ));
}

function freshLevel(index: number) {
  const clamped = Math.min(index, computedLevels.length - 1);
  const base = computedLevels[clamped];
  // Return a deep copy so mutations don't affect the pre-computed data
  return {
    ...base,
    coins: [...base.coins],
    pills: [...base.pills],
  };
}

// ─── Default state ────────────────────────────────────────────────────────────

const defaultState: LevelsState = {
  currentLevelIndex: 0,
  currentLevel: freshLevel(0),
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type AnyAction = { type: string; [key: string]: unknown };

export default function levelReducer(
  state: LevelsState = defaultState,
  action: AnyAction,
): LevelsState {
  switch (action.type) {
    case COIN_COLLECTED:
      return {
        ...state,
        currentLevel: {
          ...state.currentLevel,
          coins: removePosition(state.currentLevel.coins, action.coin as Position),
        },
      };

    case PILL_COLLECTED:
      return {
        ...state,
        currentLevel: {
          ...state.currentLevel,
          pills: removePosition(state.currentLevel.pills, action.pill as Position),
        },
      };

    case RESET_LEVEL_PROGRESS:
      return {
        ...state,
        currentLevel: freshLevel(state.currentLevelIndex),
      };

    case SET_LEVEL_INDEX: {
      const idx = action.index as number;
      return {
        currentLevelIndex: idx,
        currentLevel: freshLevel(idx),
      };
    }

    default:
      return state;
  }
}
