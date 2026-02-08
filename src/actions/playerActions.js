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

export const movePlayer = (timeElapsed, position) => {
    return {
        type: 'MOVE',
        timeElapsed,
        position,
    };
};

export const playerCollided = (timeElapsed, position) => {
    return {
        type: 'COLLIDED',
        timeElapsed,
        position,
    };
};

export const resetPlayer = () => {
    return {
        type: 'RESET_PLAYER',
    };
};

export const resetPlayerAnimation = () => {
    return {
        type: 'RESET_PLAYER_ANIMATION',
    };
};
