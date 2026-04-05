import { Position } from '../types';
import {
  INCREASE_SCORE,
  START_GAME,
  INTRO_FINISHED,
  LEVEL_COMPLETED,
  POWER_MODE_STARTED,
  POWER_MODE_ENDED,
  RESET_GAME,
  LOST_LIFE,
  GHOST_KILLED,
  PLAYER_DYING,
  PLAYER_RESPAWN,
  GAME_OVER,
  ADD_SCORE_POPUP,
  REMOVE_SCORE_POPUP,
  ADVANCE_LEVEL,
  EXTRA_LIFE,
} from '../reducers/gameInfoReducer';

let popupIdCounter = 0;

export const increaseScore  = (score: number)    => ({ type: INCREASE_SCORE, score });
export const startGame      = ()                  => ({ type: START_GAME });
export const introFinished  = ()                  => ({ type: INTRO_FINISHED });
export const levelCompleted = ()                  => ({ type: LEVEL_COMPLETED });
export const advanceLevel   = ()                  => ({ type: ADVANCE_LEVEL });
export const powerModeStarted = (endsAt: number) => ({ type: POWER_MODE_STARTED, endsAt });
export const powerModeEnded = ()                  => ({ type: POWER_MODE_ENDED });
export const resetGame      = ()                  => ({ type: RESET_GAME });
export const lostLife       = ()                  => ({ type: LOST_LIFE });
export const ghostKilled    = ()                  => ({ type: GHOST_KILLED });
export const playerDying    = (timestamp: number) => ({ type: PLAYER_DYING, timestamp });
export const playerRespawn  = ()                  => ({ type: PLAYER_RESPAWN });
export const gameOver       = ()                  => ({ type: GAME_OVER });
export const extraLife      = ()                  => ({ type: EXTRA_LIFE });

export const addScorePopup = (value: number, position: Position, createdAt: number) => ({
  type: ADD_SCORE_POPUP,
  popup: { id: ++popupIdCounter, value, position, createdAt },
});

export const removeScorePopup = (id: number) => ({ type: REMOVE_SCORE_POPUP, id });
