import levels from '../data/levels';

const boardSize = 812;
const drawingScale = boardSize/29;

const scaledLevels = levels.levels.map(level => {
    let { name, characters, walls } = level;

    return {
        name,
        characters,
        walls: walls.map(
            wall => wall.map(
                wallParam => wallParam*drawingScale
        )),
    }
});

const defaultState = {
    currentLevelNumber: 0,
    currentLevel: scaledLevels[0],
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
                currentLevel: state.levels[newLevelNumber],
            });
        case 'RESET_LEVEL_PROGRESS':
            return Object.assign({}, defaultState);
        default:
            return state;
    }
}
