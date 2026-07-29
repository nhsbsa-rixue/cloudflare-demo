<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    Card,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Heading, Text, Caption } from "$lib/components/ui/typography/index.js";
  import type { AppUserRole, CaseStatus, CaseType } from "$lib/types";

  let { data }: { data: PageData } = $props();

  const title = "Cases · Dashboard";

  const rise = (delay: number) => ({
    y: 16,
    duration: 600,
    delay,
    easing: cubicOut,
  });

  // --- Local, editable search state (kept in sync with the loaded query) ---
  // svelte-ignore state_referenced_locally
  let searchValue = $state(data.search);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  // --- Derived pagination figures ---
  const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
  const rangeStart = $derived(data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1);
  const rangeEnd = $derived(Math.min(data.page * data.pageSize, data.total));

  const roleLabels: Record<AppUserRole, string> = {
    admin: "Admin",
    user: "User",
    operator: "Operator",
    editor: "Editor",
  };

  const typeLabels: Record<CaseType, string> = {
    cnc: "CNC",
    "3d": "3D",
    other: "Other",
  };

  const statusStyles: Record<CaseStatus, string> = {
    draft: "bg-surface-pearl text-ink-muted-80 border border-hairline",
    active: "bg-blue-50 text-blue-700 border border-blue-100",
    completed: "bg-green-50 text-green-700 border border-green-100",
    archived: "bg-gray-100 text-gray-700 border border-gray-300",
  };

  function navigate(overrides: Partial<{ search: string; page: number }>) {
    const next = {
      search: data.search,
      page: data.page,
      ...overrides,
    };

    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.page > 1) params.set("page", String(next.page));

    const query = params.toString();
    goto(query ? `?${query}` : "?", {
      keepFocus: true,
      noScroll: true,
    });
  }

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      navigate({ search: searchValue.trim(), page: 1 });
    }, 350);
  }

  function clearSearch() {
    searchValue = "";
    navigate({ search: "", page: 1 });
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages || page === data.page) return;
    navigate({ page });
  }

  function openCase(id: string) {
    goto(`/design/${encodeURIComponent(id)}`);
  }

  function onRowKeydown(event: KeyboardEvent, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCase(id);
    }
  }

  /**
   * Shorten a case id for display by dropping the middle date segment.
   * e.g. `cnc-20260727-854010d8` → `cnc-854010d8`.
   */
  function formatCaseId(id: string): string {
    const parts = id.split("-");
    return parts.length === 3 ? `${parts[0]}-${parts[2]}` : id;
  }

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function formatDate(iso: string): string {
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? "—" : dateFormatter.format(parsed);
  }
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="Browse and manage uploaded cases." />
</svelte:head>

<main class="min-h-screen bg-canvas-parchment">
  <div class="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
    <!-- Header -->
    <div in:fly={rise(0)} class="flex flex-col gap-1">
      <Heading level={1}>Cases</Heading>
      <Text class="text-ink-muted-48">
        Every uploaded case in one place — filter by role, search by ID, and
        download the original design.
      </Text>
    </div>

    <!-- Controls -->
    <div
      in:fly={rise(80)}
      class="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="inline-flex w-full rounded-pill border border-hairline bg-surface-pearl px-4 py-2 md:w-auto">
        <Caption class="text-ink-muted-48">
          Signed in as {roleLabels[data.role]}
        </Caption>
      </div>

      <div class="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <Button
          variant="dark"
          size="md"
          href="/upload"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap"
          style="color: rgb(var(--color-body-on-dark));"
          aria-label="Create a new case"
        >
          <PlusIcon class="size-4 text-body-on-dark" aria-hidden="true" />
          <span class="text-body-on-dark">New case</span>
        </Button>

        <!-- Search -->
        <div class="relative w-full md:w-80">
          <span
            class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted-48"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            bind:value={searchValue}
            oninput={onSearchInput}
            placeholder="Search by case ID"
            aria-label="Search by case ID"
            class="w-full rounded-pill border border-hairline bg-canvas py-2.5 pl-11 pr-10 text-body placeholder-ink-muted-48 transition-colors focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
          {#if searchValue}
            <button
              type="button"
              onclick={clearSearch}
              aria-label="Clear search"
              class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted-48 transition-colors hover:text-ink"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Error -->
    {#if data.error}
      <div
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
        role="alert"
        aria-live="polite"
      >
        <Text class="text-sm font-semibold text-red-800">{data.error}</Text>
      </div>
    {/if}

    <!-- Results -->
    <div in:fly={rise(160)} class="mt-6">
      {#if data.cases.length === 0 && !data.error}
        <Card variant="utility" class="py-16 text-center">
          <Heading level={2} class="text-2xl leading-tight tracking-tight text-ink">No cases found</Heading>
          <Text class="mt-2 text-ink-muted-48">
            {#if data.search}
              No cases match “{data.search}”. Try a different ID.
            {:else}
              As <span class="capitalize">{roleLabels[data.role]}</span>, there are no cases to
              show yet.
            {/if}
          </Text>
        </Card>
      {:else if data.cases.length > 0}
        <!-- Desktop table -->
        <Card variant="utility" class="hidden overflow-hidden p-0 md:block">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-hairline bg-surface-pearl">
                <th
                  class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-48"
                  >Case ID</th
                >
                <th
                  class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-48"
                  >User email</th
                >
                <th
                  class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-48"
                  >Type</th
                >
                <th
                  class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-48"
                  >Status</th
                >
                <th
                  class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-48"
                  >Created</th
                >
                <th
                  class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted-48"
                  >Design</th
                >
              </tr>
            </thead>
            <tbody>
              {#each data.cases as c (c.id)}
                <tr
                  onclick={() => openCase(c.id)}
                  onkeydown={(e) => onRowKeydown(e, c.id)}
                  role="link"
                  tabindex="0"
                  aria-label={`Open case ${formatCaseId(c.id)}`}
                  class="cursor-pointer border-b border-divider-soft transition-colors last:border-b-0 hover:bg-surface-pearl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <td class="px-6 py-4">
                    <Text class="font-mono text-sm font-medium text-ink"
                      >{formatCaseId(c.id)}</Text
                    >
                  </td>
                  <td class="px-6 py-4">
                    <Text class="text-sm text-body">{c.userEmail ?? "—"}</Text>
                  </td>
                  <td class="px-6 py-4">
                    <Text class="text-sm text-body">{typeLabels[c.type]}</Text>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium capitalize {statusStyles[
                        c.status
                      ]}">{c.status}</span
                    >
                  </td>
                  <td class="px-6 py-4">
                    <Text class="text-sm text-body">{formatDate(c.createdAt)}</Text>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <a
                      href={`/api/files?id=${encodeURIComponent(c.id)}`}
                      download
                      onclick={(e) => e.stopPropagation()}
                      class="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-pearl px-3 py-2 text-sm font-medium text-ink-muted-80 transition-colors hover:bg-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Download
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </Card>

        <!-- Mobile card list -->
        <div class="flex flex-col gap-4 md:hidden">
          {#each data.cases as c (c.id)}
            <div
              onclick={() => openCase(c.id)}
              onkeydown={(e) => onRowKeydown(e, c.id)}
              role="link"
              tabindex="0"
              aria-label={`Open case ${formatCaseId(c.id)}`}
              class="cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Card variant="utility" class="transition-colors hover:bg-surface-pearl">
                <CardContent class="flex flex-col gap-3 p-0">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex min-w-0 flex-col">
                      <Text class="truncate font-mono text-sm font-semibold text-ink"
                        >{formatCaseId(c.id)}</Text
                      >
                      <Caption class="truncate text-ink-muted-48"
                        >{c.userEmail ?? "—"}</Caption
                      >
                    </div>
                    <span
                      class="shrink-0 rounded-pill px-3 py-1 text-xs font-medium capitalize {statusStyles[
                        c.status
                      ]}">{c.status}</span
                    >
                  </div>

                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-muted-48">Type</span>
                    <span class="text-body">{typeLabels[c.type]}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-ink-muted-48">Created</span>
                    <span class="text-body">{formatDate(c.createdAt)}</span>
                  </div>

                  <a
                    href={`/api/files?id=${encodeURIComponent(c.id)}`}
                    download
                    onclick={(e) => e.stopPropagation()}
                    class="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-hairline bg-surface-pearl px-3 py-2.5 text-sm font-medium text-ink-muted-80 transition-colors hover:bg-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Download design
                  </a>
                </CardContent>
              </Card>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Pagination -->
    {#if data.total > 0}
      <div
        class="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row"
      >
        <Text class="text-sm text-ink-muted-48">
          Showing {rangeStart}–{rangeEnd} of {data.total}
        </Text>
        <div class="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={data.page <= 1}
            onclick={() => goToPage(data.page - 1)}
          >
            Previous
          </Button>
          <Text class="text-sm font-medium text-body">
            Page {data.page} of {totalPages}
          </Text>
          <Button
            variant="secondary"
            size="sm"
            disabled={data.page >= totalPages}
            onclick={() => goToPage(data.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    {/if}
  </div>
</main>
