export const changeEnemyDirection = (direction, enemyIndex) => {
    return {
        type: 'DIRECTION_CHANGE',
        direction,
        enemyIndex,
    };
};

export const moveEnemy = (timeElapsed, enemyIndex) => {
    return {
        type: 'MOVE',
        timeElapsed,
        enemyIndex,
    };
};

export const resetEnemies = () => {
    return {
        type: 'RESET',
    };
};
