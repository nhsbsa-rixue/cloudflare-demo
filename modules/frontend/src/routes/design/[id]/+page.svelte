<script lang="ts">
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import {
    Card,
    CardContent,
    CardHeader,
  } from "$lib/components/ui/card/index.js";
  import { Heading, Text, Caption } from "$lib/components/ui/typography/index.js";

  let { data }: { data: PageData } = $props();

  const file = $derived(data.file);
  const detail = $derived(data.detail);
  const title = $derived(`Design ${detail.id}`);

  const rise = (delay: number) => ({
    y: 16,
    duration: 600,
    delay,
    easing: cubicOut,
  });

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    "in-review": "In review",
    quoted: "Quoted",
    completed: "Completed",
  };

  const isImage = $derived(file.contentType.startsWith("image/"));
  const isPdf = $derived(file.contentType === "application/pdf");

  function formatBytes(bytes: number): string {
    if (bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }

  function formatDate(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }

  const metaRows = $derived([
    { label: "File name", value: file.filename },
    { label: "Type", value: file.contentType },
    { label: "Size", value: formatBytes(file.size) },
    { label: "Uploaded", value: formatDate(file.uploadedAt) },
  ]);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="CNC design attributes for an uploaded document." />
</svelte:head>

<!-- Read-only chip list: highlights the selected value, dims the alternatives. -->
{#snippet chips(options: string[], selectedValue: string | undefined)}
  <div class="flex flex-wrap gap-2">
    {#each options as option (option)}
      {@const active = option === selectedValue}
      <span
        class={active
          ? "inline-flex items-center gap-1.5 rounded-pill border border-primary bg-surface-pearl px-3 py-1.5 text-sm font-semibold text-ink"
          : "inline-flex items-center rounded-pill border border-hairline bg-surface-pearl px-3 py-1.5 text-sm text-ink-muted-48 opacity-60"}
      >
        {#if active}
          <svg
            class="size-3.5 text-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.29 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clip-rule="evenodd"
            />
          </svg>
        {/if}
        {option}
      </span>
    {/each}
  </div>
{/snippet}

<!-- A labelled attribute block. -->
{#snippet field(label: string, required: boolean)}
  <div class="flex items-baseline gap-1">
    {#if required}
      <span class="text-red-500" aria-hidden="true">*</span>
    {/if}
    <Text class="text-sm font-semibold text-ink">{label}</Text>
  </div>
{/snippet}

<main class="min-h-screen bg-canvas-parchment px-6 py-spacing-section">
  <div class="mx-auto w-full max-w-6xl">
    <!-- Page header -->
    <div
      in:fly={rise(0)}
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-2">
        <Caption size="sm" class="uppercase tracking-wider">Design detail</Caption>
        <Heading level={2}>CNC design attributes</Heading>
        <Text size="sm" class="font-mono text-ink-muted-48">Case {detail.id}</Text>
      </div>
      <div class="flex items-center gap-3">
        <Badge variant="pearl">{statusLabels[detail.status] ?? detail.status}</Badge>
        <Button variant="secondary" size="md" href="/upload">Upload another</Button>
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Left: document preview + metadata -->
      <div in:fly={rise(80)} class="lg:col-span-1">
        <Card variant="utility" class="lg:sticky lg:top-6 flex flex-col gap-5">
          <div
            class="flex aspect-[4/3] w-full items-center justify-center rounded-md border border-hairline bg-surface-pearl"
          >
            <div class="flex flex-col items-center gap-3 text-ink-muted-48">
              {#if isImage}
                <svg class="size-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="8.5" cy="9.5" r="1.5" />
                  <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17m-2-2 1.5-1.5a2 2 0 0 1 2.8 0L21 16" />
                </svg>
              {:else if isPdf}
                <svg class="size-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
                  <path d="M9 13h6M9 17h4" />
                </svg>
              {:else}
                <svg class="size-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
                </svg>
              {/if}
              <Caption size="sm">Preview unavailable</Caption>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            {#each metaRows as row (row.label)}
              <div class="flex items-start justify-between gap-4">
                <Caption size="base" class="shrink-0">{row.label}</Caption>
                <Text size="sm" class="text-right break-all text-ink">{row.value}</Text>
              </div>
            {/each}
          </div>
        </Card>
      </div>

      <!-- Right: read-only CNC attributes -->
      <div in:fly={rise(160)} class="flex flex-col gap-6 lg:col-span-2">
        <!-- Design specification -->
        <Card variant="utility">
          <CardHeader>
            <Heading level={6}>Design specification</Heading>
          </CardHeader>
          <CardContent class="flex flex-col gap-6">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-[10rem_1fr] sm:items-center">
              {@render field("Quantity", true)}
              <Text class="text-ink">{detail.quantity}</Text>

              {@render field("Design units", false)}
              {@render chips(detail.unitOptions, detail.unit)}
            </div>
          </CardContent>
        </Card>

        <!-- Material -->
        <Card variant="utility">
          <CardHeader>
            <Heading level={6}>Material</Heading>
          </CardHeader>
          <CardContent class="flex flex-col gap-6">
            <div class="flex flex-col gap-3">
              {@render field("Material", true)}
              {@render chips(detail.materialOptions, detail.material)}
            </div>

            {#if detail.materialSubTypeOptions?.length}
              <div class="flex flex-col gap-3">
                {@render field(`Type of ${detail.material}`, false)}
                {@render chips(detail.materialSubTypeOptions, detail.materialSubType)}
              </div>
            {/if}

            {#if detail.color}
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr] sm:items-center">
                {@render field("Color", true)}
                <span
                  class="inline-flex w-fit items-center gap-2 rounded-pill border border-primary bg-surface-pearl px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  <span
                    class="size-3.5 rounded-sm border border-hairline bg-white"
                    aria-hidden="true"
                  ></span>
                  {detail.color}
                </span>
              </div>
            {/if}
          </CardContent>
        </Card>

        <!-- Finishing & tolerance -->
        <Card variant="utility">
          <CardHeader>
            <Heading level={6}>Finishing &amp; tolerance</Heading>
          </CardHeader>
          <CardContent
            class="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-[10rem_1fr] sm:items-center"
          >
            {@render field("Surface finish", false)}
            <Text class="text-ink">{detail.surfaceFinish ?? "—"}</Text>

            {@render field("Tolerance", false)}
            <Text class="text-ink">{detail.tolerance ?? "—"}</Text>

            {@render field("Threads / tapping", false)}
            <Text class="text-ink">{detail.threads ?? "—"}</Text>
          </CardContent>
        </Card>

        <!-- Remarks -->
        {#if detail.remarks}
          <Card variant="utility">
            <CardHeader>
              <Heading level={6}>Remarks</Heading>
            </CardHeader>
            <CardContent>
              <Text size="sm" class="text-ink-muted-80">{detail.remarks}</Text>
            </CardContent>
          </Card>
        {/if}
      </div>
    </div>
  </div>
</main>
