export const changePlayerDirection = (direction) => {
    return {
        type: 'CHANGE_DIRECTION',
        direction,
    };
};

export const movePlayer = (timeElapsed) => {
    return {
        type: 'MOVE',
        timeElapsed,
    };
};

export const playerCollided = (timeElapsed) => {
    return {
        type: 'COLLIDED',
        timeElapsed,
    };
};

export const resetPlayer = () => {
    return {
        type: 'RESET_PLAYER',
    };
};
