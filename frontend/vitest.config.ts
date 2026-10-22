import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // fake-indexeddb is installed on globalThis before any store is imported.
    setupFiles: ['tests/setup.ts']
  }
});
