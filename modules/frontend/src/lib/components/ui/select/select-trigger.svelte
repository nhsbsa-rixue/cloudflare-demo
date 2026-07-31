<script lang="ts">
  import { Select as SelectPrimitive, type WithoutChildrenOrChild } from "bits-ui";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.TriggerProps> & {
    children?: import("svelte").Snippet;
  } = $props();
</script>

<SelectPrimitive.Trigger
  bind:ref
  class={cn(
    "border-hairline bg-canvas text-body flex h-11 w-full items-center justify-between gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-canvas-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
  <ChevronDownIcon class="size-4 shrink-0 text-ink-muted-48" aria-hidden="true" />
</SelectPrimitive.Trigger>
