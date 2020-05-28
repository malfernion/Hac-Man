const defaultState = {
    debug: false,
    score: 0,
    lives: 3,
    killCount: 0,
    showGameOver: false,
    gameStarted: false,
    tickDuration: 1 / 60
};

export default (state = Object.assign({}, defaultState), action) => {
    switch(action.type) {
        case 'SWITCH_DEBUG':
            return Object.assign({}, state, {
                debug: !state.debug,
            });
        case 'INCREASE_SCORE':
            return Object.assign({}, state, {
                score: state.score + action.score,
            });
        case 'LOST_LIFE':
            return Object.assign({}, state, {
                lives: --state.lives,
            });
        case 'GHOST_KILLED':
            return Object.assign({}, state, {
                killCount: ++state.killCount,
            });
        case 'PLAYER_DIED':
            return Object.assign({}, state, {
                showGameOver: true,
            });
        case 'RESET_GAME':
            return Object.assign({}, defaultState);
        case 'START_GAME':
            return Object.assign({}, state, {
                gameStarted: true,
            });
        default:
            return state;
    }
}