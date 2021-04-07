import React from 'react';
import { connect } from 'react-redux';
import { resetGame, startGame, increaseScore, levelCompleted, enemyStart } from './actions/gameInfoActions';
import { directionPressed, movePlayer, resetPlayer, playerCollided, changeToNextDirection, resetPlayerAnimation } from './actions/playerActions';
import { changeEnemyDirection, moveEnemy, resetEnemies } from './actions/enemiesActions';
import { coinCollected, resetLeveLProgress } from './actions/levelActions';
import { hasWallCollision, findCollidingCoin } from './helpers/collisionHelpers';
import { canChangeDirection } from './helpers/movementHelpers';

import GameInfo from './components/GameInfo';
import GameBoard from './components/GameBoard';
import GameAudio from './components/GameAudio';
import TextLayer from './components/TextLayer';

import './App.css';

class App extends React.Component {
  runGame = (timestamp) => {
    let timeElapsed = this.frameStart === undefined ? 0 : (timestamp - this.frameStart) / 1000;
    this.frameStart = timestamp;
    const {levels: {currentLevel: { walls, coins }}} = this.props;

    // Enemy moving logic
    // Start the enemy some time after the game starts
    if(!this.props.gameInfo.enemyStarted && timestamp > 8000) {
      console.log('enemy start!');
      this.props.enemyStart();
    }
    // Loop through the enemies so they can have their turns
    // Enemy gets target tile
    // Enemy gets possible moves (no turning around, or moving into walls)
    // If only one possible move continue on path
    // Else, enemy calculates distance to target for each possible move
    // Change to direction with least distance to target

    // Player moving logic
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
      // Player has collected all coins, end the level
      if(coins.length === 0) {
        this.props.levelCompleted();
        this.props.resetPlayerAnimation();
        this.props.resetEnemies();
      }
    }

    if(this.props.gameInfo.gameStarted && (!this.props.gameInfo.showGameOver && !this.props.gameInfo.levelCompleted)) {
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
    const { gameInfo: {gameStarted} } = this.props;
    const { gameInfo: {gameStarted: oldGameStarted} } = oldProps;
    
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
      case 82:
        // r
        this.props.resetGame();
        this.props.resetPlayer();
        this.props.resetLeveLProgress();
        this.props.resetEnemies();
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
        <TextLayer
          level={this.props.levels}
          showStageName={this.props.gameInfo.showStageName}
        />
        <GameBoard
          player={this.props.player}
          level={this.props.levels}
          gameInfo={this.props.gameInfo}
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
  levelCompleted: () => dispatch(levelCompleted()),
  resetPlayerAnimation: () => dispatch(resetPlayerAnimation()),
  enemyStart: () => dispatch(enemyStart()),
  changeEnemyDirection: () => dispatch(changeEnemyDirection()),
  moveEnemy: () => dispatch(moveEnemy()),
  resetEnemies: () => dispatch(resetEnemies()),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
