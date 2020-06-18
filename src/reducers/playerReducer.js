import { getNextCharacterPositionForDirection, checkAndTransformIntoBounds } from '../helpers/movementHelpers';

const defaultState = {
    position: {
        x: 14.5*28,
        y: 10.5*28,
    },
    size: 27,
    speed: 120
};

export default (state = Object.assign({}, defaultState), action) => {
    switch(action.type) {
        case 'DIRECTION_PRESSED':
            const { direction } = state;
            let newState = Object.assign({}, state);
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
            });
        case 'COLLIDED':
            // move the player back to their previous position and stop them moving
            return Object.assign({}, state, {
                position: getNextCharacterPositionForDirection(state, state.direction, -action.timeElapsed),
                direction: null
            });
        case 'RESET_PLAYER':
            return Object.assign({}, defaultState);
        default:
            return state;
    }
}