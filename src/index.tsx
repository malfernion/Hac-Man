import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';

import './index.css';
import App from './App';

if (process.env.NODE_ENV !== 'production') {
  (window as any).__HACMAN_STORE__ = store;
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
