<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'default' | 'pearl';
    selected?: boolean;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { variant = 'default', selected = false, class: className, children }: Props = $props();

  const badgeClass = $derived(cn(
    'inline-flex items-center rounded-pill px-3 py-1.5 text-sm font-medium transition-colors',
    variant === 'default' && 'bg-primary text-white',
    variant === 'pearl' && 'bg-surface-pearl text-ink-muted-80 border border-hairline',
    selected && 'ring-2 ring-primary ring-offset-2',
    className
  ));
</script>

<span class={badgeClass}>
  {#if children}
    {@render children()}
  {/if}
</span>
