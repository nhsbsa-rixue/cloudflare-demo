<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    size?: 'sm' | 'base';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { size = 'base', class: className, children }: Props = $props();

  const captionClass = $derived(cn(
    'leading-relaxed text-ink-muted-48',
    size === 'sm' && 'text-xs',
    size === 'base' && 'text-sm',
    className
  ));
</script>

<span class={captionClass}>
  {#if children}
    {@render children()}
  {/if}
</span>
