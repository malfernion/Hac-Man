import { getNextCharacterPositionForDirection, checkAndTransformIntoBounds } from '../helpers/movementHelpers';
import { getSpriteCords } from '../helpers/animationHelpers';

const defaultState = {
    position: {
        x: 14.5*28,
        y: 22.5*28,
    },
    size: 27,
    speed: 120,
    sprites: {
        'RIGHT': [
            [34, 0],
            [18, 0],
            [2, 0]
        ],
        'LEFT': [
            [34, 0],
            [18, 16],
            [2, 16]
        ],
        'DOWN': [
            [34, 0],
            [18, 48],
            [2, 48]
        ],
        'UP': [
            [34, 0],
            [18, 32],
            [2, 32]
        ]
    },
    spriteCords: [34, 0],
    animationFrameCount: 0,
    framesPerSprite: 3
};

const playerReducer = (state = Object.assign({}, defaultState), action) => {
    switch(action.type) {
        case 'DIRECTION_PRESSED':
            const { direction } = state;
            const newState = Object.assign({}, state);
            if(direction) {
                newState.nextDirection = action.direction;
            } else {
                newState.direction = action.direction;
            }
            return newState;
        case 'CHANGE_TO_NEXT_DIRECTION':
            return Object.assign({}, state, {
                direction: state.nextDirection,
                nextDirection: null
            });
        case 'MOVE':
            let newPosition = getNextCharacterPositionForDirection(state, state.direction, action.timeElapsed);
            checkAndTransformIntoBounds(newPosition);
            
            return Object.assign({}, state, {
                position: newPosition,
                animationFrameCount: state.animationFrameCount + 1,
                spriteCords: getSpriteCords(state)
            });
        case 'COLLIDED':
            // move the player back to their previous position and stop them moving
            return Object.assign({}, state, {
                position: action.position
                    ? action.position
                    : getNextCharacterPositionForDirection(state, state.direction, -action.timeElapsed),
                direction: null
            });
        case 'RESET_PLAYER':
            return Object.assign({}, defaultState);
        case 'RESET_PLAYER_ANIMATION':
            return Object.assign({}, state, {
                spriteCords: defaultState.spriteCords,
            });
        default:
            return state;
    }
};

export default playerReducer;
