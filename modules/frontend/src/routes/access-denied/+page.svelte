<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Heading, Lead, Text } from '$lib/components/ui/typography/index.js';
  import { Button } from '$lib/components/ui/button/index.js';

  const rise = (delay: number) => ({ y: 16, duration: 600, delay, easing: cubicOut });
</script>

<svelte:head>
  <title>Access Denied</title>
</svelte:head>

<Card variant="tile" tileMode="light">
  <div class="mx-auto max-w-xl text-center flex flex-col items-center gap-4 py-16">
    <div in:fly={rise(0)}>
      <Heading level={1}>Access Denied</Heading>
    </div>
    <div in:fly={rise(80)}>
      <Lead>Your email is not on the access list for this application.</Lead>
    </div>
    <div in:fly={rise(160)}>
      <Text size="base" class="text-ink-muted-48">
        Contact your administrator to request access.
      </Text>
    </div>
    <div in:fly={rise(240)} class="mt-4">
      <Button variant="secondary" size="pill" href="/" label="Back to home" />
    </div>
  </div>
</Card>
