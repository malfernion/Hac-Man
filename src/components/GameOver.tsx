import React from 'react';

interface Props {
  score: number;
  highScore: number;
  onReset: () => void;
}

const GameOver: React.FC<Props> = ({ score, highScore, onReset }) => (
  <div className="game-over" data-testid="game-over">
    <h2>GAME OVER</h2>
    <p>Score: {score}</p>
    <p>High Score: {highScore}</p>
    <button type="button" onClick={onReset} className="game-over__restart">
      Play Again
    </button>
  </div>
);

export default GameOver;
