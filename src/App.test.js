import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import configureStore from './store';

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
