const defaultState = {
    position: {
        x: 400,
        y: 400
    },
    direction: 'NONE',
};

const speed = 80;

export default (state = Object.assign({}, defaultState), action) => {
    switch(action.type) {
        case 'CHANGE_DIRECTION':
            return Object.assign({}, state, {
                direction: action.direction,
            });
        case 'MOVE':
            const newPosition = Object.assign({}, state.position);
            const moveAmount = action.timeElapsed * speed;

            switch(state.direction) {
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

            return Object.assign({}, state, {
                position: newPosition,
            });
        case 'RESET_PLAYER':
            return Object.assign({}, defaultState);
        default:
            return state;
    }
}