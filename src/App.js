import React from 'react';
import { connect } from 'react-redux';
import { switchDebug, resetGame, startGame, increaseScore } from './actions/gameInfoActions';
import { directionPressed, movePlayer, resetPlayer, playerCollided, changeToNextDirection } from './actions/playerActions';
import { coinCollected, resetLeveLProgress } from './actions/levelActions';
import { hasWallCollision, findCollidingCoin } from './helpers/collisionHelpers';
import { canChangeDirection } from './helpers/movementHelpers';

import DebugInfo from './components/DebugInfo';
import GameInfo from './components/GameInfo';
import GameBoard from './components/GameBoard';
import GameAudio from './components/GameAudio';

import './App.css';

class App extends React.Component {
  runGame = (timestamp) => {
    let timeElapsed = this.frameStart === undefined ? 0 : (timestamp - this.frameStart) / 1000;
    this.frameStart = timestamp;
    const {levels: {currentLevel: { walls, coins }}} = this.props;

    // moving logic
    if(canChangeDirection(this.props.player, this.props.player.nextDirection, walls, timeElapsed)) {
      this.props.changeToNextDirection();
    }
    this.props.movePlayer(timeElapsed);
    if(hasWallCollision(this.props.player, walls)) {
      this.props.playerCollided(timeElapsed);
    }
    const collidingCoin = findCollidingCoin(this.props.player, coins);
    if(collidingCoin) {
      this.props.coinCollected(collidingCoin);
      this.props.increaseScore(10)
    }

    if(this.props.gameInfo.gameStarted && !this.props.gameInfo.showGameOver) {
      this.animationRequest = window.requestAnimationFrame(this.runGame);
    }
  }

  onMovePressed = (direction) => {
    this.props.directionPressed(direction);
    const { gameStarted, playingIntro } = this.props.gameInfo;
    if(!gameStarted && !playingIntro) {
      this.props.startGame();
    }
  }

  componentDidUpdate = (oldProps) => {
    const { gameStarted } = this.props.gameInfo;
    const { gameStarted: oldGameStarted } = oldProps.gameInfo;
    if(gameStarted && !oldGameStarted) {
      this.animationRequest = window.requestAnimationFrame(this.runGame);
    }
  }

  handleKeyDown = (event) => {
    const keyCode = event.keyCode || event.which;

    switch(keyCode) {
      case 37:
      case 65:
        // left
        this.onMovePressed('LEFT');
        break;
      case 38:
      case 87:
        // up
        this.onMovePressed('UP');
        break;
      case 39:
      case 68:
        // right
        this.onMovePressed('RIGHT');
        break;
      case 40:
      case 83:
        //down
        this.onMovePressed('DOWN');
        break;
      case 69:
        // e
        this.props.switchDebug();
        break;
      case 82:
        // r
        this.props.resetGame();
        this.props.resetPlayer();
        this.props.resetLeveLProgress();
        if(this.animationRequest) {
          window.cancelAnimationFrame(this.animationRequest);
        }
        this.frameStart = undefined;
        break;
      default:
        // do nothing for unsupported keys
    }
  }

  render() {
    return (
      <div className="App" onKeyDown={this.handleKeyDown} tabIndex="0">
        <header className="App-header">
          <h1>Hac-Man</h1>
        </header>
        <GameAudio gameInfo={this.props.gameInfo} />
        <GameBoard
          player={this.props.player}
          level={this.props.levels}
        />
        <DebugInfo
          gameInfo={this.props.gameInfo}
          player={this.props.player}
        />
        <GameInfo gameInfo={this.props.gameInfo} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  ...state,
});

const mapDispatchToProps = dispatch => ({
  switchDebug: () => dispatch(switchDebug()),
  resetGame: () => dispatch(resetGame()),
  startGame: () => dispatch(startGame()),
  directionPressed: (direction) => dispatch(directionPressed(direction)),
  movePlayer: (tickDuration) => dispatch(movePlayer(tickDuration)),
  resetPlayer: () => dispatch(resetPlayer()),
  playerCollided: (tickDuration) => dispatch(playerCollided(tickDuration)),
  changeToNextDirection: () => dispatch(changeToNextDirection()),
  coinCollected: (coin) => dispatch(coinCollected(coin)),
  increaseScore: (score) => dispatch(increaseScore(score)),
  resetLeveLProgress: () => dispatch(resetLeveLProgress()),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
