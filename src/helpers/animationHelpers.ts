import { PlayerState } from '../types';

/**
 * Returns the sprite sheet coordinates for the current animation frame.
 * If the character has no direction, returns the current sprite (idle pose).
 */
export function getSpriteCords(character: Pick<PlayerState, 'direction' | 'spriteCords' | 'sprites' | 'animationFrameCount' | 'framesPerSprite'>): [number, number] {
  if (!character.direction) {
    return character.spriteCords;
  }
  const spriteRow = character.sprites[character.direction];
  const spriteIndex = Math.floor(character.animationFrameCount / character.framesPerSprite) % spriteRow.length;
  return spriteRow[spriteIndex];
}
