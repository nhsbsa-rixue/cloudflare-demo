import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Build-only config — test config lives in vitest.config.ts
export default defineConfig({
  plugins: [
    // Tailwind must come before SvelteKit so CSS is processed first
    tailwindcss(),
    sveltekit()
  ]
});
