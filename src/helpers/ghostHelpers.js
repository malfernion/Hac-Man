import { canChangeDirection, checkAndTransformIntoBounds, getNextCharacterRailPosition } from './movementHelpers';

const tileSize = 28;
const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const oppositeDirection = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
};

const getDirectionalOffset = (direction, distance) => {
    switch(direction) {
        case 'UP':
            return { x: 0, y: -distance };
        case 'DOWN':
            return { x: 0, y: distance };
        case 'LEFT':
            return { x: -distance, y: 0 };
        case 'RIGHT':
            return { x: distance, y: 0 };
        default:
            return { x: 0, y: 0 };
    }
};

const getPinkyTarget = (player) => {
    const offset = getDirectionalOffset(player.direction, tileSize * 4);
    return {
        x: player.position.x + offset.x,
        y: player.position.y + offset.y,
    };
};

const getInkyTarget = (player, blinky) => {
    if(!blinky) {
        return Object.assign({}, player.position);
    }

    const offset = getDirectionalOffset(player.direction, tileSize * 2);
    const ahead = {
        x: player.position.x + offset.x,
        y: player.position.y + offset.y,
    };
    const vector = {
        x: ahead.x - blinky.position.x,
        y: ahead.y - blinky.position.y,
    };

    return {
        x: blinky.position.x + vector.x * 2,
        y: blinky.position.y + vector.y * 2,
    };
};

const getClydeTarget = (ghost, player) => {
    const distance = Math.hypot(player.position.x - ghost.position.x, player.position.y - ghost.position.y);
    if(distance > tileSize * 8) {
        return Object.assign({}, player.position);
    }
    return Object.assign({}, ghost.scatterTarget);
};

const getFleeTarget = (ghost, player) => ({
    x: ghost.position.x + (ghost.position.x - player.position.x),
    y: ghost.position.y + (ghost.position.y - player.position.y),
});

export const getGhostTarget = ({ ghost, player, ghosts, poweredUp }) => {
    if(poweredUp) {
        return getFleeTarget(ghost, player);
    }

    switch(ghost.id) {
        case 'blinky':
            return Object.assign({}, player.position);
        case 'pinky':
            return getPinkyTarget(player);
        case 'inky':
            return getInkyTarget(player, ghosts.find(({ id }) => id === 'blinky'));
        case 'clyde':
            return getClydeTarget(ghost, player);
        default:
            return Object.assign({}, player.position);
    }
};

const getAvailableDirections = (ghost, walls, timeElapsed) =>
    directions.filter(direction => canChangeDirection(ghost, direction, walls, timeElapsed));

const getDirectionScore = (ghost, direction, target, walls) => {
    const stepDuration = tileSize / ghost.speed;
    const nextPosition = getNextCharacterRailPosition(ghost, direction, stepDuration, walls).position;
    return Math.hypot(target.x - nextPosition.x, target.y - nextPosition.y);
};

const chooseDirection = ({ ghost, target, availableDirections, walls, poweredUp }) => {
    const validDirections = availableDirections.length
        ? availableDirections
        : [ghost.direction || 'LEFT'];

    const options = validDirections.filter(direction => direction !== oppositeDirection[ghost.direction]);
    const considered = options.length ? options : validDirections;

    return considered.reduce((bestDirection, direction) => {
        if(!bestDirection) {
            return direction;
        }
        const bestScore = getDirectionScore(ghost, bestDirection, target, walls);
        const nextScore = getDirectionScore(ghost, direction, target, walls);
        if(poweredUp) {
            return nextScore > bestScore ? direction : bestDirection;
        }
        return nextScore < bestScore ? direction : bestDirection;
    }, null);
};

export const getNextGhostStates = ({ ghosts, player, walls, timeElapsed, poweredUp }) => {
    return ghosts.map(ghost => {
        const target = getGhostTarget({ ghost, player, ghosts, poweredUp });
        const availableDirections = getAvailableDirections(ghost, walls, timeElapsed);
        const moveResult = getNextCharacterRailPosition(ghost, ghost.direction, timeElapsed, walls);
        const shouldChooseNewDirection = moveResult.blocked || availableDirections.some(direction => direction !== ghost.direction);

        const nextDirection = shouldChooseNewDirection
            ? chooseDirection({ ghost, target, availableDirections, walls, poweredUp })
            : ghost.direction;

        const finalMove = getNextCharacterRailPosition(ghost, nextDirection, timeElapsed, walls);
        const nextPosition = Object.assign({}, finalMove.position);
        checkAndTransformIntoBounds(nextPosition);

        return Object.assign({}, ghost, {
            direction: nextDirection,
            position: nextPosition,
        });
    });
};

export const ghostConstants = {
    tileSize,
};
