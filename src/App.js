import React from 'react';
import { connect } from 'react-redux';
import { switchDebug, resetGame, startGame } from './actions/gameInfoActions';
import { changePlayerDirection, movePlayer, resetPlayer, playerCollided } from './actions/playerActions';

import DebugInfo from './components/DebugInfo';
import GameInfo from './components/GameInfo';
import GameBoard from './components/GameBoard';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.tickDuration = 1 / 60;
    this.wallCollisionLeeway = 5;
  }

  runGame = () => {
    // moving logic
    this.props.movePlayer(this.tickDuration);
    this.checkCollisions();

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

  isCordWithinWall = (cord, wall) => {
    const lowerX = wall[0] + this.wallCollisionLeeway;
    const lowerY = wall[1] + this.wallCollisionLeeway;
    const upperX = (lowerX + wall[2]) - (2*this.wallCollisionLeeway);
    const upperY = (lowerY + wall[3]) - (2*this.wallCollisionLeeway);

    return (cord[0] > lowerX && cord[0] < upperX) && (cord[1] > lowerY && cord[1] < upperY);
  }

  // Check for player collisions with walls and other actors
  checkCollisions = () => {
    const { position, size } = this.props.player;
    const { walls } = this.props.levels.currentLevel;

    // get the player bounding cords
    const boundingCords = {
      tl: [position.x - size/2, position.y - size/2],
      tr: [position.x + size/2, position.y - size/2],
      bl: [position.x - size/2, position.y + size/2],
      br: [position.x + size/2, position.y + size/2],
    }

    //check if the player bounding cords are within any wall
    for (const wall of walls) {
      for (const cordKey in boundingCords) {
        if(this.isCordWithinWall(boundingCords[cordKey], wall)) {
          this.props.playerCollided(this.tickDuration);
        }
      }
    }
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
          level={this.props.levels.currentLevel}
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
