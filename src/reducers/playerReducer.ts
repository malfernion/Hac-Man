import { PlayerState, Direction } from '../types';
import { tileToPixel } from '../helpers/tileHelpers';
import { getSpriteCords } from '../helpers/animationHelpers';

// ─── Action types ─────────────────────────────────────────────────────────────

export const DIRECTION_PRESSED       = 'DIRECTION_PRESSED';
export const CHANGE_TO_NEXT_DIRECTION = 'CHANGE_TO_NEXT_DIRECTION';
export const MOVE                    = 'MOVE';
export const COLLIDED                = 'COLLIDED';
export const RESET_PLAYER            = 'RESET_PLAYER';
export const RESET_PLAYER_ANIMATION  = 'RESET_PLAYER_ANIMATION';

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_START = tileToPixel({ col: 14, row: 22 });

const defaultState: PlayerState = {
  position: DEFAULT_START,
  size: 27,
  speed: 120,
  direction: null,
  nextDirection: null,
  spriteCords: [34, 0],
  animationFrameCount: 0,
  framesPerSprite: 3,
  sprites: {
    RIGHT: [[34, 0], [18, 0],  [2, 0]],
    LEFT:  [[34, 0], [18, 16], [2, 16]],
    DOWN:  [[34, 0], [18, 48], [2, 48]],
    UP:    [[34, 0], [18, 32], [2, 32]],
  },
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type AnyAction = { type: string; [key: string]: unknown };

export default function playerReducer(
  state: PlayerState = defaultState,
  action: AnyAction,
): PlayerState {
  switch (action.type) {
    case DIRECTION_PRESSED: {
      const direction = action.direction as Direction;
      if (!state.direction) {
        return { ...state, direction };
      }
      return { ...state, nextDirection: direction };
    }

    case CHANGE_TO_NEXT_DIRECTION: {
      const newDir = state.nextDirection as Direction;
      return {
        ...state,
        direction: newDir,
        nextDirection: null,
      };
    }

    case MOVE: {
      const newPosition = action.position as PlayerState['position'];
      const newFrameCount = state.animationFrameCount + 1;
      const newState = { ...state, position: newPosition, animationFrameCount: newFrameCount };
      return { ...newState, spriteCords: getSpriteCords(newState) };
    }

    case COLLIDED: {
      const newPosition = action.position as PlayerState['position'];
      return {
        ...state,
        position: newPosition,
        direction: null,
        animationFrameCount: 0,
        spriteCords: state.sprites[state.direction ?? 'RIGHT'][0],
      };
    }

    case RESET_PLAYER:
      return { ...defaultState };

    case RESET_PLAYER_ANIMATION:
      return { ...state, spriteCords: defaultState.spriteCords, animationFrameCount: 0 };

    default:
      return state;
  }
}
