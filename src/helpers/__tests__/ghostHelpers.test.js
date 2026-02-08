import { getGhostTarget, ghostConstants } from '../ghostHelpers';

const createGhost = (overrides = {}) => ({
    id: 'blinky',
    position: { x: 100, y: 100 },
    scatterTarget: { x: 20, y: 20 },
    ...overrides,
});

const createPlayer = (overrides = {}) => ({
    position: { x: 100, y: 100 },
    direction: 'RIGHT',
    ...overrides,
});

describe('ghostHelpers', () => {
    it('targets ahead of the player for Pinky', () => {
        const player = createPlayer({ position: { x: 50, y: 75 }, direction: 'UP' });
        const ghost = createGhost({ id: 'pinky' });

        const target = getGhostTarget({ ghost, player, ghosts: [ghost], poweredUp: false });

        expect(target.x).toBe(50);
        expect(target.y).toBe(75 - ghostConstants.tileSize * 4);
    });

    it('targets a blended vector for Inky', () => {
        const player = createPlayer({ position: { x: 100, y: 100 }, direction: 'RIGHT' });
        const blinky = createGhost({ id: 'blinky', position: { x: 40, y: 100 } });
        const inky = createGhost({ id: 'inky' });

        const target = getGhostTarget({ ghost: inky, player, ghosts: [blinky, inky], poweredUp: false });

        const aheadX = player.position.x + ghostConstants.tileSize * 2;
        const vectorX = aheadX - blinky.position.x;
        expect(target.x).toBe(blinky.position.x + vectorX * 2);
    });

    it('uses scatter target for Clyde when too close', () => {
        const player = createPlayer({ position: { x: 100, y: 100 } });
        const ghost = createGhost({ id: 'clyde', position: { x: 110, y: 110 }, scatterTarget: { x: 10, y: 10 } });

        const target = getGhostTarget({ ghost, player, ghosts: [ghost], poweredUp: false });

        expect(target).toEqual(ghost.scatterTarget);
    });

    it('flees from the player when powered up', () => {
        const player = createPlayer({ position: { x: 100, y: 100 } });
        const ghost = createGhost({ id: 'blinky', position: { x: 140, y: 100 } });

        const target = getGhostTarget({ ghost, player, ghosts: [ghost], poweredUp: true });

        expect(target.x).toBe(ghost.position.x + (ghost.position.x - player.position.x));
        expect(target.y).toBe(ghost.position.y + (ghost.position.y - player.position.y));
    });
});
