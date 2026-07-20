<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { class: className, children }: Props = $props();

  const leadClass = $derived(cn('text-2xl font-light leading-relaxed text-body', className));
</script>

<p class={leadClass}>
  {#if children}
    {@render children()}
  {/if}
</p>
