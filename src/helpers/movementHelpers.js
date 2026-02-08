const boardSize = 812;
const tileSize = 28;
const railCenterOffset = tileSize / 2;
const railSnapThreshold = tileSize * 0.3;

const getClosestRailCoord = (coord) =>
    Math.round((coord - railCenterOffset) / tileSize) * tileSize + railCenterOffset;

const alignPositionToRail = (position, direction) => {
    const aligned = Object.assign({}, position);
    if(direction === 'LEFT' || direction === 'RIGHT') {
        aligned.y = getClosestRailCoord(position.y);
    } else if(direction === 'UP' || direction === 'DOWN') {
        aligned.x = getClosestRailCoord(position.x);
    }
    return aligned;
};

const getDistanceFromRail = (position, direction) => {
    if(direction === 'LEFT' || direction === 'RIGHT') {
        return Math.abs(position.y - getClosestRailCoord(position.y));
    }
    if(direction === 'UP' || direction === 'DOWN') {
        return Math.abs(position.x - getClosestRailCoord(position.x));
    }
    return Infinity;
};

const alignPositionToRailIfClose = (position, direction, force = false) => {
    const distance = getDistanceFromRail(position, direction);
    if(force || distance <= railSnapThreshold) {
        return alignPositionToRail(position, direction);
    }
    return Object.assign({}, position);
};

const getAxisDetails = (direction) => {
    const horizontal = direction === 'LEFT' || direction === 'RIGHT';
    return {
        axis: horizontal ? 'x' : 'y',
        fixedAxis: horizontal ? 'y' : 'x',
        step: direction === 'LEFT' || direction === 'UP' ? -1 : 1,
    };
};

const snapStopCoordToRail = (coord, step) => {
    const snapped = getClosestRailCoord(coord);
    if(step > 0) {
        return Math.min(snapped, coord);
    }
    return Math.max(snapped, coord);
};

const clampAxisMovement = (startCoord, desiredCoord, fixedCoord, size, axis, step, walls) => {
    let coord = desiredCoord;
    let blocked = false;
    const halfSize = size / 2;

    for (const wall of walls) {
        const wallLowerX = wall[0];
        const wallLowerY = wall[1];
        const wallUpperX = wallLowerX + wall[2];
        const wallUpperY = wallLowerY + wall[3];

        if(axis === 'x') {
            const characterLowerY = fixedCoord - halfSize;
            const characterUpperY = fixedCoord + halfSize;
            if(characterUpperY <= wallLowerY || characterLowerY >= wallUpperY) {
                continue;
            }

            if(step > 0) {
                const boundary = wallLowerX - halfSize;
                if(boundary >= startCoord && boundary < coord && boundary <= desiredCoord) {
                    coord = snapStopCoordToRail(boundary, step);
                    blocked = true;
                }
            } else {
                const boundary = wallUpperX + halfSize;
                if(boundary <= startCoord && boundary > coord && boundary >= desiredCoord) {
                    coord = snapStopCoordToRail(boundary, step);
                    blocked = true;
                }
            }
        } else {
            const characterLowerX = fixedCoord - halfSize;
            const characterUpperX = fixedCoord + halfSize;
            if(characterUpperX <= wallLowerX || characterLowerX >= wallUpperX) {
                continue;
            }

            if(step > 0) {
                const boundary = wallLowerY - halfSize;
                if(boundary >= startCoord && boundary < coord && boundary <= desiredCoord) {
                    coord = snapStopCoordToRail(boundary, step);
                    blocked = true;
                }
            } else {
                const boundary = wallUpperY + halfSize;
                if(boundary <= startCoord && boundary > coord && boundary >= desiredCoord) {
                    coord = snapStopCoordToRail(boundary, step);
                    blocked = true;
                }
            }
        }
    }

    return { coord, blocked };
};

const getRailMoveResult = (character, direction, duration, walls) => {
    const { position, speed } = character;
    if(!direction || duration === 0) {
        return { position: Object.assign({}, position), blocked: false };
    }

    const moveAmount = Math.max(0, speed * duration);
    const alignedPosition = alignPositionToRailIfClose(position, direction);
    const { axis, fixedAxis, step } = getAxisDetails(direction);
    const startCoord = alignedPosition[axis];
    const desiredCoord = startCoord + step * moveAmount;
    const size = character.size === undefined ? tileSize - 1 : character.size;

    const result = clampAxisMovement(
        startCoord,
        desiredCoord,
        alignedPosition[fixedAxis],
        size,
        axis,
        step,
        walls,
    );

    const nextPosition = Object.assign({}, alignedPosition);
    nextPosition[axis] = result.coord;

    return { position: nextPosition, blocked: result.blocked };
};

/**
 * Generates the next position for a character along a certain direction given a time interval
 * @param {*} character the character to produce a new position for
 * @param {*} direction the direction to move the position in
 * @param {*} duration the duration of the movement
 */
export function getNextCharacterPositionForDirection (character, direction, duration) {
    return getRailMoveResult(character, direction, duration, []).position;
}

export function getNextCharacterRailPosition(character, direction, duration, walls) {
    return getRailMoveResult(character, direction, duration, walls);
}

/**
 * Check if a position is outside of the edge of the board, wrapping it to the opposite side
 * @param {*} position the position to check and transform if needed
 */
export function checkAndTransformIntoBounds(position) {
    const wrap = (coord) => {
        const wrapped = ((coord % boardSize) + boardSize) % boardSize;
        return wrapped;
    };

    position.x = wrap(position.x);
    position.y = wrap(position.y);
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

    if(getDistanceFromRail(character.position, nextDirection) > railSnapThreshold) {
        return false;
    }

    const alignedPosition = alignPositionToRailIfClose(character.position, nextDirection, true);
    const { axis, fixedAxis, step } = getAxisDetails(nextDirection);
    const startCoord = alignedPosition[axis];
    const moveAmount = tileSize;
    const desiredCoord = startCoord + step * moveAmount;
    const size = character.size === undefined ? tileSize - 1 : character.size;

    const result = clampAxisMovement(
        startCoord,
        desiredCoord,
        alignedPosition[fixedAxis],
        size,
        axis,
        step,
        walls,
    );

    return !result.blocked;
}
