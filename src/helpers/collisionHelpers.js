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
    const boundingCords = [
        // tl
        [position.x - size/2, position.y - size/2],
        // tr
        [position.x + size/2, position.y - size/2],
        // bl
        [position.x - size/2, position.y + size/2],
        // br
        [position.x + size/2, position.y + size/2]
    ];

    //check if the player bounding cords are within any wall
    for (const wall of walls) {
        if(areAnyCordsWithinWall(boundingCords, wall)) {
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
export function findCollidingCoin (character, coins) {
    const { position, size } = character;
    const characterLowerX = position.x - size/2;
    const characterUpperX = position.x + size/2;
    const characterLowerY = position.y - size/2;
    const characterUpperY = position.y + size/2;

    for (const coin of coins) {
        const cx = coin[0];
        const cy = coin[1];

        if((cx > characterLowerX && cx < characterUpperX) && (cy > characterLowerY && cy < characterUpperY)) {
            return coin;
        }
    }
}