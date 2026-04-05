import { GhostState, GhostsSlice, Direction } from '../types';
import { tileToPixel } from '../helpers/tileHelpers';
import { GHOST_HOME_CORNERS } from '../helpers/ghostHelpers';
import { computedLevels } from '../data/levels';
import {
  GhostAction,
  GHOST_TICK,
  GHOSTS_INITIALIZED,
  GHOST_EATEN,
  GHOSTS_FRIGHTENED,
  FRIGHTENED_ENDED,
  GLOBAL_MODE_TICK,
  DOT_EATEN_GHOST,
  RESET_GHOSTS,
  GHOSTS_REVERSE,
} from '../actions/ghostActions';
import { reverseDirection } from '../helpers/tileHelpers';

// ─── Default ghost states ─────────────────────────────────────────────────────

function makeDefaultGhost(
  id: GhostState['id'],
  col: number,
  row: number,
  dotLimit: number,
  startMode: GhostState['mode'] = 'home',
): GhostState {
  const pos = tileToPixel({ col, row });
  return {
    id,
    position: pos,
    direction: 'RIGHT' as Direction,
    mode: startMode,
    previousMode: 'scatter' as const,
    targetTile: GHOST_HOME_CORNERS[id],
    homeCorner: GHOST_HOME_CORNERS[id],
    homePosition: pos,
    dotCounter: 0,
    dotLimit,
    frightenedFlashing: false,
    returnPath: [],
  };
}

function buildDefaultGhosts(): GhostState[] {
  const level = computedLevels[0];
  const { ghostStarts, blinkyStartsOutside } = { blinkyStartsOutside: true, ...level };
  return [
    makeDefaultGhost('blinky', ghostStarts.blinky.col, ghostStarts.blinky.row, 0,
      blinkyStartsOutside ? 'scatter' : 'home'),
    makeDefaultGhost('pinky',  ghostStarts.pinky.col,  ghostStarts.pinky.row,  0, 'home'),
    makeDefaultGhost('inky',   ghostStarts.inky.col,   ghostStarts.inky.row,   30, 'home'),
    makeDefaultGhost('clyde',  ghostStarts.clyde.col,  ghostStarts.clyde.row,  60, 'home'),
  ];
}

const defaultState: GhostsSlice = {
  ghosts: buildDefaultGhosts(),
  globalMode: 'scatter',
  globalModePhase: 0,
  globalModeTimer: 0,
  frightenedTimer: 0,
  eatCombo: 0,
  forceReleaseTimer: 0,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

export default function ghostsReducer(
  state: GhostsSlice = defaultState,
  action: GhostAction,
): GhostsSlice {
  switch (action.type) {
    case GHOSTS_INITIALIZED:
      return { ...state, ghosts: action.ghosts };

    case GHOST_TICK: {
      const { id, ...raw } = action.payload;
      // Only merge defined fields so partial updates don't overwrite existing state with undefined
      const updates = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== undefined),
      ) as Partial<GhostState>;
      return {
        ...state,
        ghosts: state.ghosts.map(g =>
          g.id === id ? { ...g, ...updates } : g,
        ),
      };
    }

    case GHOST_EATEN: {
      const newCombo = action.eatCombo + 1;
      return {
        ...state,
        eatCombo: newCombo,
        ghosts: state.ghosts.map(g =>
          g.id === action.id
            ? { ...g, mode: 'eaten', frightenedFlashing: false }
            : g,
        ),
      };
    }

    case GHOSTS_FRIGHTENED: {
      const frightenedDuration = action.endsAt - Date.now();
      return {
        ...state,
        frightenedTimer: Math.max(0, frightenedDuration),
        eatCombo: 0,
        ghosts: state.ghosts.map(g => {
          if (g.mode === 'home' || g.mode === 'leaving' || g.mode === 'eaten') return g;
          return {
            ...g,
            previousMode: g.mode as 'scatter' | 'chase',
            mode: 'frightened' as const,
            frightenedFlashing: false,
          };
        }),
      };
    }

    case FRIGHTENED_ENDED:
      return {
        ...state,
        frightenedTimer: 0,
        eatCombo: 0,
        ghosts: state.ghosts.map(g =>
          g.mode === 'frightened'
            ? { ...g, mode: g.previousMode, frightenedFlashing: false }
            : g,
        ),
      };

    case GLOBAL_MODE_TICK: {
      return {
        ...state,
        globalModeTimer: state.globalModeTimer + action.deltaMs,
        forceReleaseTimer: state.forceReleaseTimer + action.deltaMs,
        frightenedTimer: Math.max(0, state.frightenedTimer - action.deltaMs),
      };
    }

    case DOT_EATEN_GHOST:
      return {
        ...state,
        forceReleaseTimer: 0,
        ghosts: state.ghosts.map(g =>
          g.mode === 'home'
            ? { ...g, dotCounter: g.dotCounter + 1 }
            : g,
        ),
      };

    case GHOSTS_REVERSE: {
      const newPhase = (action as GhostAction & { newPhase?: number }).newPhase ?? state.globalModePhase + 1;
      return {
        ...state,
        globalModePhase: newPhase,
        globalModeTimer: 0,
        ghosts: state.ghosts.map(g => {
          if (g.mode === 'frightened' || g.mode === 'eaten' || g.mode === 'home') return g;
          return { ...g, direction: reverseDirection(g.direction) };
        }),
      };
    }

    case RESET_GHOSTS:
      return { ...defaultState, ghosts: buildDefaultGhosts() };

    default:
      return state;
  }
}
