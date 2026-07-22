<script lang="ts">
  import { cva } from "class-variance-authority";
  import { cn } from "$lib/utils";

  interface Props {
    variant?: "utility" | "tile";
    tileMode?: "light" | "parchment" | "dark";
    class?: string;
    children?: import("svelte").Snippet;
  }

  let {
    variant = "utility",
    tileMode = "light",
    class: className,
    children,
  }: Props = $props();

  const cardVariants = cva("", {
    variants: {
      variant: {
        utility: "rounded-lg border border-hairline bg-canvas p-6",
        tile: "w-full rounded-none px-spacing-section py-spacing-section",
      },
      tileMode: {
        light: "",
        parchment: "",
        dark: "",
      },
    },
    compoundVariants: [
      {
        variant: "tile",
        tileMode: "light",
        class: "bg-canvas text-body",
      },
      {
        variant: "tile",
        tileMode: "parchment",
        class: "bg-canvas-parchment text-body",
      },
      {
        variant: "tile",
        tileMode: "dark",
        class: "bg-surface-tile-1 text-body-on-dark",
      },
    ],
    defaultVariants: {
      variant: "utility",
      tileMode: "light",
    },
  });

  const cardClass = $derived(
    cn(cardVariants({ variant, tileMode }), className),
  );
</script>

<div class={cardClass}>
  {#if children}
    {@render children()}
  {/if}
</div>
