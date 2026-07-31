<script lang="ts">
  import { Select as SelectPrimitive, type WithoutChild } from "bits-ui";
  import CheckIcon from "@lucide/svelte/icons/check";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    value,
    label,
    children: childrenProp,
    ...restProps
  }: WithoutChild<SelectPrimitive.ItemProps> = $props();
</script>

<SelectPrimitive.Item
  bind:ref
  {value}
  {label}
  class={cn(
    "text-body data-highlighted:bg-canvas-parchment data-disabled:pointer-events-none data-disabled:opacity-50 relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-2 pl-3 pr-8 text-sm outline-none transition-colors",
    className,
  )}
  {...restProps}
>
  {#snippet children({ selected })}
    {#if childrenProp}
      {@render childrenProp({ selected, highlighted: false })}
    {:else}
      {label ?? value}
    {/if}
    {#if selected}
      <CheckIcon class="text-primary absolute right-3 size-4 shrink-0" aria-hidden="true" />
    {/if}
  {/snippet}
</SelectPrimitive.Item>
