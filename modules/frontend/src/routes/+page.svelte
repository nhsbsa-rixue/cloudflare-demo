<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const title = 'Cloudflare Demo';

  const apiResult = $derived(form?.greeting ?? data.greeting);
  const apiError = $derived(form?.error ?? data.error);
  const submittedUsername = $derived(form?.username ?? '');
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

      <form method="POST" class="space-y-3">
        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
        <div class="flex gap-3">
          <input
            id="username"
            name="username"
            type="text"
            required
            value={submittedUsername}
            placeholder="Enter your name"
            class="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-gray-900 dark:text-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Send
          </button>
        </div>
      </form>

      {#if apiError}
        <p class="text-sm text-red-600 dark:text-red-400 font-mono">{apiError}</p>
      {:else if apiResult}
        <p class="text-xl font-semibold text-gray-900 dark:text-gray-50">{apiResult.message}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 font-mono">{apiResult.timestamp}</p>
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
