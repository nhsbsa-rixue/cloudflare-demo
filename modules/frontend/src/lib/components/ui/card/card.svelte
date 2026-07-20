<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'utility' | 'tile';
    tileMode?: 'light' | 'parchment' | 'dark';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { variant = 'utility', tileMode = 'light', class: className, children }: Props = $props();

  const cardClass = $derived(cn(
    variant === 'utility'
      ? 'rounded-lg border border-hairline bg-canvas p-6'
      : 'w-full rounded-none px-spacing-section py-spacing-section',
    variant === 'tile' && tileMode === 'light' && 'bg-canvas text-body',
    variant === 'tile' && tileMode === 'parchment' && 'bg-canvas-parchment text-body',
    variant === 'tile' && tileMode === 'dark' && 'bg-surface-tile-1 text-body-on-dark',
    className
  ));
</script>

<div class={cardClass}>
  {#if children}
    {@render children()}
  {/if}
</div>