<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: import('svelte').Snippet;
    cta?: import('svelte').Snippet;
  }

  let { class: className, children, cta }: Props = $props();

  const subNavClass = $derived(cn('w-full bg-canvas-parchment text-body h-13 flex items-center justify-between px-6 border-b border-hairline backdrop-blur', className));
</script>

<nav class={subNavClass}>
  <div class="flex items-center gap-6">
    {#if children}
      {@render children()}
    {/if}
  </div>
  {#if cta}
    <div>
      {@render cta()}
    </div>
  {/if}
</nav>
