import gameInfoReducer from '../gameInfoReducer';

describe('gameInfoReducer', () => {
  it('starts power mode with an end timestamp', () => {
    const state = gameInfoReducer(undefined, { type: '@@INIT' });
    const endsAt = 123456;
    const nextState = gameInfoReducer(state, { type: 'POWER_MODE_STARTED', endsAt });

    expect(nextState.poweredUp).toBe(true);
    expect(nextState.powerModeEndsAt).toBe(endsAt);
  });

  it('ends power mode and clears the timer', () => {
    const poweredState = gameInfoReducer(undefined, { type: 'POWER_MODE_STARTED', endsAt: 999 });
    const nextState = gameInfoReducer(poweredState, { type: 'POWER_MODE_ENDED' });

    expect(nextState.poweredUp).toBe(false);
    expect(nextState.powerModeEndsAt).toBeNull();
  });

  it('increments score by the provided amount', () => {
    const state = gameInfoReducer(undefined, { type: '@@INIT' });
    const nextState = gameInfoReducer(state, { type: 'INCREASE_SCORE', score: 50 });

    expect(nextState.score).toBe(50);
  });

  it('handles life loss and game over', () => {
    const state = gameInfoReducer(undefined, { type: '@@INIT' });
    const nextState = gameInfoReducer(state, { type: 'LOST_LIFE' });
    const gameOverState = gameInfoReducer({ ...state, lives: 1 }, { type: 'PLAYER_DIED' });

    expect(nextState.lives).toBe(2);
    expect(gameOverState.showGameOver).toBe(true);
  });

  it('tracks intro, start, and level completion flow', () => {
    const state = gameInfoReducer(undefined, { type: '@@INIT' });
    const started = gameInfoReducer(state, { type: 'START_GAME' });
    const introDone = gameInfoReducer(started, { type: 'INTRO_FINISHED' });
    const levelDone = gameInfoReducer(introDone, { type: 'LEVEL_COMPLETED' });

    expect(started.playingIntro).toBe(true);
    expect(started.showStageName).toBe(false);
    expect(introDone.gameStarted).toBe(true);
    expect(levelDone.levelCompleted).toBe(true);
    expect(levelDone.gameStarted).toBe(false);
  });
});
