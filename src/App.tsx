import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from './store';
import { Direction } from './types';

import {
  startGame,
  resetGame,
  introFinished,
  advanceLevel,
} from './actions/gameInfoActions';
import {
  directionPressed,
  resetPlayer,
} from './actions/playerActions';
import {
  resetLevelProgress,
  setLevelIndex,
} from './actions/levelActions';
import { resetGhosts } from './actions/ghostActions';
import { tickGameState } from './gameLoop';
import { useInput } from './hooks/useInput';
import { computedLevels } from './data/levels';

import GameInfo from './components/GameInfo';
import GameBoard from './components/GameBoard';
import GameBackground from './components/GameBackground';
import GameAudio from './components/GameAudio';
import GameOver from './components/GameOver';
import TextLayer from './components/TextLayer';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => s);

  const { gameInfo, player, levels } = state;

  const animationFrameRef = useRef<number | null>(null);
  const frameStartRef = useRef<number | undefined>(undefined);
  const stateRef = useRef(state);

  // Keep stateRef in sync so the RAF callback always reads latest state
  stateRef.current = state;

  // ── Game loop ─────────────────────────────���────────────────────────────────

  const runGame = useCallback((timestamp: number) => {
    const deltaMs = frameStartRef.current === undefined
      ? 0
      : timestamp - frameStartRef.current;
    frameStartRef.current = timestamp;

    const currentState = stateRef.current;
    const { gameInfo: gi } = currentState;

    if (!gi.gameStarted || gi.showGameOver || gi.levelCompleted || gi.playerDying) {
      return;
    }

    const actions = tickGameState(currentState, deltaMs, timestamp);
    for (const action of actions) {
      dispatch(action as Parameters<typeof dispatch>[0]);
    }

    animationFrameRef.current = requestAnimationFrame(runGame);
  }, [dispatch]);

  // Start/stop loop when gameStarted changes
  useEffect(() => {
    if (gameInfo.gameStarted && !gameInfo.showGameOver && !gameInfo.levelCompleted && !gameInfo.playerDying) {
      frameStartRef.current = undefined;
      animationFrameRef.current = requestAnimationFrame(runGame);
    } else {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [gameInfo.gameStarted, gameInfo.showGameOver, gameInfo.levelCompleted, gameInfo.playerDying, runGame]);

  // Respawn: restart loop after death
  useEffect(() => {
    if (gameInfo.gameStarted && !gameInfo.playerDying && !gameInfo.showGameOver) {
      frameStartRef.current = undefined;
      animationFrameRef.current = requestAnimationFrame(runGame);
    }
  }, [gameInfo.playerDying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Level completion: flash, pause, advance
  useEffect(() => {
    if (!gameInfo.levelCompleted) return;
    const timer = setTimeout(() => {
      const nextIndex = gameInfo.levelIndex + 1;
      dispatch(advanceLevel());
      dispatch(setLevelIndex(nextIndex % computedLevels.length));
      dispatch(resetPlayer());
      dispatch(resetGhosts());
    }, 3000);
    return () => clearTimeout(timer);
  }, [gameInfo.levelCompleted, gameInfo.levelIndex, dispatch]);

  // ── Input ─────────────────────────────────────────────────────────���────────

  const handleDirection = useCallback((direction: Direction) => {
    dispatch(directionPressed(direction));
    const { gameStarted, playingIntro } = stateRef.current.gameInfo;
    if (!gameStarted && !playingIntro) {
      dispatch(startGame());
    }
  }, [dispatch]);

  const handleReset = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    frameStartRef.current = undefined;
    dispatch(resetGame());
    dispatch(resetPlayer());
    dispatch(resetLevelProgress());
    dispatch(resetGhosts());
  }, [dispatch]);

  const { swipeHandlers, directionButtonHandler, resetButtonHandler } = useInput({
    onDirection: handleDirection,
    onReset: handleReset,
  });

  // Keyboard input
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const keyMap: Record<number, Direction | 'RESET'> = {
      37: 'LEFT',  65: 'LEFT',
      38: 'UP',    87: 'UP',
      39: 'RIGHT', 68: 'RIGHT',
      40: 'DOWN',  83: 'DOWN',
      82: 'RESET',
    };
    const key = event.keyCode || event.which;
    const action = keyMap[key];
    if (!action) return;
    if (action === 'RESET') {
      handleReset();
    } else {
      handleDirection(action);
    }
  }, [handleDirection, handleReset]);

  // ── Intro finished callback ────────────────────────────────────────────────

  const handleIntroFinished = useCallback(() => {
    dispatch(introFinished());
  }, [dispatch]);

  // ── Render ──────────────────────────────��──────────────────────────────────

  return (
    <div className="App" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="App-header">
        <h1>Hac-Man</h1>
      </header>

      <GameAudio gameInfo={gameInfo} onIntroFinished={handleIntroFinished} />

      <TextLayer
        level={levels}
        showStageName={gameInfo.showStageName}
      />

      <div className="game-board-area">
        <div
          className="game-board-wrapper"
          data-testid="game-board-wrapper"
          {...swipeHandlers}
        >
          <GameBackground level={levels} gameInfo={gameInfo} />
          <GameBoard
            player={player}
            level={levels}
            gameInfo={gameInfo}
            ghosts={state.ghosts}
          />

          <div className="touch-overlay" aria-hidden="true">
            <button
              type="button"
              className="touch-zone touch-zone--up"
              aria-label="Move up"
              onPointerDown={directionButtonHandler('UP')}
            />
            <button
              type="button"
              className="touch-zone touch-zone--down"
              aria-label="Move down"
              onPointerDown={directionButtonHandler('DOWN')}
            />
            <button
              type="button"
              className="touch-zone touch-zone--left"
              aria-label="Move left"
              onPointerDown={directionButtonHandler('LEFT')}
            />
            <button
              type="button"
              className="touch-zone touch-zone--right"
              aria-label="Move right"
              onPointerDown={directionButtonHandler('RIGHT')}
            />
          </div>
        </div>

        <button
          type="button"
          className="reset-button"
          aria-label="Reset game"
          onPointerDown={resetButtonHandler}
        >
          Reset
        </button>
      </div>

      <GameInfo gameInfo={gameInfo} />

      {gameInfo.showGameOver && (
        <GameOver score={gameInfo.score} highScore={gameInfo.highScore} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
