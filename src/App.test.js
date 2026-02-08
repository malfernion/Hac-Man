import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import configureStore from './store';

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
