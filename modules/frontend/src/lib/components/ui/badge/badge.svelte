<script lang="ts">
  import { cva } from "class-variance-authority";
  import { cn } from "$lib/utils";

  interface Props {
    variant?: "default" | "pearl";
    selected?: boolean;
    class?: string;
    children?: import("svelte").Snippet;
  }

  let {
    variant = "default",
    selected = false,
    class: className,
    children,
  }: Props = $props();

  const badgeVariants = cva(
    "inline-flex items-center rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
    {
      variants: {
        variant: {
          default: "bg-primary text-white",
          pearl: "bg-surface-pearl text-ink-muted-80 border border-hairline",
        },
        selected: {
          false: "",
          true: "ring-2 ring-primary ring-offset-2",
        },
      },
      defaultVariants: {
        variant: "default",
        selected: false,
      },
    },
  );

  const badgeClass = $derived(
    cn(badgeVariants({ variant, selected }), className),
  );
</script>

<span class={badgeClass}>
  {#if children}
    {@render children()}
  {/if}
</span>
