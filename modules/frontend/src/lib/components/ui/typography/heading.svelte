<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { level = 1, class: className, children }: Props = $props();

  const headingClass = $derived(cn(
    'font-display font-semibold',
    level === 1 && 'text-6xl leading-tight tracking-tighter',
    level === 2 && 'text-5xl leading-tight tracking-none',
    level === 3 && 'text-4xl leading-tight tracking-tighter',
    level === 4 && 'text-3xl font-semibold',
    level === 5 && 'text-2xl font-semibold',
    level === 6 && 'text-xl font-semibold',
    className
  ));

  const HeadingTag = $derived(`h${level}` as keyof HTMLElementTagNameMap);
</script>

<svelte:element this={HeadingTag} class={headingClass}>
  {#if children}
    {@render children()}
  {/if}
</svelte:element>
