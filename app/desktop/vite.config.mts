import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: path.join(rootDir, 'src/frontend'),
  base: './',
  build: {
    outDir: path.join(rootDir, 'dist/frontend'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@shared': path.join(rootDir, 'src/shared'),
    },
  },
});
