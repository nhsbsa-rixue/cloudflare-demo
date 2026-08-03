<script lang="ts">
  import { fly } from "svelte/transition";
  import { rise } from "$lib/motion";
  import { page } from "$app/state";
  import { Card } from "$lib/components/ui/card/index.js";
  import { Heading, Text, Caption } from "$lib/components/ui/typography/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{isNotFound ? "Page Not Found" : "Something Went Wrong"}</title>
  <meta name="description" content="The page you're looking for could not be found." />
</svelte:head>

<main class="min-h-screen bg-canvas-parchment flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-3xl">
    <Card variant="utility" class="w-full px-12 py-16 flex flex-col items-center text-center gap-6">
      <div in:fly={rise(0)}>
        <Caption class="text-ink-muted-48 uppercase tracking-wider mb-3">Error {page.status}</Caption>
        <Heading level={1}>{isNotFound ? "Page Not Found" : "Something Went Wrong"}</Heading>
      </div>
      <div in:fly={rise(80)}>
        <Text size="lg" class="text-ink-muted-48">
          {#if isNotFound}
            The page you're looking for doesn't exist or may have been moved.
          {:else}
            {page.error?.message ?? "An unexpected error occurred. Please try again."}
          {/if}
        </Text>
      </div>
      <div in:fly={rise(160)} class="mt-2">
        <Button variant="dark" size="pill" href="/" style="color: rgb(var(--color-body-on-dark));">
          <span class="text-body-on-dark">Back to home</span>
        </Button>
      </div>
    </Card>
  </div>
</main>
