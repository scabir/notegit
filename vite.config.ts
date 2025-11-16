import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src/frontend'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/frontend'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@shared': path.join(__dirname, 'src/shared'),
    },
  },
});

