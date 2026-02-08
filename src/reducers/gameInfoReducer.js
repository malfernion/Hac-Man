const defaultState = {
    score: 0,
    lives: 3,
    killCount: 0,
    showGameOver: false,
    gameStarted: false,
    playingIntro: false,
    showStageName: true,
    levelCompleted: false,
    poweredUp: false,
    powerModeEndsAt: null,
};

export default (state = Object.assign({}, defaultState), action) => {
    switch(action.type) {
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
        case 'POWER_MODE_STARTED':
            return Object.assign({}, state, {
                poweredUp: true,
                powerModeEndsAt: action.endsAt,
            });
        case 'POWER_MODE_ENDED':
            return Object.assign({}, state, {
                poweredUp: false,
                powerModeEndsAt: null,
            });
        case 'RESET_GAME':
            return Object.assign({}, defaultState);
        case 'START_GAME':
            return Object.assign({}, state, {
                playingIntro: true,
                showStageName: false,
            });
        case 'INTRO_FINISHED':
            return Object.assign({}, state, {
                gameStarted: true,
            });
        case 'LEVEL_COMPLETED':
            return Object.assign({}, state, {
                gameStarted: false,
                levelCompleted: true,
            });
        default:
            return state;
    }
}
