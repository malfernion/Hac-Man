import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Hac-Man/', // GitHub Pages subdirectory
  build: {
    outDir: 'build', // keep same output dir as CRA for gh-pages compat
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
  },
});
