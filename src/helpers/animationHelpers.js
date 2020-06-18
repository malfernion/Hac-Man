/**
 * Gets the sprite coordinates for a character based on their direction and number of frames spent moving
 * @param {*} character the character to determine the sprite coordinates for
 */
export function getSpriteCords (character) {
    const { direction, sprites, spriteCords, animationFrameCount, framesPerSprite } = character;
    if(!direction) {
        return spriteCords;
    }

    const spriteRow = sprites[direction];
    const spriteIndex = Math.floor(animationFrameCount/framesPerSprite) % spriteRow.length;
    return spriteRow[spriteIndex];
}