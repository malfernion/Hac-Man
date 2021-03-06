export const increaseScore = (score) => {
    return {
        type: 'INCREASE_SCORE',
        score,
    };
};

export const lostLife = () => {
    return (dispatch, getState) => {
        const { lives } = getState().gameInfo;
        if(lives === 1) {
            dispatch({
                type: 'PLAYER_DIED',
            });
        } else {
            dispatch({
                type: 'LOST_LIFE',
            });
        }
    };
};

export const ghostKilled = () => {
    return {
            type: 'GHOST_KILLED',
    };
};

export const resetGame = () => {
    return {
        type: 'RESET_GAME',
    };
};

export const startGame = () => {
    return {
        type: 'START_GAME',
    };
};

export const introFinished = () => {
    return {
        type: 'INTRO_FINISHED',
    };
};

export const levelCompleted = () => {
    return {
        type: 'LEVEL_COMPLETED',
    };
};
