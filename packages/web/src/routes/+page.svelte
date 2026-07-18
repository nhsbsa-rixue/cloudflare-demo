<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const title = 'Cloudflare Demo';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="A SvelteKit app deployed on Cloudflare Pages with edge SSR." />
</svelte:head>

<main class="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950">
  <div class="max-w-2xl w-full space-y-8 text-center">
    <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
      Welcome to <span class="text-brand-600">{title}</span>
    </h1>

    <p class="text-lg text-gray-600 dark:text-gray-400">
      SvelteKit · Cloudflare Pages · Edge SSR · Tailwind CSS v4
    </p>

    <!-- Worker API response card -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 text-left space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Worker API Response
      </h2>

      {#if data.error}
        <p class="text-sm text-red-600 dark:text-red-400 font-mono">{data.error}</p>
      {:else if data.greeting}
        <p class="text-xl font-semibold text-gray-900 dark:text-gray-50">{data.greeting.message}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 font-mono">{data.greeting.timestamp}</p>
      {/if}
    </div>

    <div class="flex flex-wrap gap-4 justify-center pt-4">
      <a
        href="https://svelte.dev/docs/kit"
        class="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        SvelteKit Docs
      </a>
      <a
        href="https://developers.cloudflare.com/pages"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        Cloudflare Pages
      </a>
    </div>
  </div>
</main>
