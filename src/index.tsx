import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';

import './index.css';
import App from './App';

if (import.meta.env.MODE !== 'production') {
  (window as any).__HACMAN_STORE__ = store;
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const root = createRoot(rootEl);
// react-redux@7 + @types/react@18.3 compatibility: Provider type mismatch is a known issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyProvider = Provider as React.ComponentType<{ store: any; children: React.ReactNode }>;

root.render(
  <React.StrictMode>
    <AnyProvider store={store}>
      <App />
    </AnyProvider>
  </React.StrictMode>,
);
