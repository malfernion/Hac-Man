import { Direction, Position } from '../types';
import {
  DIRECTION_PRESSED,
  CHANGE_TO_NEXT_DIRECTION,
  MOVE,
  COLLIDED,
  RESET_PLAYER,
  RESET_PLAYER_ANIMATION,
} from '../reducers/playerReducer';

export const directionPressed       = (direction: Direction)            => ({ type: DIRECTION_PRESSED, direction });
export const changeToNextDirection  = ()                                => ({ type: CHANGE_TO_NEXT_DIRECTION });
export const movePlayer             = (timeElapsed: number, position: Position) => ({ type: MOVE, timeElapsed, position });
export const playerCollided         = (timeElapsed: number, position: Position) => ({ type: COLLIDED, timeElapsed, position });
export const resetPlayer            = ()                                => ({ type: RESET_PLAYER });
export const resetPlayerAnimation   = ()                                => ({ type: RESET_PLAYER_ANIMATION });
