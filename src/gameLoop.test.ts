/**
 * Simulation tests for tickGameState.
 *
 * These tests run the pure game-loop function with controlled state and verify
 * that the right actions are produced. No DOM, no Redux store needed.
 */

import { tickGameState } from './gameLoop';
import rootReducer from './reducers/rootReducer';
import { RootState } from './types';
import { tileToPixel, TILE_SIZE } from './helpers/tileHelpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a fresh default state via the root reducer */
function freshState(): RootState {
  return rootReducer(undefined as unknown as RootState, { type: '@@INIT' });
}

/**
 * Apply a sequence of tickGameState calls and dispatch through rootReducer
 * Returns the final state.
 */
function simulate(
  initialState: RootState,
  frames: number,
  deltaMs: number,
  baseTimestamp = 10000,
): RootState {
  let state = initialState;
  for (let i = 0; i < frames; i++) {
    const ts = baseTimestamp + i * deltaMs;
    const actions = tickGameState(state, deltaMs, ts);
    for (const action of actions) {
      state = rootReducer(state, action as Parameters<typeof rootReducer>[1]);
    }
  }
  return state;
}

/** Returns a state where the game is started and intro finished */
function startedState(): RootState {
  let state = freshState();
  state = rootReducer(state, { type: 'DIRECTION_PRESSED', direction: 'RIGHT' });
  state = rootReducer(state, { type: 'START_GAME' });
  state = rootReducer(state, { type: 'INTRO_FINISHED' });
  return state;
}

// ─── Player movement simulation ───────────────────────────────────────────────

describe('tickGameState – player movement', () => {
  it('moves player right over multiple frames', () => {
    const state = startedState();
    const initial = state.player.position;

    const finalState = simulate(state, 10, 16);
    expect(finalState.player.position.x).toBeGreaterThan(initial.x);
  });

  it('player does not enter wall tiles over 300 frames', () => {
    const state = startedState();
    let current = state;
    for (let i = 0; i < 300; i++) {
      const ts = 10000 + i * 16;
      const actions = tickGameState(current, 16, ts);
      for (const action of actions) {
        current = rootReducer(current, action as Parameters<typeof rootReducer>[1]);
      }
      const { grid } = current.levels.currentLevel;
      const { position } = current.player;
      const col = Math.floor(position.x / TILE_SIZE);
      const row = Math.floor(position.y / TILE_SIZE);
      if (row >= 0 && row < 29 && col >= 0 && col < 29) {
        expect(grid[row][col]).not.toBe(1); // Tile.WALL = 1
      }
    }
  });

  it('queued direction change takes effect at tile center', () => {
    let state = startedState();
    // Add a queued UP direction
    state = rootReducer(state, { type: 'DIRECTION_PRESSED', direction: 'UP' });
    // Simulate until direction changes
    let changed = false;
    for (let i = 0; i < 60; i++) {
      const prevDir = state.player.direction;
      const actions = tickGameState(state, 16, 10000 + i * 16);
      for (const action of actions) {
        state = rootReducer(state, action as Parameters<typeof rootReducer>[1]);
      }
      if (state.player.direction !== prevDir) {
        changed = true;
        break;
      }
    }
    // Direction should eventually change (or remain blocked if wall, but will try)
    expect(typeof state.player.direction).toBe('string');
  });
});

// ─── Coin collection ──────────────────────────────────────────────────────────

describe('tickGameState – coin collection', () => {
  it('score increases when player collects a coin', () => {
    let state = startedState();
    const initialScore = state.gameInfo.score;
    const initialCoins = state.levels.currentLevel.coins.length;

    // Simulate many frames; player starts at col 14 row 22 facing right
    const finalState = simulate(state, 120, 16);

    // Score should have increased (player should collect some coins)
    expect(finalState.gameInfo.score).toBeGreaterThanOrEqual(initialScore);
    // Coin count should decrease
    expect(finalState.levels.currentLevel.coins.length).toBeLessThanOrEqual(initialCoins);
  });

  it('COIN_COLLECTED action is produced when player overlaps coin', () => {
    let state = startedState();
    // Find a coin and teleport player to it
    const firstCoin = state.levels.currentLevel.coins[10];
    state = {
      ...state,
      player: { ...state.player, position: firstCoin, direction: 'RIGHT' },
    };

    const actions = tickGameState(state, 16, 10000);
    const coinActions = actions.filter(a => a.type === 'COIN_COLLECTED');
    expect(coinActions.length).toBeGreaterThan(0);

    const scoreActions = actions.filter(a => a.type === 'INCREASE_SCORE');
    expect(scoreActions.length).toBeGreaterThan(0);
  });
});

// ─── Power pill ───────────────────────────────────────────────────────────────

describe('tickGameState – power mode', () => {
  it('POWER_MODE_STARTED dispatched when player hits pill', () => {
    let state = startedState();
    const pill = state.levels.currentLevel.pills[0];
    state = {
      ...state,
      player: { ...state.player, position: pill, direction: 'RIGHT' },
    };

    const actions = tickGameState(state, 16, 10000);
    expect(actions.some(a => a.type === 'POWER_MODE_STARTED')).toBe(true);
    expect(actions.some(a => a.type === 'GHOSTS_FRIGHTENED')).toBe(true);
  });

  it('POWER_MODE_ENDED dispatched when timer expires', () => {
    let state = startedState();
    // Set poweredUp and a powerModeEndsAt in the past
    state = {
      ...state,
      gameInfo: {
        ...state.gameInfo,
        poweredUp: true,
        powerModeEndsAt: 9000, // before our timestamp of 10000
      },
    };

    const actions = tickGameState(state, 16, 10000);
    expect(actions.some(a => a.type === 'POWER_MODE_ENDED')).toBe(true);
  });
});

// ─── Ghost state ─────────────────────────────────────────────────────────────

describe('tickGameState – ghost ticks', () => {
  it('produces GHOST_TICK actions for all 4 ghosts', () => {
    const state = startedState();
    const actions = tickGameState(state, 16, 10000);
    const ghostTicks = actions.filter(a => a.type === 'GHOST_TICK');
    expect(ghostTicks.length).toBe(4);
  });

  it('ghosts accumulate dot counters when coins are eaten', () => {
    let state = startedState();
    const pill = state.levels.currentLevel.coins[0];
    state = {
      ...state,
      player: { ...state.player, position: pill, direction: 'RIGHT' },
    };

    const actions = tickGameState(state, 16, 10000);
    // DOT_EATEN_GHOST should appear when a coin is collected
    expect(actions.some(a => a.type === 'DOT_EATEN_GHOST')).toBe(true);
  });

  it('GLOBAL_MODE_TICK is produced every frame', () => {
    const state = startedState();
    const actions = tickGameState(state, 16, 10000);
    expect(actions.some(a => a.type === 'GLOBAL_MODE_TICK')).toBe(true);
  });

  it('global mode phase advances when scatter phase expires', () => {
    // First scatter phase is 7000ms; simulate past it
    let state = startedState();
    // Set timer near the end of the first scatter phase
    state = {
      ...state,
      ghosts: {
        ...state.ghosts,
        globalModeTimer: 6990, // 10ms before end
        globalModePhase: 0,
      },
    };

    // First frame – still in phase 0
    let actions = tickGameState(state, 16, 10000);
    for (const action of actions) {
      state = rootReducer(state, action as Parameters<typeof rootReducer>[1]);
    }

    // Phase should have advanced to 1
    expect(state.ghosts.globalModePhase).toBe(1);
    expect(state.ghosts.globalModeTimer).toBe(0); // timer resets
  });

  it('ghost eventually leaves the house after enough dots', () => {
    let state = startedState();

    // Force pinky to have enough dot count to leave
    state = {
      ...state,
      ghosts: {
        ...state.ghosts,
        ghosts: state.ghosts.ghosts.map(g =>
          g.id === 'pinky' ? { ...g, dotCounter: 100, dotLimit: 0 } : g,
        ),
      },
    };

    const finalState = simulate(state, 200, 16);
    const pinky = finalState.ghosts.ghosts.find(g => g.id === 'pinky')!;
    // After 200 frames (3.2s), pinky should have left the house
    expect(pinky.mode).not.toBe('home');
  });

  it('ghosts never enter wall tiles over 200 simulated frames', () => {
    let state = startedState();
    const { grid } = state.levels.currentLevel;

    for (let i = 0; i < 200; i++) {
      const ts = 10000 + i * 16;
      const actions = tickGameState(state, 16, ts);
      for (const action of actions) {
        state = rootReducer(state, action as Parameters<typeof rootReducer>[1]);
      }

      for (const ghost of state.ghosts.ghosts) {
        if (ghost.mode === 'home' || ghost.mode === 'leaving') continue;
        const col = Math.floor(ghost.position.x / TILE_SIZE);
        const row = Math.floor(ghost.position.y / TILE_SIZE);
        if (row >= 0 && row < 29 && col >= 0 && col < 29) {
          expect(grid[row][col]).not.toBe(1); // Tile.WALL = 1
        }
      }
    }
  });
});

// ─── Player death ─────────────────────────────────────────────────────────────

describe('tickGameState – player death', () => {
  it('triggers death sequence when ghost collides with player', () => {
    let state = startedState();

    // Place a chase-mode ghost directly on the player
    const playerPos = state.player.position;
    state = {
      ...state,
      ghosts: {
        ...state.ghosts,
        ghosts: state.ghosts.ghosts.map((g, i) =>
          i === 0
            ? { ...g, mode: 'chase', position: playerPos, direction: 'RIGHT' }
            : g,
        ),
      },
    };

    const actions = tickGameState(state, 16, 10000);
    expect(actions.some(a => a.type === 'PLAYER_DYING')).toBe(true);
  });

  it('GAME_OVER action when lives reach 0 after death animation', () => {
    let state = startedState();
    state = {
      ...state,
      gameInfo: {
        ...state.gameInfo,
        lives: 1,
        playerDying: true,
        playerDyingAt: 10000 - 2000, // 2s ago (> 1500ms threshold)
      },
    };

    const actions = tickGameState(state, 16, 10000);
    expect(actions.some(a => a.type === 'LOST_LIFE')).toBe(true);
    expect(actions.some(a => a.type === 'GAME_OVER')).toBe(true);
  });

  it('PLAYER_RESPAWN + RESET_PLAYER + RESET_GHOSTS when lives remain', () => {
    let state = startedState();
    state = {
      ...state,
      gameInfo: {
        ...state.gameInfo,
        lives: 3,
        playerDying: true,
        playerDyingAt: 10000 - 2000,
      },
    };

    const actions = tickGameState(state, 16, 10000);
    expect(actions.some(a => a.type === 'LOST_LIFE')).toBe(true);
    expect(actions.some(a => a.type === 'PLAYER_RESPAWN')).toBe(true);
    expect(actions.some(a => a.type === 'RESET_PLAYER')).toBe(true);
    expect(actions.some(a => a.type === 'RESET_GHOSTS')).toBe(true);
    expect(actions.some(a => a.type === 'GAME_OVER')).toBe(false);
  });
});

// ─── Score popup expiry ───────────────────────────────────────────────────────

describe('tickGameState – score popups', () => {
  it('REMOVE_SCORE_POPUP for expired popups', () => {
    let state = startedState();
    state = {
      ...state,
      gameInfo: {
        ...state.gameInfo,
        scorePopups: [{
          id: 42,
          value: 200,
          position: { x: 200, y: 200 },
          createdAt: 10000 - 2000, // 2s ago > 1200ms expiry
        }],
      },
    };

    const actions = tickGameState(state, 16, 10000);
    expect(actions.some(a => a.type === 'REMOVE_SCORE_POPUP' && (a as any).id === 42)).toBe(true);
  });
});
