import React from 'react';
import { connect } from 'react-redux';
import { switchDebug, resetGame, startGame } from './actions/gameInfoActions';
import { directionPressed, movePlayer, resetPlayer, playerCollided, changeToNextDirection } from './actions/playerActions';
import { hasWallCollisions } from './helpers/collisionHelpers';
import { canChangeDirection } from './helpers/movementHelpers';

import DebugInfo from './components/DebugInfo';
import GameInfo from './components/GameInfo';
import GameBoard from './components/GameBoard';

import './App.css';

class App extends React.Component {
  runGame = (timestamp) => {
    let timeElapsed = this.frameStart === undefined ? 0 : (timestamp - this.frameStart) / 1000;
    this.frameStart = timestamp;
    const {levels: {currentLevel: { walls }}} = this.props;

    // moving logic
    if(canChangeDirection(this.props.player, this.props.player.nextDirection, walls, timeElapsed)) {
      this.props.changeToNextDirection();
    }
    this.props.movePlayer(timeElapsed);
    if(hasWallCollisions(this.props.player, walls)) {
      this.props.playerCollided(timeElapsed);
    }

    if(this.props.gameInfo.gameStarted && !this.props.gameInfo.showGameOver) {
      window.requestAnimationFrame(this.runGame);
    }
  }

  move = (direction) => {
    this.props.directionPressed(direction);
    const { gameStarted } = this.props.gameInfo;
    if(!gameStarted) {
      this.props.startGame();
      window.requestAnimationFrame(this.runGame);
    }
  }

  handleKeyDown = (event) => {
    const keyCode = event.keyCode || event.which;

    switch(keyCode) {
      case 37:
      case 65:
        // left
        this.move('LEFT');
        break;
      case 38:
      case 87:
        // up
        this.move('UP');
        break;
      case 39:
      case 68:
        // right
        this.move('RIGHT');
        break;
      case 40:
      case 83:
        //down
        this.move('DOWN');
        break;
      case 69:
        // e
        this.props.switchDebug();
        break;
      case 82:
        // r
        this.props.resetGame();
        this.props.resetPlayer();
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
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
