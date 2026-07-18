import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Enables TypeScript, PostCSS, and Tailwind processing in .svelte files
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      // Wrangler config used for local binding emulation (platform.env)
      platformProxy: {
        configPath: './wrangler.jsonc'
      }
    })
  }
};

export default config;
