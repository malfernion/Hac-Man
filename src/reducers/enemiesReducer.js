import { getNextCharacterPositionForDirection, checkAndTransformIntoBounds } from '../helpers/movementHelpers';
import { getSpriteCords } from '../helpers/animationHelpers';

const defaultState = [
    {
        position: {
            x: 14.5*28,
            y: 28.5*28,
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
        framesPerSprite: 3,
    },
];

export default (state = JSON.parse(JSON.stringify(defaultState)), action) => {
    // Get the state for the enemy being acted upon
    const clonedState = JSON.parse(JSON.stringify(state));
    

    switch(action.type) {
        case 'DIRECTION_CHANGE':
            clonedState[action.enemyIndex].direction = action.direction;
            return clonedState;
        case 'MOVE':
            const enemyState = clonedState[action.enemyIndex];
            let newPosition = getNextCharacterPositionForDirection(enemyState, enemyState.direction, action.timeElapsed);
            checkAndTransformIntoBounds(newPosition);
            
            enemyState.position = newPosition;
            enemyState.animationFrameCount++;
            enemyState.spriteCords = getSpriteCords(enemyState);
            clonedState[action.enemyIndex] = enemyState;

            return clonedState;
        case 'RESET':
            return clonedState;
        default:
            return state;
    }
}