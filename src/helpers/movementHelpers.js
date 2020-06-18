import { hasWallCollision } from "./collisionHelpers";

const boardSize = 812;

/**
 * Generates the next position for a character along a certain direction given a time interval
 * @param {*} character the character to produce a new position for
 * @param {*} direction the direction to move the position in
 * @param {*} duration the duration of the movement
 */
export function getNextCharacterPositionForDirection (character, direction, duration) {
    const { position, speed } = character;
    const moveAmount = speed * duration;
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
}

/**
 * Check if a position is outside of the edge of the board, wrapping it to the opposite side
 * @param {*} position the position to check and transform if needed
 */
export function checkAndTransformIntoBounds(position) {
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

/**
 * Check if the character can change to the next direction
 * @param {*} character the character to be checked
 * @param {*} nextDirection the desired direction
 * @param {*} walls the walls the character could collide with
 * @param {*} duration the duration of move to check for
 */
export function canChangeDirection(character, nextDirection, walls, duration) {
    if(!nextDirection) {
        return false;
    }

    const nextCords = getNextCharacterPositionForDirection(character, nextDirection, duration);
    if(hasWallCollision({ position: nextCords, size: character.size}, walls)) {
        return false;
    }
    return true;
}