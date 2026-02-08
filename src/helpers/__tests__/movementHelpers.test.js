import {
  canChangeDirection,
  checkAndTransformIntoBounds,
  getNextCharacterPositionForDirection,
  getNextCharacterRailPosition,
} from '../movementHelpers';

describe('movementHelpers', () => {
  it('calculates the next position for each direction', () => {
    const character = {
      position: { x: 10, y: 10 },
      speed: 5,
    };

    expect(getNextCharacterPositionForDirection(character, 'UP', 1)).toEqual({ x: 14, y: 5 });
    expect(getNextCharacterPositionForDirection(character, 'DOWN', 1)).toEqual({ x: 14, y: 15 });
    expect(getNextCharacterPositionForDirection(character, 'LEFT', 2)).toEqual({ x: 0, y: 14 });
    expect(getNextCharacterPositionForDirection(character, 'RIGHT', 2)).toEqual({ x: 20, y: 14 });
  });

  it('moves along rails without crossing into blocked tiles', () => {
    const character = {
      position: { x: 14, y: 14 },
      speed: 28,
    };
    const walls = [
      [28, 0, 28, 28],
    ];

    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, walls);

    expect(result.position).toEqual({ x: 14.5, y: 14 });
    expect(result.blocked).toBe(true);
  });

  it('moves across multiple tiles when clear', () => {
    const character = {
      position: { x: 14, y: 14 },
      speed: 56,
    };

    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, []);

    expect(result.position).toEqual({ x: 70, y: 14 });
    expect(result.blocked).toBe(false);
  });

  it('advances past a boundary without stalling when the next tile is open', () => {
    const character = {
      position: { x: 28, y: 14 },
      speed: 28,
    };

    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, []);

    expect(result.position.x).toBeGreaterThan(28);
    expect(result.blocked).toBe(false);
  });

  it('stops at a boundary when the next tile is blocked', () => {
    const character = {
      position: { x: 28, y: 14 },
      speed: 28,
    };
    const walls = [
      [56, 0, 28, 28],
    ];

    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, walls);

    expect(result.position).toEqual({ x: 42.5, y: 14 });
    expect(result.blocked).toBe(true);
  });

  it('wraps positions that move beyond the board bounds', () => {
    const position = { x: 820, y: -5 };
    checkAndTransformIntoBounds(position);

    expect(position.x).toBe(8);
    expect(position.y).toBe(807);
  });

  it('returns false when there is no next direction', () => {
    const character = {
      position: { x: 14, y: 14 },
      speed: 10,
      size: 2,
    };
    const walls = [];

    expect(canChangeDirection(character, null, walls, 0.1)).toBe(false);
  });

  it('prevents direction changes when a wall blocks the next move', () => {
    const character = {
      position: { x: 14, y: 14 },
      speed: 10,
      size: 2,
    };
    const walls = [
      [28, 0, 28, 28],
    ];

    expect(canChangeDirection(character, 'RIGHT', walls, 0.1)).toBe(false);
  });

  it('prevents direction changes when not aligned to a rail', () => {
    const character = {
      position: { x: 14, y: 3 },
      speed: 10,
      size: 2,
    };
    const walls = [];

    expect(canChangeDirection(character, 'RIGHT', walls, 0.1)).toBe(false);
  });

  it('allows direction changes when the next move is clear', () => {
    const character = {
      position: { x: 14, y: 14 },
      speed: 10,
      size: 2,
    };
    const walls = [
      [56, 0, 28, 28],
    ];

    expect(canChangeDirection(character, 'RIGHT', walls, 0.1)).toBe(true);
  });

  it('snaps to rails when close but preserves off-rail alignment when far', () => {
    const character = {
      position: { x: 14, y: 54 },
      speed: 10,
    };

    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, []);

    expect(result.position.y).toBe(54);
  });

  it('blocks movement when a wall intersects the character bounds mid-tile', () => {
    const character = {
      position: { x: 14, y: 14 },
      speed: 120,
      size: 27,
    };
    const walls = [
      [40, 0, 10, 28],
    ];

    const result = getNextCharacterRailPosition(character, 'RIGHT', 1, walls);

    expect(result.position.x).toBe(26.5);
    expect(result.blocked).toBe(true);
  });

  it('allows changing direction when the next tile remains clear of the character bounds', () => {
    const character = {
      position: { x: 14, y: 14 },
      speed: 120,
      size: 27,
    };
    const walls = [
      [90, 0, 10, 28],
    ];

    expect(canChangeDirection(character, 'RIGHT', walls, 0.1)).toBe(true);
  });
});
