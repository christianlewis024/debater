import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test utilities
    globals: true,

    // Setup files
    setupFiles: ['./src/tests/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.config.js',
        '**/dist/',
        '**/build/',
      ],
    },

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],

    // Exclude E2E tests (handled by Playwright)
    exclude: [
      'node_modules',
      'dist',
      'build',
      'e2e/**',
    ],

    // Browser mode for component tests (disabled by default)
    // Uncomment and configure when needed:
    // browser: {
    //   enabled: true,
    //   name: 'chromium',
    //   provider: async () => {
    //     const { playwright } = await import('@vitest/browser-playwright');
    //     return playwright();
    //   },
    // },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
    },
  },
});
