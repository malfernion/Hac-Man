import React, { useRef, useEffect } from 'react';
import { LevelsState, GameInfoState, WallDef } from '../types';

const BOARD_SIZE    = 812;
const WALL_WIDTH    = 12;
const CORNER_RADIUS = 9;
const TILE_SIZE     = 28;

interface Props {
  level: LevelsState;
  gameInfo: GameInfoState;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawWalls(ctx: CanvasRenderingContext2D, walls: WallDef[], color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = WALL_WIDTH;
  for (const [x0, y0, w, h] of walls) {
    if (x0 < 0 || y0 < 0) continue; // skip off-board decorative walls
    const px = x0 * TILE_SIZE;
    const py = y0 * TILE_SIZE;
    const pw = w  * TILE_SIZE;
    const ph = h  * TILE_SIZE;
    drawRoundedRect(ctx, px, py, pw, ph, CORNER_RADIUS);
    ctx.stroke();
  }
}

function flashWalls(ctx: CanvasRenderingContext2D, walls: WallDef[], onComplete: () => void) {
  const colors = ['blue', 'pink', 'blue', 'pink', 'blue', 'pink',
                  'blue', 'pink', 'blue', 'pink', 'blue', 'pink', 'blue'];
  let i = 0;
  const flash = () => {
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    drawWalls(ctx, walls, colors[i] ?? 'blue');
    i++;
    if (i < colors.length) {
      setTimeout(flash, 150);
    } else {
      onComplete();
    }
  };
  flash();
}

const GameBackground: React.FC<Props> = ({ level, gameInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashingRef = useRef(false);
  const prevLevelIndexRef = useRef(level.currentLevelIndex);
  const prevLevelCompletedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const levelChanged = level.currentLevelIndex !== prevLevelIndexRef.current;
    prevLevelIndexRef.current = level.currentLevelIndex;

    if (gameInfo.levelCompleted && !prevLevelCompletedRef.current && !flashingRef.current) {
      flashingRef.current = true;
      flashWalls(ctx, level.currentLevel.walls, () => { flashingRef.current = false; });
    } else if (!gameInfo.levelCompleted || levelChanged) {
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      drawWalls(ctx, level.currentLevel.walls, '#0000ff');
    }

    prevLevelCompletedRef.current = gameInfo.levelCompleted;
  });

  return (
    <canvas
      ref={canvasRef}
      id="background-canvas"
      width={BOARD_SIZE}
      height={BOARD_SIZE}
      style={{ position: 'absolute', top: 0, left: 0 }}
    />
  );
};

export default GameBackground;
