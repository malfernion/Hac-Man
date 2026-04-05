import React from 'react';
import { GameInfoState } from '../types';

interface Props {
  gameInfo: GameInfoState;
}

const GameInfo: React.FC<Props> = ({ gameInfo }) => {
  const { score, highScore, lives, poweredUp } = gameInfo;

  return (
    <div className="game-info" data-testid="game-info">
      <div className="game-info__score">
        <span>SCORE: {score}</span>
        <span>HIGH: {highScore}</span>
      </div>
      <div className="game-info__lives">
        {'❤️ '.repeat(Math.max(0, lives)).trim() || '—'}
      </div>
      {poweredUp && <div className="game-info__powered">POWER!</div>}
    </div>
  );
};

export default GameInfo;
