import { canChangeDirection, checkAndTransformIntoBounds, getNextCharacterPositionForDirection } from '../movementHelpers';

describe('movementHelpers', () => {
  it('calculates the next position for each direction', () => {
    const character = {
      position: { x: 10, y: 10 },
      speed: 5,
    };

    expect(getNextCharacterPositionForDirection(character, 'UP', 1)).toEqual({ x: 10, y: 5 });
    expect(getNextCharacterPositionForDirection(character, 'DOWN', 1)).toEqual({ x: 10, y: 15 });
    expect(getNextCharacterPositionForDirection(character, 'LEFT', 2)).toEqual({ x: 0, y: 10 });
    expect(getNextCharacterPositionForDirection(character, 'RIGHT', 2)).toEqual({ x: 20, y: 10 });
  });

  it('wraps positions that move beyond the board bounds', () => {
    const position = { x: 820, y: -5 };
    checkAndTransformIntoBounds(position);

    expect(position.x).toBe(8);
    expect(position.y).toBe(807);
  });

  it('returns false when there is no next direction', () => {
    const character = {
      position: { x: 5, y: 5 },
      speed: 10,
      size: 2,
    };
    const walls = [];

    expect(canChangeDirection(character, null, walls, 0.1)).toBe(false);
  });

  it('prevents direction changes when a wall blocks the next move', () => {
    const character = {
      position: { x: 5, y: 5 },
      speed: 10,
      size: 2,
    };
    const walls = [
      [4, 0, 4, 10],
    ];

    expect(canChangeDirection(character, 'RIGHT', walls, 0.1)).toBe(false);
  });

  it('allows direction changes when the next move is clear', () => {
    const character = {
      position: { x: 5, y: 5 },
      speed: 10,
      size: 2,
    };
    const walls = [
      [10, 0, 4, 10],
    ];

    expect(canChangeDirection(character, 'RIGHT', walls, 0.1)).toBe(true);
  });
});
