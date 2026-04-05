import { Position } from '../types';
import {
  COIN_COLLECTED,
  PILL_COLLECTED,
  RESET_LEVEL_PROGRESS,
  SET_LEVEL_INDEX,
} from '../reducers/levelReducer';

export const coinCollected      = (coin: Position)    => ({ type: COIN_COLLECTED, coin });
export const pillCollected      = (pill: Position)    => ({ type: PILL_COLLECTED, pill });
export const resetLevelProgress = ()                  => ({ type: RESET_LEVEL_PROGRESS });
export const setLevelIndex      = (index: number)     => ({ type: SET_LEVEL_INDEX, index });

// Backward compat alias (was a typo in original)
export const resetLeveLProgress = resetLevelProgress;
