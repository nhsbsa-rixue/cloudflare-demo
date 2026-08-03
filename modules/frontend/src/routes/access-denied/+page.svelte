<script lang="ts">
  import { fly } from 'svelte/transition';
  import { rise } from '$lib/motion';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Heading, Text, Caption } from '$lib/components/ui/typography/index.js';
  import { Button } from '$lib/components/ui/button/index.js';

</script>

<svelte:head>
  <title>Access Denied</title>
  <meta name="description" content="Your email is not on the access list for this application." />
</svelte:head>

<main class="min-h-screen bg-canvas-parchment flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-3xl">
    <Card variant="utility" class="w-full px-12 py-16 flex flex-col items-center text-center gap-6">
      <div in:fly={rise(0)}>
        <Caption class="text-ink-muted-48 uppercase tracking-wider mb-3">Error 403</Caption>
        <Heading level={1}>Access Denied</Heading>
      </div>
      <div in:fly={rise(80)}>
        <Text size="lg" class="text-ink-muted-48">
          Your email is not on the access list for this application.
          Contact your administrator to request access.
        </Text>
      </div>
      <div in:fly={rise(160)} class="mt-2">
        <Button variant="dark" size="pill" href="/about" style="color: rgb(var(--color-body-on-dark));">
          <span class="text-body-on-dark">Learn more about us</span>
        </Button>
      </div>
    </Card>
  </div>
</main>
