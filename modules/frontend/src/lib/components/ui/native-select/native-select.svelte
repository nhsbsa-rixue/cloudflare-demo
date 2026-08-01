<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import { cva } from "class-variance-authority";
  import { cn } from "$lib/utils";

  interface Props {
    value?: string;
    name?: string;
    id?: string;
    disabled?: boolean;
    required?: boolean;
    class?: string;
    onchange?: (event: Event) => void;
    onblur?: (event: Event) => void;
    onfocus?: (event: Event) => void;
    children?: import("svelte").Snippet;
  }

  let {
    value = $bindable(""),
    name,
    id,
    disabled = false,
    required = false,
    class: className,
    onchange,
    onblur,
    onfocus,
    children,
    ...restProps
  }: Props & Record<string, unknown> = $props();

  const selectVariants = cva(
    "h-12 w-full appearance-none rounded-pill border border-hairline bg-canvas px-5 pr-11 text-body leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  );

  const selectClass = $derived(cn(selectVariants(), className));
</script>

<div class="relative w-full">
  <select
    bind:value
    {name}
    {id}
    {disabled}
    {required}
    {onchange}
    {onblur}
    {onfocus}
    class={selectClass}
    {...restProps}
  >
    {#if children}
      {@render children()}
    {/if}
  </select>

  <ChevronDownIcon
    class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted-48"
    aria-hidden="true"
  />
</div>