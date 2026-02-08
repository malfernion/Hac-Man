import { getSpriteCords } from '../animationHelpers';

describe('animationHelpers', () => {
  it('returns the current sprite when no direction is set', () => {
    const character = {
      direction: null,
      sprites: {},
      spriteCords: [1, 2],
      animationFrameCount: 0,
      framesPerSprite: 1,
    };

    expect(getSpriteCords(character)).toEqual([1, 2]);
  });

  it('cycles through sprite frames for the active direction', () => {
    const character = {
      direction: 'RIGHT',
      sprites: {
        RIGHT: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      },
      spriteCords: [0, 0],
      animationFrameCount: 4,
      framesPerSprite: 2,
    };

    expect(getSpriteCords(character)).toEqual([2, 0]);
  });
});
