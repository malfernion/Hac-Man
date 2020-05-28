export const directionPressed = (direction) => {
    return {
        type: 'DIRECTION_PRESSED',
        direction,
    };
};

export const changeToNextDirection = () => {
    return {
        type: 'CHANGE_TO_NEXT_DIRECTION',
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
