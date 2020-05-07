const defaultState = {
    position: {
        x: 400,
        y: 400
    },
    size: 20,
    direction: 'NONE',
};

const speed = 80;
const boardSize = 800;

function checkAndTransformIntoBounds(position) {
    if(position.x > boardSize) {
        position.x -= boardSize;
    } else if (position.x < 0) {
        position.x +=boardSize;
    }

    if(position.y > boardSize) {
        position.y -= boardSize;
    } else if (position.y < 0) {
        position.y += boardSize;
    }
};

function getNewPosition(position, direction, moveAmount) {
    const newPosition = Object.assign({}, position);

    switch(direction) {
        case 'UP':
            newPosition.y -= moveAmount;
            break;
        case 'DOWN':
            newPosition.y += moveAmount;
            break;
        case 'LEFT':
            newPosition.x -= moveAmount;
            break;
        case 'RIGHT':
            newPosition.x += moveAmount;
            break;
        default:
            // default is not to move
    }

    return newPosition;
};

export default (state = Object.assign({}, defaultState), action) => {
    let moveAmount, newPosition;

    switch(action.type) {
        case 'CHANGE_DIRECTION':
            return Object.assign({}, state, {
                direction: action.direction,
            });
        case 'MOVE':
            moveAmount = action.timeElapsed * speed;
            newPosition = getNewPosition(state.position, state.direction, moveAmount);
            checkAndTransformIntoBounds(newPosition);
            
            return Object.assign({}, state, {
                position: newPosition,
            });
        case 'COLLIDED':
            // move the player back to their previous position and stop them moving
            moveAmount = -action.timeElapsed * speed;
            newPosition = getNewPosition(state.position, state.direction, moveAmount);

            return Object.assign({}, state, {
                position: newPosition,
                direction: 'NONE',
            });
        case 'RESET_PLAYER':
            return Object.assign({}, defaultState);
        default:
            return state;
    }
}