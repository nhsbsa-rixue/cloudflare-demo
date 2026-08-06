import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    setupFiles: ['./test-setup/setup.ts'],
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    globals: true,
    passWithNoTests: true,
    reporters: process.env.CI
      ? [
          'default',
          [
            'vitest-sonar-reporter',
            {
              outputFile: 'test-report.xml',
              onWritePath(path: string) {
                return `modules/backend/${path}`;
              }
            }
          ]
        ]
      : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts']
    }
  }
});
