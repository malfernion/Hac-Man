import React from 'react';
import { connect } from 'react-redux';
import { resetGame, startGame, increaseScore, levelCompleted, powerModeStarted, powerModeEnded, lostLife, ghostKilled } from './actions/gameInfoActions';
import { directionPressed, movePlayer, resetPlayer, playerCollided, changeToNextDirection, resetPlayerAnimation } from './actions/playerActions';
import { coinCollected, pillCollected, resetLeveLProgress } from './actions/levelActions';
import { moveGhosts, resetGhosts, ghostEaten } from './actions/ghostActions';
import { findCollidingCoin, findCollidingPill, findCollidingGhost } from './helpers/collisionHelpers';
import { canChangeDirection, checkAndTransformIntoBounds, getNextCharacterRailPosition } from './helpers/movementHelpers';
import { getNextGhostStates } from './helpers/ghostHelpers';

import GameInfo from './components/GameInfo';
import GameBoard from './components/GameBoard';
import GameAudio from './components/GameAudio';
import TextLayer from './components/TextLayer';

import './App.css';

class App extends React.Component {
  swipeStart = null;
  swipeMinDistance = 24;

  componentDidMount() {
    if(process.env.NODE_ENV !== 'production') {
      window.__HACMAN_APP__ = this;
    }
  }

  componentWillUnmount() {
    if(process.env.NODE_ENV !== 'production') {
      delete window.__HACMAN_APP__;
    }
  }

  runGame = (timestamp) => {
    let timeElapsed = this.frameStart === undefined ? 0 : (timestamp - this.frameStart) / 1000;
    this.frameStart = timestamp;
    const {levels: {currentLevel: { walls, coins, pills }}} = this.props;
    const { gameInfo: { poweredUp, powerModeEndsAt } } = this.props;
    const powerModeDurationMs = 10000;

    if(poweredUp && powerModeEndsAt !== null && timestamp >= powerModeEndsAt) {
      this.props.powerModeEnded();
    }

    // moving logic
    let effectiveDirection = this.props.player.direction;
    if(canChangeDirection(this.props.player, this.props.player.nextDirection, walls, timeElapsed)) {
      this.props.changeToNextDirection();
      effectiveDirection = this.props.player.nextDirection;
    }
    const nextMove = effectiveDirection
      ? getNextCharacterRailPosition(this.props.player, effectiveDirection, timeElapsed, walls)
      : { position: this.props.player.position, blocked: false };

    const wrappedPosition = Object.assign({}, nextMove.position);
    checkAndTransformIntoBounds(wrappedPosition);

    if(nextMove.blocked) {
      this.props.playerCollided(0, wrappedPosition);
    } else {
      this.props.movePlayer(timeElapsed, wrappedPosition);
    }

    const playerForCollision = Object.assign({}, this.props.player, {
      position: wrappedPosition,
    });
    const collidingCoin = findCollidingCoin(playerForCollision, coins);
    const collidingPill = findCollidingPill(playerForCollision, pills);
    const poweredUpThisTick = poweredUp || Boolean(collidingPill);
    if(collidingPill) {
      this.props.pillCollected(collidingPill);
      this.props.increaseScore(50);
      this.props.powerModeStarted(timestamp + powerModeDurationMs);
    }
    if(collidingCoin) {
      this.props.coinCollected(collidingCoin);
      this.props.increaseScore(10)
      // Player has collected all coins, end the level
      if(coins.length <= 1) {
        this.props.levelCompleted();
        this.props.resetPlayerAnimation();
      }
    }

    const updatedGhosts = getNextGhostStates({
      ghosts: this.props.ghosts.ghosts,
      player: playerForCollision,
      walls,
      timeElapsed,
      poweredUp: poweredUpThisTick,
    });
    this.props.moveGhosts(updatedGhosts);

    const collidingGhost = findCollidingGhost(playerForCollision, updatedGhosts);
    if(collidingGhost) {
      if(poweredUpThisTick) {
        this.props.ghostKilled();
        this.props.increaseScore(200);
        this.props.ghostEaten(collidingGhost.id);
      } else {
        this.props.lostLife();
        this.props.resetPlayer();
        this.props.resetGhosts();
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
        this.props.resetGhosts();
        if(this.animationRequest) {
          window.cancelAnimationFrame(this.animationRequest);
        }
        this.frameStart = undefined;
        break;
      default:
        // do nothing for unsupported keys
    }
  }

  handleSwipeStart = (event) => {
    if(event.type === 'pointerdown' && event.pointerType === 'touch') {
      return;
    }
    if(event.cancelable) {
      event.preventDefault();
    }
    const point = event.touches ? event.touches[0] : event;
    this.swipeStart = {
      x: point.clientX,
      y: point.clientY,
    };
  }

  handleSwipeEnd = (event) => {
    if(event.type === 'pointerup' && event.pointerType === 'touch') {
      return;
    }
    if(event.cancelable) {
      event.preventDefault();
    }
    if(!this.swipeStart) {
      return;
    }
    const point = event.changedTouches ? event.changedTouches[0] : event;
    const deltaX = point.clientX - this.swipeStart.x;
    const deltaY = point.clientY - this.swipeStart.y;
    const distance = Math.hypot(deltaX, deltaY);
    if(distance >= this.swipeMinDistance) {
      if(Math.abs(deltaX) > Math.abs(deltaY)) {
        this.onMovePressed(deltaX > 0 ? 'RIGHT' : 'LEFT');
      } else {
        this.onMovePressed(deltaY > 0 ? 'DOWN' : 'UP');
      }
    }
    this.swipeStart = null;
  }

  handleSwipeCancel = () => {
    this.swipeStart = null;
  }

  handlePointerMovePressed = (direction, event) => {
    if(event && event.pointerType === 'touch') {
      return;
    }
    this.onMovePressed(direction);
  }

  handlePointerResetPressed = (event) => {
    if(event && event.pointerType === 'touch') {
      return;
    }
    this.handleResetPressed();
  }

  handleResetPressed = () => {
    this.props.resetGame();
    this.props.resetPlayer();
    this.props.resetLeveLProgress();
    this.props.resetGhosts();
    if(this.animationRequest) {
      window.cancelAnimationFrame(this.animationRequest);
    }
    this.frameStart = undefined;
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
        <div className="game-board-area">
          <div
            className="game-board-wrapper"
            data-testid="game-board-wrapper"
            onPointerDown={this.handleSwipeStart}
            onPointerUp={this.handleSwipeEnd}
            onPointerCancel={this.handleSwipeCancel}
            onTouchStart={this.handleSwipeStart}
            onTouchEnd={this.handleSwipeEnd}
          >
            <GameBoard
              player={this.props.player}
              level={this.props.levels}
              gameInfo={this.props.gameInfo}
              ghosts={this.props.ghosts.ghosts}
            />
            <div className="touch-overlay" aria-hidden="true">
              <button
                type="button"
                className="touch-zone touch-zone--up"
                aria-label="Move up"
                onPointerDown={(event) => this.handlePointerMovePressed('UP', event)}
                onTouchStart={() => this.onMovePressed('UP')}
              />
              <button
                type="button"
                className="touch-zone touch-zone--down"
                aria-label="Move down"
                onPointerDown={(event) => this.handlePointerMovePressed('DOWN', event)}
                onTouchStart={() => this.onMovePressed('DOWN')}
              />
              <button
                type="button"
                className="touch-zone touch-zone--left"
                aria-label="Move left"
                onPointerDown={(event) => this.handlePointerMovePressed('LEFT', event)}
                onTouchStart={() => this.onMovePressed('LEFT')}
              />
              <button
                type="button"
                className="touch-zone touch-zone--right"
                aria-label="Move right"
                onPointerDown={(event) => this.handlePointerMovePressed('RIGHT', event)}
                onTouchStart={() => this.onMovePressed('RIGHT')}
              />
            </div>
          </div>
          <button
            type="button"
            className="reset-button"
            aria-label="Reset game"
            onPointerDown={this.handlePointerResetPressed}
            onTouchStart={this.handleResetPressed}
          >
            Reset
          </button>
        </div>
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
  movePlayer: (tickDuration, position) => dispatch(movePlayer(tickDuration, position)),
  resetPlayer: () => dispatch(resetPlayer()),
  playerCollided: (tickDuration, position) => dispatch(playerCollided(tickDuration, position)),
  changeToNextDirection: () => dispatch(changeToNextDirection()),
  coinCollected: (coin) => dispatch(coinCollected(coin)),
  pillCollected: (pill) => dispatch(pillCollected(pill)),
  increaseScore: (score) => dispatch(increaseScore(score)),
  powerModeStarted: (endsAt) => dispatch(powerModeStarted(endsAt)),
  powerModeEnded: () => dispatch(powerModeEnded()),
  resetLeveLProgress: () => dispatch(resetLeveLProgress()),
  levelCompleted: () => dispatch(levelCompleted()),
  resetPlayerAnimation: () => dispatch(resetPlayerAnimation()),
  moveGhosts: (ghosts) => dispatch(moveGhosts(ghosts)),
  resetGhosts: () => dispatch(resetGhosts()),
  lostLife: () => dispatch(lostLife()),
  ghostKilled: () => dispatch(ghostKilled()),
  ghostEaten: (ghostId) => dispatch(ghostEaten(ghostId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
