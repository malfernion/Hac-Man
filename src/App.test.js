import React from 'react';
import { render } from '@testing-library/react';
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
