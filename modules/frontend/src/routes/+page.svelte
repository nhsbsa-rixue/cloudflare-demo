<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
  import { Heading, Lead, Text } from '$lib/components/ui/typography/index.js';

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

<!-- Hero Tile -->
<section class="w-full min-h-screen flex flex-col items-center justify-center px-spacing-lg py-spacing-section bg-canvas-parchment">
  <div class="max-w-4xl w-full space-y-8 text-center">
    <Heading level={1} class="text-ink">
      Welcome to <span class="text-primary">{title}</span>
    </Heading>

    <Lead class="text-ink-muted-80">
      SvelteKit · Cloudflare Pages · Edge SSR · Tailwind CSS v4
    </Lead>

    <!-- Worker API Card -->
    <Card variant="utility" class="mx-auto max-w-2xl text-left space-y-4">
      <CardHeader>
        <Text class="text-sm font-semibold uppercase tracking-wider text-ink-muted-48">
          Worker API Response
        </Text>
      </CardHeader>

      <CardContent class="space-y-4">
        <form method="POST" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-ink mb-2">
              Username
            </label>
            <div class="flex gap-3">
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={submittedUsername}
                placeholder="Enter your name"
              />
              <Button type="submit" size="md" variant="primary">
                Send
              </Button>
            </div>
          </div>
        </form>

        {#if apiError}
          <Text class="text-sm text-red-600 font-mono">{apiError}</Text>
        {:else if apiResult}
          <div class="space-y-2">
            <Text class="text-xl font-semibold text-ink">{apiResult.message}</Text>
            <Text class="text-sm text-ink-muted-48 font-mono">{apiResult.timestamp}</Text>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- CTA Buttons -->
    <div class="flex flex-wrap gap-4 justify-center pt-4">
      <Button
        href="https://svelte.dev/docs/kit"
        target="_blank"
        rel="noopener noreferrer"
        label="SvelteKit Docs"
        variant="primary"
        size="lg"
      />
      <Button
        href="https://developers.cloudflare.com/pages"
        target="_blank"
        rel="noopener noreferrer"
        label="Cloudflare Pages"
        variant="secondary"
        size="lg"
      />
    </div>
  </div>
</section>

