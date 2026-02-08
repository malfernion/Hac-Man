const boardSize = 812;
const tileSize = 28;
const railCenterOffset = tileSize / 2;
const railSnapThreshold = tileSize * 0.3;
const tileIndexEpsilon = 1e-6;
const blockedTilesCache = new WeakMap();

const getClosestRailCoord = (coord) =>
    Math.round((coord - railCenterOffset) / tileSize) * tileSize + railCenterOffset;

const getTileCenter = (tileIndex) => tileIndex * tileSize + railCenterOffset;

const getTileIndexForDirection = (coord, direction) => {
    if(direction === 'LEFT' || direction === 'UP') {
        return Math.floor((coord + tileIndexEpsilon) / tileSize);
    }
    if(direction === 'RIGHT' || direction === 'DOWN') {
        return Math.floor((coord - tileIndexEpsilon) / tileSize);
    }
    return Math.round((coord - railCenterOffset) / tileSize);
};

const buildBlockedTiles = (walls) => {
    if(blockedTilesCache.has(walls)) {
        return blockedTilesCache.get(walls);
    }

    const blockedTiles = new Set();
    for (const wall of walls) {
        const startX = Math.floor(wall[0] / tileSize);
        const endX = Math.ceil((wall[0] + wall[2]) / tileSize) - 1;
        const startY = Math.floor(wall[1] / tileSize);
        const endY = Math.ceil((wall[1] + wall[3]) / tileSize) - 1;

        for (let x = startX; x <= endX; x += 1) {
            for (let y = startY; y <= endY; y += 1) {
                blockedTiles.add(`${x},${y}`);
            }
        }
    }

    blockedTilesCache.set(walls, blockedTiles);
    return blockedTiles;
};

const isTileBlocked = (tileX, tileY, walls) => {
    const blockedTiles = buildBlockedTiles(walls);
    return blockedTiles.has(`${tileX},${tileY}`);
};

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

const getRailMoveResult = (character, direction, duration, walls) => {
    const { position, speed } = character;
    if(!direction || duration === 0) {
        return { position: Object.assign({}, position), blocked: false };
    }

    const moveAmount = Math.max(0, speed * duration);
    const alignedPosition = alignPositionToRail(position, direction);
    let coord = direction === 'LEFT' || direction === 'RIGHT' ? alignedPosition.x : alignedPosition.y;
    const fixedCoord = direction === 'LEFT' || direction === 'RIGHT'
        ? alignedPosition.y
        : alignedPosition.x;
    const fixedTileIndex = getTileIndexForDirection(fixedCoord, direction);
    const step = direction === 'LEFT' || direction === 'UP' ? -1 : 1;

    let remaining = moveAmount;
    let blocked = false;

    while(remaining > 0) {
        const tileIndex = getTileIndexForDirection(coord, direction);
        const tileCenter = getTileCenter(tileIndex);
        const boundary = tileCenter + step * (tileSize / 2);
        const distanceToBoundary = step > 0 ? boundary - coord : coord - boundary;

        if(distanceToBoundary === 0) {
            coord += step * tileIndexEpsilon;
            remaining = Math.max(0, remaining - tileIndexEpsilon);
            continue;
        }

        if(distanceToBoundary >= remaining) {
            coord += step * remaining;
            remaining = 0;
            break;
        }

        coord = boundary;
        remaining -= distanceToBoundary;

        const nextTileIndex = tileIndex + step;
        const nextTileBlocked = direction === 'LEFT' || direction === 'RIGHT'
            ? isTileBlocked(nextTileIndex, fixedTileIndex, walls)
            : isTileBlocked(fixedTileIndex, nextTileIndex, walls);

        if(nextTileBlocked) {
            blocked = true;
            remaining = 0;
            break;
        }
    }

    const nextPosition = Object.assign({}, alignedPosition);
    if(direction === 'LEFT' || direction === 'RIGHT') {
        nextPosition.x = coord;
    } else {
        nextPosition.y = coord;
    }

    return { position: nextPosition, blocked };
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

    if(getDistanceFromRail(character.position, nextDirection) > railSnapThreshold) {
        return false;
    }

    const alignedPosition = alignPositionToRail(character.position, nextDirection);
    const movingCoord = nextDirection === 'LEFT' || nextDirection === 'RIGHT'
        ? alignedPosition.x
        : alignedPosition.y;
    const fixedCoord = nextDirection === 'LEFT' || nextDirection === 'RIGHT'
        ? alignedPosition.y
        : alignedPosition.x;
    const movingTileIndex = getTileIndexForDirection(movingCoord, nextDirection);
    const fixedTileIndex = getTileIndexForDirection(fixedCoord, nextDirection);
    const step = nextDirection === 'LEFT' || nextDirection === 'UP' ? -1 : 1;
    const nextTileIndex = movingTileIndex + step;

    const nextTileBlocked = nextDirection === 'LEFT' || nextDirection === 'RIGHT'
        ? isTileBlocked(nextTileIndex, fixedTileIndex, walls)
        : isTileBlocked(fixedTileIndex, nextTileIndex, walls);

    return !nextTileBlocked;
}
