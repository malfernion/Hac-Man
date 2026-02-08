import ghostReducer from '../ghostReducer';

describe('ghostReducer', () => {
    it('moves ghosts when MOVE_GHOSTS is dispatched', () => {
        const state = ghostReducer(undefined, { type: '@@INIT' });
        const movedGhosts = state.ghosts.map(ghost => ({
            ...ghost,
            position: {
                x: ghost.position.x + 10,
                y: ghost.position.y + 5,
            },
        }));

        const nextState = ghostReducer(state, { type: 'MOVE_GHOSTS', ghosts: movedGhosts });

        expect(nextState.ghosts).toEqual(movedGhosts);
    });

    it('resets ghosts to defaults', () => {
        const state = ghostReducer(undefined, { type: '@@INIT' });
        const movedGhosts = state.ghosts.map(ghost => ({
            ...ghost,
            position: {
                x: ghost.position.x + 10,
                y: ghost.position.y + 5,
            },
        }));
        const movedState = ghostReducer(state, { type: 'MOVE_GHOSTS', ghosts: movedGhosts });

        const resetState = ghostReducer(movedState, { type: 'RESET_GHOSTS' });

        expect(resetState).toEqual(state);
    });

    it('resets an eaten ghost to its start position', () => {
        const state = ghostReducer(undefined, { type: '@@INIT' });
        const ghostToEat = state.ghosts[0];
        const movedGhosts = state.ghosts.map(ghost => ({
            ...ghost,
            position: {
                x: ghost.position.x + 10,
                y: ghost.position.y + 5,
            },
        }));
        const movedState = ghostReducer(state, { type: 'MOVE_GHOSTS', ghosts: movedGhosts });

        const updatedState = ghostReducer(movedState, { type: 'GHOST_EATEN', ghostId: ghostToEat.id });
        const resetGhost = updatedState.ghosts.find(ghost => ghost.id === ghostToEat.id);

        expect(resetGhost.position).toEqual(ghostToEat.startPosition);
        expect(resetGhost.direction).toEqual(ghostToEat.startDirection);
    });
});
