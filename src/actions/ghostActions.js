export const moveGhosts = (ghosts) => ({
    type: 'MOVE_GHOSTS',
    ghosts,
});

export const resetGhosts = () => ({
    type: 'RESET_GHOSTS',
});

export const ghostEaten = (ghostId) => ({
    type: 'GHOST_EATEN',
    ghostId,
});
