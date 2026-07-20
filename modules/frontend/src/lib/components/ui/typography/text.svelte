<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    size?: 'sm' | 'base' | 'lg';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { size = 'base', class: className, children }: Props = $props();

  const textClass = $derived(cn(
    'leading-relaxed text-body',
    size === 'sm' && 'text-sm',
    size === 'base' && 'text-base',
    size === 'lg' && 'text-lg',
    className
  ));
</script>

<p class={textClass}>
  {#if children}
    {@render children()}
  {/if}
</p>
