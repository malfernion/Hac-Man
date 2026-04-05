import React, { useRef, useEffect } from 'react';
import { PlayerState, GhostsSlice, GhostState, GhostId, LevelsState, GameInfoState, Position, ScorePopup } from '../types';

// Sprite sheet import
const spriteImg = new Image();
spriteImg.src = require('../assets/sprites_16_x_16.png');

const BOARD_SIZE = 812;
const TILE_SIZE = 28;

interface Props {
  player: PlayerState;
  level: LevelsState;
  gameInfo: GameInfoState;
  ghosts: GhostsSlice;
}

// ─── Ghost colours ────────────────────────────────────────────────────────────

const GHOST_COLORS: Record<GhostId, string> = {
  blinky: '#ff0000',
  pinky:  '#ffb8ff',
  inky:   '#00ffff',
  clyde:  '#ffb852',
};

const FRIGHTENED_COLOR         = '#0000cc';
const FRIGHTENED_FLASH_COLOR   = '#ffffff';

// ─── Procedural ghost drawing ─────────────────────────────────────────────────

function drawGhost(ctx: CanvasRenderingContext2D, ghost: GhostState, gameInfo: GameInfoState) {
  const { position, direction, mode, frightenedFlashing } = ghost;
  const x = position.x;
  const y = position.y;
  const r = 12; // body radius

  if (mode === 'eaten') {
    // Draw eyes only
    drawGhostEyes(ctx, x, y, direction, '#ffffff', '#0000cc');
    return;
  }

  let bodyColor: string;
  if (mode === 'frightened') {
    bodyColor = frightenedFlashing ? FRIGHTENED_FLASH_COLOR : FRIGHTENED_COLOR;
  } else {
    bodyColor = GHOST_COLORS[ghost.id];
  }

  ctx.save();
  ctx.fillStyle = bodyColor;

  // Ghost body: rounded top + wavy bottom
  ctx.beginPath();
  ctx.arc(x, y - 2, r, Math.PI, 0, false); // top semicircle
  ctx.lineTo(x + r, y + r);

  // Wavy bottom (3 bumps)
  const bumps = 3;
  const bumpW = (r * 2) / bumps;
  for (let i = 0; i < bumps; i++) {
    const bx = x + r - i * bumpW;
    ctx.arc(bx - bumpW / 2, y + r, bumpW / 2, 0, Math.PI, true);
  }
  ctx.lineTo(x - r, y - 2);
  ctx.closePath();
  ctx.fill();

  if (mode === 'frightened') {
    // Draw a scared face (white squiggly mouth + dot eyes)
    const faceColor = frightenedFlashing ? FRIGHTENED_COLOR : '#ffffff';
    ctx.strokeStyle = faceColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 2);
    ctx.lineTo(x - 3, y + 4);
    ctx.lineTo(x - 1, y + 2);
    ctx.lineTo(x + 1, y + 4);
    ctx.lineTo(x + 3, y + 2);
    ctx.lineTo(x + 5, y + 4);
    ctx.stroke();
    ctx.fillStyle = faceColor;
    ctx.beginPath(); ctx.arc(x - 3, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  } else {
    drawGhostEyes(ctx, x, y, direction, '#ffffff', '#0000cc');
  }

  ctx.restore();
}

function drawGhostEyes(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  direction: GhostState['direction'],
  white: string,
  iris: string,
) {
  const eyeOffsets = [{ ex: -4, ey: -4 }, { ex: 4, ey: -4 }];
  const irisDir: Record<string, [number, number]> = {
    RIGHT: [2, 0], LEFT: [-2, 0], UP: [0, -2], DOWN: [0, 2],
  };
  const [ix, iy] = irisDir[direction] ?? [0, 0];

  for (const { ex, ey } of eyeOffsets) {
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(x + ex, y + ey, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(x + ex + ix, y + ey + iy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Score popups ─────────────────────────────────────────────────────────────

function drawScorePopups(ctx: CanvasRenderingContext2D, popups: ScorePopup[], timestamp: number) {
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  for (const popup of popups) {
    const elapsed = timestamp - popup.createdAt;
    const alpha = Math.max(0, 1 - elapsed / 1200);
    const yOffset = -elapsed * 0.02;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`+${popup.value}`, popup.position.x, popup.position.y + yOffset);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ─── Player drawing ───────────────────────────────────────────────────────────

function drawCharacter(ctx: CanvasRenderingContext2D, character: PlayerState) {
  const { position, size, spriteCords } = character;
  if (!spriteImg.complete) return;
  ctx.drawImage(
    spriteImg,
    spriteCords[0], spriteCords[1], 16, 16,
    position.x - size / 2,
    position.y - size / 2,
    size, size,
  );
}

// ─── Collectibles drawing ─────────────────────────────────────────────────────

function drawCoins(ctx: CanvasRenderingContext2D, coins: Position[]) {
  ctx.fillStyle = '#ffb897';
  for (const coin of coins) {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPills(ctx: CanvasRenderingContext2D, pills: Position[]) {
  ctx.fillStyle = '#ffd27a';
  for (const pill of pills) {
    ctx.beginPath();
    ctx.arc(pill.x, pill.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Death animation ──────────────────────────────────────────────────────────

function drawDeathAnimation(ctx: CanvasRenderingContext2D, player: PlayerState, timestamp: number, dyingAt: number) {
  const elapsed = timestamp - dyingAt;
  const progress = Math.min(elapsed / 1500, 1);
  const { position, size } = player;
  const angle = progress * Math.PI * 2;

  ctx.save();
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(position.x, position.y);
  ctx.arc(position.x, position.y, size / 2, angle, Math.PI * 2 - angle, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

const GameBoard: React.FC<Props> = ({ player, level, gameInfo, ghosts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timestampRef = useRef<number>(0);

  useEffect(() => {
    const raf = requestAnimationFrame((ts) => { timestampRef.current = ts; });
    return () => cancelAnimationFrame(raf);
  }, []);

  const { currentLevel } = level;
  const timestamp = timestampRef.current;

  // Draw on every render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    drawCoins(ctx, currentLevel.coins);
    drawPills(ctx, currentLevel.pills);

    // Draw ghosts (behind player)
    for (const ghost of ghosts.ghosts) {
      drawGhost(ctx, ghost, gameInfo);
    }

    // Draw player or death animation
    if (gameInfo.playerDying && gameInfo.playerDyingAt !== null) {
      drawDeathAnimation(ctx, player, performance.now(), gameInfo.playerDyingAt);
    } else {
      drawCharacter(ctx, player);
    }

    // Score popups
    drawScorePopups(ctx, gameInfo.scorePopups, performance.now());
  });

  return (
    <canvas
      ref={canvasRef}
      id="active-canvas"
      width={BOARD_SIZE}
      height={BOARD_SIZE}
      style={{ position: 'absolute', top: 0, left: 0 }}
    />
  );
};

export default GameBoard;
