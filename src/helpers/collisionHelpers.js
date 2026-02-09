/**
 * Determine if a given array of coordinates have any that are within the given wall
 * @param {*} cords an array of coordinates in [x, y] format
 * @param {*} wall the array definition of a wall in [x0, y0, xlen, ylen] format
 */
export function areAnyCordsWithinWall (cords, wall) {
    const wallLowerX = wall[0];
    const wallLowerY = wall[1];
    const wallUpperX = wallLowerX + wall[2];
    const wallUpperY = wallLowerY + wall[3];

    for (const cord of cords) {
        if((cord[0] > wallLowerX && cord[0] < wallUpperX) && (cord[1] > wallLowerY && cord[1] < wallUpperY)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks for collision between the passed character and walls of the current level
 * @param {*} character the character to check for collisions
 * @param {*} walls the array of walls to check for collisions against
 */
export function hasWallCollision (character, walls) {
    const { position, size } = character;
    const characterLowerX = position.x - size/2;
    const characterUpperX = position.x + size/2;
    const characterLowerY = position.y - size/2;
    const characterUpperY = position.y + size/2;

    //check if the player bounding box overlaps any wall
    for (const wall of walls) {
        const wallLowerX = wall[0];
        const wallLowerY = wall[1];
        const wallUpperX = wallLowerX + wall[2];
        const wallUpperY = wallLowerY + wall[3];

        const overlapX = characterLowerX < wallUpperX && characterUpperX > wallLowerX;
        const overlapY = characterLowerY < wallUpperY && characterUpperY > wallLowerY;

        if(overlapX && overlapY) {
            return true;
        }
    }
    return false;
}

/**
 * Checks for collisions between the passed character and coins of the current level, returning the colliding coin
 * @param {*} character the character to check for collisions
 * @param {*} walls the array of coins to check for collisions against
 */
function findCollidingPoint(character, points) {
    const { position, size } = character;
    const characterLowerX = position.x - size/2;
    const characterUpperX = position.x + size/2;
    const characterLowerY = position.y - size/2;
    const characterUpperY = position.y + size/2;

    for (const point of points) {
        const cx = point[0];
        const cy = point[1];

        if((cx > characterLowerX && cx < characterUpperX) && (cy > characterLowerY && cy < characterUpperY)) {
            return point;
        }
    }
}

/**
 * Checks for collisions between the passed character and coins of the current level, returning the colliding coin
 * @param {*} character the character to check for collisions
 * @param {*} walls the array of coins to check for collisions against
 */
export function findCollidingCoin (character, coins) {
    return findCollidingPoint(character, coins);
}

/**
 * Checks for collisions between the passed character and power pills of the current level, returning the colliding pill
 * @param {*} character the character to check for collisions
 * @param {*} pills the array of pills to check for collisions against
 */
export function findCollidingPill (character, pills) {
    return findCollidingPoint(character, pills);
}

/**
 * Checks for collision between the player and any ghosts, returning the colliding ghost
 * @param {*} character the player character to check for collisions
 * @param {*} ghosts the array of ghosts to check for collisions against
 */
export function findCollidingGhost (character, ghosts) {
    const { position, size } = character;
    const collisionRadius = size / 2;

    for (const ghost of ghosts) {
        const ghostRadius = ghost.size / 2;
        const distance = Math.hypot(position.x - ghost.position.x, position.y - ghost.position.y);
        if(distance <= collisionRadius + ghostRadius) {
            return ghost;
        }
    }
}
