import { levels } from '../data/levels';

const boardSize = 812;
const drawingScale = boardSize/29;
const scaleItem = (item) => item.map(itemParam => itemParam*drawingScale);

const scaledLevels = levels.map(level => {
    let { name, characters, walls, coins } = level;

    return {
        name,
        characters,
        walls: walls.map(scaleItem),
        coins: coins.map(scaleItem)
    }
});

const defaultState = {
    currentLevelNumber: 0,
    currentLevel: JSON.parse(JSON.stringify(scaledLevels[0])),
    levels: scaledLevels,
    wallRenderWidth: 12,
    boardSize
};


export default (state = Object.assign({}, defaultState), action) => {
    switch(action.type) {
        case 'PROGRESS_LEVEL':
            const newLevelNumber = ++state.currentLevelNumber;
            return Object.assign({}, state, {
                currentLevelNumber: newLevelNumber,
                currentLevel: Object.assign({}, state.levels[newLevelNumber]),
            });
        case 'RESET_LEVEL_PROGRESS':
            return JSON.parse(JSON.stringify(defaultState));
        case 'COIN_COLLECTED':
            const newState = JSON.parse(JSON.stringify(state));
            newState.currentLevel.coins.splice(state.currentLevel.coins.indexOf(action.coin), 1);
            return newState;
        default:
            return state;
    }
}
