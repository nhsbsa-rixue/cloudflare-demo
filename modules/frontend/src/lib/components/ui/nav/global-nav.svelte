<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { class: className, children }: Props = $props();

  const navClass = $derived(cn('w-full bg-surface-black text-body-on-dark h-11 flex items-center px-6 gap-8', className));
</script>

<nav class={navClass}>
  {#if children}
    {@render children()}
  {/if}
</nav>
