<script lang="ts">
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { Card } from "$lib/components/ui/card/index.js";
  import { Heading, Text, Caption } from "$lib/components/ui/typography/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { NativeSelect } from "$lib/components/ui/native-select/index.js";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const emailSelectId = "dev-login-email";

  let selectedEmail = $state("");

  $effect(() => {
    selectedEmail = data.currentEmail ?? data.knownUsers[0]?.email ?? "";
  });

  const rise = (delay: number) => ({ y: 16, duration: 600, delay, easing: cubicOut });
</script>

<svelte:head>
  <title>Local dev sign-in</title>
  <meta name="description" content="Switch or sign out of the local mock authentication user." />
</svelte:head>

<main class="min-h-screen bg-canvas-parchment flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-3xl">
    <Card variant="utility" class="w-full px-12 py-16 flex flex-col items-center text-center gap-6">
      <div in:fly={rise(0)}>
        <Caption class="text-ink-muted-80 uppercase tracking-wider mb-3">Local development only</Caption>
        <Heading level={1}>{data.currentEmail ? "Dev sign-in" : "Signed Out"}</Heading>
      </div>

      <div in:fly={rise(80)}>
        <Text size="lg" class="text-ink-muted-80">
          {#if data.currentEmail}
            Signed in locally as <strong>{data.currentEmail}</strong>. This mock identity replaces
            Cloudflare Access, which isn't available when running the dev server.
          {:else}
            Signed out. Pick a mock user below to continue.
          {/if}
        </Text>
      </div>

      <div in:fly={rise(160)} class="w-full flex flex-col gap-3">
        <form method="POST" action="?/switchUser" class="flex w-full flex-col gap-2">
          <label for={emailSelectId} class="sr-only">Choose a mock user</label>
          <NativeSelect
            bind:value={selectedEmail}
            id={emailSelectId}
            name="email"
            class="w-full"
          >
            {#each data.knownUsers as user (user.email)}
              <option value={user.email}>{user.label}</option>
            {/each}
          </NativeSelect>
          <Button
            type="submit"
            variant="dark"
            size="pill"
            class="w-full"
            style="color: rgb(var(--color-body-on-dark));"
          >
            <span class="text-body-on-dark">Switch user</span>
          </Button>
        </form>

        {#if data.currentEmail}
          <form method="POST" action="?/logout" class="w-full">
            <Button
              type="submit"
              variant="dark"
              size="pill"
              class="w-full"
              style="color: rgb(var(--color-body-on-dark));"
            >
              <span class="text-body-on-dark">Sign out</span>
            </Button>
          </form>
        {/if}
      </div>
    </Card>
  </div>
</main>
