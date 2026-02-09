import { ddGhostDefinitions } from '../data/ghosts';

const boardSize = 812;
const tileSize = boardSize / 29;

const createGhostFromDefinition = (definition) => {
    const startPosition = {
        x: definition.start[0] * tileSize,
        y: definition.start[1] * tileSize,
    };

    return {
        id: definition.id,
        name: definition.name,
        personality: definition.personality,
        personalityDescription: definition.personalityDescription,
        color: definition.color,
        speed: definition.speed,
        size: tileSize - 4,
        direction: definition.startDirection,
        startDirection: definition.startDirection,
        startPosition,
        scatterTarget: {
            x: definition.scatter[0] * tileSize,
            y: definition.scatter[1] * tileSize,
        },
        position: Object.assign({}, startPosition),
    };
};

const createDefaultState = () => ({
    ghosts: ddGhostDefinitions.map(createGhostFromDefinition),
});

const ghostReducer = (state = createDefaultState(), action) => {
    switch(action.type) {
        case 'MOVE_GHOSTS':
            return Object.assign({}, state, {
                ghosts: action.ghosts,
            });
        case 'GHOST_EATEN': {
            const updated = state.ghosts.map(ghost => {
                if(ghost.id !== action.ghostId) {
                    return ghost;
                }
                return Object.assign({}, ghost, {
                    position: Object.assign({}, ghost.startPosition),
                    direction: ghost.startDirection,
                });
            });
            return Object.assign({}, state, { ghosts: updated });
        }
        case 'RESET_GHOSTS':
        case 'RESET_GAME':
        case 'RESET_LEVEL_PROGRESS':
            return createDefaultState();
        default:
            return state;
    }
};

export default ghostReducer;
