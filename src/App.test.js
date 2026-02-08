import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import configureStore from './store';
import { levels } from './data/levels';

const AppComponent = App.WrappedComponent || App;

test('renders the Hac-Man header', () => {
  const store = configureStore();
  const { getAllByText } = render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  const titleElements = getAllByText(/Hac-Man/i);
  expect(titleElements.length).toBeGreaterThan(0);
});

test('tap regions set movement direction', () => {
  const store = configureStore();
  const { getByLabelText } = render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  const upButton = getByLabelText('Move up');
  fireEvent.pointerDown(upButton, { clientX: 50, clientY: 10 });
  expect(store.getState().player.direction).toBe('UP');
});

test('swipe controls update movement direction', () => {
  const store = configureStore();
  const { getByTestId } = render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  const wrapper = getByTestId('game-board-wrapper');
  fireEvent.touchStart(wrapper, {
    touches: [{ clientX: 10, clientY: 10 }],
  });
  fireEvent.touchEnd(wrapper, {
    changedTouches: [{ clientX: 90, clientY: 10 }],
  });
  expect(store.getState().player.direction).toBe('RIGHT');
});

test('runGame uses accepted nextDirection for collision pre-check', () => {
  const props = {
    player: {
      position: { x: 50, y: 50 },
      size: 10,
      speed: 10,
      direction: 'RIGHT',
      nextDirection: 'UP',
    },
    gameInfo: {
      poweredUp: false,
      powerModeEndsAt: null,
      gameStarted: false,
      showGameOver: false,
      levelCompleted: false,
      playingIntro: false,
    },
    levels: {
      currentLevel: {
        walls: [[55, 45, 10, 10]],
        coins: [],
        pills: [],
      },
    },
    powerModeEnded: jest.fn(),
    changeToNextDirection: jest.fn(),
    movePlayer: jest.fn(),
    playerCollided: jest.fn(),
    pillCollected: jest.fn(),
    coinCollected: jest.fn(),
    increaseScore: jest.fn(),
    powerModeStarted: jest.fn(),
    levelCompleted: jest.fn(),
    resetPlayerAnimation: jest.fn(),
  };

  const app = new AppComponent(props);
  app.frameStart = 0;
  app.runGame(1000);

  expect(props.changeToNextDirection).toHaveBeenCalled();
  expect(props.playerCollided).not.toHaveBeenCalled();
  expect(props.movePlayer).toHaveBeenCalledWith(1, { x: 42, y: 40 });
});

test('runGame wraps positions before checking coin collisions', () => {
  const props = {
    player: {
      position: { x: 810, y: 14 },
      size: 10,
      speed: 10,
      direction: 'RIGHT',
      nextDirection: null,
    },
    gameInfo: {
      poweredUp: false,
      powerModeEndsAt: null,
      gameStarted: false,
      showGameOver: false,
      levelCompleted: false,
      playingIntro: false,
    },
    levels: {
      currentLevel: {
        walls: [],
        coins: [[8, 14]],
        pills: [],
      },
    },
    powerModeEnded: jest.fn(),
    changeToNextDirection: jest.fn(),
    movePlayer: jest.fn(),
    playerCollided: jest.fn(),
    pillCollected: jest.fn(),
    coinCollected: jest.fn(),
    increaseScore: jest.fn(),
    powerModeStarted: jest.fn(),
    levelCompleted: jest.fn(),
    resetPlayerAnimation: jest.fn(),
  };

  const app = new AppComponent(props);
  app.frameStart = 0;
  app.runGame(1000);

  expect(props.coinCollected).toHaveBeenCalled();
  expect(props.increaseScore).toHaveBeenCalledWith(10);
});

test('runGame can complete the first level by collecting every coin', () => {
  const boardSize = 812;
  const drawingScale = boardSize / 29;
  const scaleItem = (item) => item.map((value) => value * drawingScale);
  const scaledLevel = {
    walls: levels[0].walls.map(scaleItem),
    coins: levels[0].coins.map(scaleItem),
    pills: levels[0].pills.map(scaleItem),
  };

  const props = {
    player: {
      position: { x: 0, y: 0 },
      size: 27,
      speed: 120,
      direction: null,
      nextDirection: null,
    },
    gameInfo: {
      poweredUp: false,
      powerModeEndsAt: null,
      gameStarted: false,
      showGameOver: false,
      levelCompleted: false,
      playingIntro: false,
    },
    levels: {
      currentLevel: {
        walls: scaledLevel.walls,
        coins: [...scaledLevel.coins],
        pills: scaledLevel.pills,
      },
    },
    powerModeEnded: jest.fn(),
    changeToNextDirection: jest.fn(),
    movePlayer: jest.fn((timeElapsed, position) => {
      props.player.position = position;
    }),
    playerCollided: jest.fn(),
    pillCollected: jest.fn(),
    coinCollected: jest.fn((coin) => {
      const index = props.levels.currentLevel.coins.findIndex(
        (item) => item[0] === coin[0] && item[1] === coin[1],
      );
      if(index !== -1) {
        props.levels.currentLevel.coins.splice(index, 1);
      }
    }),
    increaseScore: jest.fn(),
    powerModeStarted: jest.fn(),
    levelCompleted: jest.fn(),
    resetPlayerAnimation: jest.fn(),
  };

  const app = new AppComponent(props);
  app.frameStart = 0;

  const coinsToCollect = [...scaledLevel.coins];
  for (const coin of coinsToCollect) {
    props.player.position = { x: coin[0], y: coin[1] };
    app.runGame(0);
  }

  expect(props.levels.currentLevel.coins.length).toBe(0);
  expect(props.levelCompleted).toHaveBeenCalled();
});
