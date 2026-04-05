import { findCollidingCoin, findCollidingPill } from '../collisionHelpers';

describe('collisionHelpers', () => {
  it('finds colliding coins and pills', () => {
    const character = {
      position: { x: 10, y: 10 },
      size: 4,
    };
    const coins = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    const pills = [
      { x: 11, y: 11 },
      { x: 30, y: 30 },
    ];

    expect(findCollidingCoin(character, coins)).toEqual({ x: 10, y: 10 });
    expect(findCollidingPill(character, pills)).toEqual({ x: 11, y: 11 });
  });

  it('returns undefined when no colliding coin or pill exists', () => {
    const character = {
      position: { x: 100, y: 100 },
      size: 4,
    };
    const coins = [{ x: 10, y: 10 }];
    const pills = [{ x: 20, y: 20 }];

    expect(findCollidingCoin(character, coins)).toBeUndefined();
    expect(findCollidingPill(character, pills)).toBeUndefined();
  });
});
