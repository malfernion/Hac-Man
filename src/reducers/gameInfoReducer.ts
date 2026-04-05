import { GameInfoState, ScorePopup } from '../types';

// ─── Action types ─────────────────────────────────────────────────────────────

export const INCREASE_SCORE       = 'INCREASE_SCORE';
export const START_GAME           = 'START_GAME';
export const INTRO_FINISHED       = 'INTRO_FINISHED';
export const LEVEL_COMPLETED      = 'LEVEL_COMPLETED';
export const POWER_MODE_STARTED   = 'POWER_MODE_STARTED';
export const POWER_MODE_ENDED     = 'POWER_MODE_ENDED';
export const RESET_GAME           = 'RESET_GAME';
export const LOST_LIFE            = 'LOST_LIFE';
export const GHOST_KILLED         = 'GHOST_KILLED';
export const PLAYER_DYING         = 'PLAYER_DYING';
export const PLAYER_RESPAWN       = 'PLAYER_RESPAWN';
export const GAME_OVER            = 'GAME_OVER';
export const ADD_SCORE_POPUP      = 'ADD_SCORE_POPUP';
export const REMOVE_SCORE_POPUP   = 'REMOVE_SCORE_POPUP';
export const ADVANCE_LEVEL        = 'ADVANCE_LEVEL';
export const EXTRA_LIFE           = 'EXTRA_LIFE';

// ─── Default state ────────────────────────────────────────────────────────────

function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem('hacman_highscore') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

const defaultState: GameInfoState = {
  score: 0,
  lives: 3,
  showGameOver: false,
  gameStarted: false,
  playingIntro: false,
  showStageName: true,
  levelCompleted: false,
  levelIndex: 0,
  poweredUp: false,
  powerModeEndsAt: null,
  scorePopups: [],
  playerDying: false,
  playerDyingAt: null,
  highScore: loadHighScore(),
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type AnyAction = { type: string; [key: string]: unknown };

export default function gameInfoReducer(
  state: GameInfoState = defaultState,
  action: AnyAction,
): GameInfoState {
  switch (action.type) {
    case INCREASE_SCORE: {
      const newScore = state.score + (action.score as number);
      const newHighScore = Math.max(state.highScore, newScore);
      if (newHighScore > state.highScore) {
        try { localStorage.setItem('hacman_highscore', String(newHighScore)); } catch { /* ignore */ }
      }
      return { ...state, score: newScore, highScore: newHighScore };
    }

    case START_GAME:
      return {
        ...state,
        playingIntro: true,
        showStageName: false,
      };

    case INTRO_FINISHED:
      return {
        ...state,
        gameStarted: true,
        playingIntro: false,
      };

    case LEVEL_COMPLETED:
      return {
        ...state,
        gameStarted: false,
        levelCompleted: true,
      };

    case ADVANCE_LEVEL:
      return {
        ...state,
        levelCompleted: false,
        gameStarted: false,
        playingIntro: true,
        showStageName: true,
        poweredUp: false,
        powerModeEndsAt: null,
        levelIndex: state.levelIndex + 1,
        playerDying: false,
        playerDyingAt: null,
      };

    case POWER_MODE_STARTED:
      return {
        ...state,
        poweredUp: true,
        powerModeEndsAt: action.endsAt as number,
      };

    case POWER_MODE_ENDED:
      return {
        ...state,
        poweredUp: false,
        powerModeEndsAt: null,
      };

    case LOST_LIFE: {
      const newLives = state.lives - 1;
      return {
        ...state,
        lives: newLives,
        playerDying: false,
        playerDyingAt: null,
      };
    }

    case PLAYER_DYING:
      return {
        ...state,
        gameStarted: false,
        playerDying: true,
        playerDyingAt: action.timestamp as number,
      };

    case PLAYER_RESPAWN:
      return {
        ...state,
        gameStarted: true,
        playerDying: false,
        playerDyingAt: null,
        poweredUp: false,
        powerModeEndsAt: null,
      };

    case GAME_OVER:
      return {
        ...state,
        gameStarted: false,
        showGameOver: true,
        playerDying: false,
      };

    case GHOST_KILLED:
      return state; // handled via INCREASE_SCORE

    case ADD_SCORE_POPUP: {
      const popup = action.popup as ScorePopup;
      return { ...state, scorePopups: [...state.scorePopups, popup] };
    }

    case REMOVE_SCORE_POPUP:
      return {
        ...state,
        scorePopups: state.scorePopups.filter(p => p.id !== (action.id as number)),
      };

    case EXTRA_LIFE:
      return { ...state, lives: state.lives + 1 };

    case RESET_GAME:
      return {
        ...defaultState,
        highScore: state.highScore, // preserve high score across resets
      };

    default:
      return state;
  }
}
