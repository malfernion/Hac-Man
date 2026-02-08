import { findCollidingCoin, findCollidingPill, hasWallCollision } from '../collisionHelpers';

describe('collisionHelpers', () => {
  it('detects wall collisions using character bounds', () => {
    const character = {
      position: { x: 5.5, y: 5.5 },
      size: 2,
    };
    const walls = [
      [4, 4, 4, 4],
    ];

    expect(hasWallCollision(character, walls)).toBe(true);
  });

  it('returns undefined when no wall collision occurs', () => {
    const character = {
      position: { x: 1, y: 1 },
      size: 2,
    };
    const walls = [
      [5, 5, 3, 3],
    ];

    expect(hasWallCollision(character, walls)).toBe(false);
  });

  it('finds colliding coins and pills', () => {
    const character = {
      position: { x: 10, y: 10 },
      size: 4,
    };
    const coins = [
      [10, 10],
      [20, 20],
    ];
    const pills = [
      [11, 11],
      [30, 30],
    ];

    expect(findCollidingCoin(character, coins)).toEqual([10, 10]);
    expect(findCollidingPill(character, pills)).toEqual([11, 11]);
  });

  it('returns undefined when no colliding coin or pill exists', () => {
    const character = {
      position: { x: 100, y: 100 },
      size: 4,
    };
    const coins = [
      [10, 10],
    ];
    const pills = [
      [20, 20],
    ];

    expect(findCollidingCoin(character, coins)).toBeUndefined();
    expect(findCollidingPill(character, pills)).toBeUndefined();
  });
});
