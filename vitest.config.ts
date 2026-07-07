import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: resolve(__dirname, '.') + '/' }],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.tsx'],
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
