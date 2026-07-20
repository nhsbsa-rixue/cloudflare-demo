import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// Separate Vitest config using the standalone svelte() plugin (not sveltekit()).
// This enables resolve.conditions: ['browser'] which is required for Svelte 5
// component tests — the SvelteKit SSR plugin conflicts with browser-mode mount().
export default defineConfig({
  plugins: [tailwindcss(), svelte()],

  resolve: {
    // Use browser exports from Svelte so mount() is available in tests
    conditions: ['browser'],
    // Add alias for $lib so imports resolve correctly in test environment
    alias: {
      $lib: path.resolve('./src/lib')
    }
  },

  test: {
    // Use happy-dom for fast, lightweight DOM emulation
    environment: 'happy-dom',
    setupFiles: ['./test-setup/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,ts,svelte}'],
      exclude: ['src/**/*.{test,spec}.{js,ts}', 'src/app.d.ts']
    }
  }
});
