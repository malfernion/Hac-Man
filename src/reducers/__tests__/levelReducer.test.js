import levelReducer from '../levelReducer';

describe('levelReducer', () => {
  it('removes a collected pill from the current level', () => {
    const state = levelReducer(undefined, { type: '@@INIT' });
    const pill = state.currentLevel.pills[0];

    const nextState = levelReducer(state, { type: 'PILL_COLLECTED', pill });

    expect(nextState.currentLevel.pills).toHaveLength(state.currentLevel.pills.length - 1);
    expect(nextState.currentLevel.pills).not.toContainEqual(pill);
  });

  it('removes a collected coin from the current level', () => {
    const state = levelReducer(undefined, { type: '@@INIT' });
    const coin = state.currentLevel.coins[0];

    const nextState = levelReducer(state, { type: 'COIN_COLLECTED', coin });

    expect(nextState.currentLevel.coins).toHaveLength(state.currentLevel.coins.length - 1);
    expect(nextState.currentLevel.coins).not.toContainEqual(coin);
  });

  it('resets level progress to defaults', () => {
    const state = levelReducer(undefined, { type: '@@INIT' });
    const coin = state.currentLevel.coins[0];
    const updated = levelReducer(state, { type: 'COIN_COLLECTED', coin });
    const reset = levelReducer(updated, { type: 'RESET_LEVEL_PROGRESS' });
    const defaultState = levelReducer(undefined, { type: '@@INIT' });

    expect(reset).toEqual(defaultState);
  });
});
