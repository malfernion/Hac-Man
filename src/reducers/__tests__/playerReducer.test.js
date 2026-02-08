import playerReducer from '../playerReducer';

describe('playerReducer', () => {
  it('sets direction when first pressed and queues next direction', () => {
    const state = playerReducer(undefined, { type: '@@INIT' });
    const withDirection = playerReducer(state, { type: 'DIRECTION_PRESSED', direction: 'LEFT' });
    const queued = playerReducer(withDirection, { type: 'DIRECTION_PRESSED', direction: 'UP' });

    expect(withDirection.direction).toBe('LEFT');
    expect(withDirection.nextDirection).toBeUndefined();
    expect(queued.nextDirection).toBe('UP');
  });

  it('changes to the queued direction', () => {
    const state = playerReducer(undefined, { type: 'DIRECTION_PRESSED', direction: 'LEFT' });
    const queued = playerReducer(state, { type: 'DIRECTION_PRESSED', direction: 'UP' });
    const nextState = playerReducer(queued, { type: 'CHANGE_TO_NEXT_DIRECTION' });

    expect(nextState.direction).toBe('UP');
    expect(nextState.nextDirection).toBeNull();
  });

  it('moves the player and advances animation frame', () => {
    const state = playerReducer(undefined, { type: 'DIRECTION_PRESSED', direction: 'RIGHT' });
    const nextPosition = { x: state.position.x + 10, y: state.position.y };
    const moved = playerReducer(state, { type: 'MOVE', timeElapsed: 1, position: nextPosition });

    expect(moved.position).toEqual(nextPosition);
    expect(moved.animationFrameCount).toBe(state.animationFrameCount + 1);
  });

  it('moves the player back when collided and clears direction', () => {
    const state = playerReducer(undefined, { type: 'DIRECTION_PRESSED', direction: 'RIGHT' });
    const nextPosition = { x: state.position.x + 10, y: state.position.y };
    const moved = playerReducer(state, { type: 'MOVE', timeElapsed: 1, position: nextPosition });
    const collided = playerReducer(moved, { type: 'COLLIDED', timeElapsed: 1, position: state.position });

    expect(collided.direction).toBeNull();
    expect(collided.position).toEqual(state.position);
  });

  it('resets player state', () => {
    const moved = playerReducer(undefined, { type: 'MOVE', timeElapsed: 1, position: { x: 10, y: 10 } });
    const reset = playerReducer(moved, { type: 'RESET_PLAYER' });
    const defaultState = playerReducer(undefined, { type: '@@INIT' });

    expect(reset).toEqual(defaultState);
  });

  it('resets the player animation sprite', () => {
    const state = playerReducer(undefined, { type: 'DIRECTION_PRESSED', direction: 'RIGHT' });
    const moved = playerReducer(state, { type: 'MOVE', timeElapsed: 1, position: { x: 10, y: 10 } });
    const resetAnimation = playerReducer(moved, { type: 'RESET_PLAYER_ANIMATION' });
    const defaultState = playerReducer(undefined, { type: '@@INIT' });

    expect(resetAnimation.spriteCords).toEqual(defaultState.spriteCords);
  });
});
