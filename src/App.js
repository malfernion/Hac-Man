import React from 'react';
import { connect } from 'react-redux';
import { switchDebug, resetGame, startGame } from './actions/gameInfoActions';
import { changePlayerDirection, movePlayer, resetPlayer, playerCollided } from './actions/playerActions';

import DebugInfo from './components/DebugInfo';
import GameInfo from './components/GameInfo';
import GameBoard from './components/GameBoard';

import './App.css';

class App extends React.Component {

  tickDuration = 1 / 60;

  runGame = () => {
    // moving logic
    // can things move?
    // move them
    this.props.movePlayer(this.tickDuration);

    //wait for next tick
    setTimeout(
      () => {
        if(this.props.gameInfo.gameStarted && !this.props.gameInfo.showGameOver) {
          this.runGame();
        }   
      },
      this.tickDuration
    );
  }

  move = (direction) => {
    this.props.changePlayerDirection(direction);
    const { gameStarted } = this.props.gameInfo;
    if(!gameStarted) {
      this.props.startGame();
      this.runGame();
    }
  }

  handleKeyDown = (event) => {
    const keyCode = event.keyCode || event.which;

    switch(keyCode) {
      case 37:
        // left
        this.move('LEFT');
        break;
      case 38:
        // up
        this.move('UP');
        break;
      case 39:
        // right
        this.move('RIGHT');
        break;
      case 40:
        //down
        this.move('DOWN');
        break;
      case 68:
        // d
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
  changePlayerDirection: (direction) => dispatch(changePlayerDirection(direction)),
  movePlayer: (tickDuration) => dispatch(movePlayer(tickDuration)),
  resetPlayer: () => dispatch(resetPlayer()),
  playerCollided: (tickDuration) => dispatch(playerCollided(tickDuration)),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
