<script lang="ts">
  import { cva, type VariantProps } from "class-variance-authority";
  import { cn } from "$lib/utils";

  const buttonVariants = cva(
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    {
      variants: {
        variant: {
          primary:
            "bg-primary text-white hover:bg-primary-focus focus-visible:ring-primary-focus",
          secondary:
            "bg-surface-pearl text-ink-muted-80 hover:bg-hairline border border-hairline focus-visible:ring-primary",
          dark: "bg-ink text-white hover:bg-body focus-visible:ring-primary",
          ghost:
            "text-primary hover:bg-canvas border border-transparent focus-visible:ring-primary",
        },
        size: {
          sm: "px-3 py-2 text-sm rounded-sm",
          md: "px-5 py-2.5 text-sm rounded-md",
          lg: "px-6 py-3 text-base rounded-pill",
          pill: "px-[22px] py-[11px] text-base rounded-pill",
        },
      },
      defaultVariants: {
        variant: "primary",
        size: "md",
      },
    },
  );

  type ButtonVariants = VariantProps<typeof buttonVariants>;

  interface Props extends ButtonVariants {
    label?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    href?: string;
    target?: string;
    rel?: string;
    onclick?: (event: MouseEvent) => void;
    class?: string;
    children?: import("svelte").Snippet;
  }

  let {
    label,
    variant = "primary",
    size = "md",
    disabled = false,
    type = "button",
    href,
    target,
    rel,
    onclick,
    class: className,
    children,
    ...restProps
  }: Props & Record<string, unknown> = $props();

  const computedClass = $derived(
    cn(buttonVariants({ variant, size }), className),
  );
</script>

{#if href}
  <a
    {href}
    {target}
    {rel}
    class={computedClass}
    aria-disabled={disabled}
    tabindex={disabled ? -1 : undefined}
    onclick={disabled ? undefined : onclick}
    {...restProps}
  >
    {#if children}
      {@render children()}
    {:else}
      {label}
    {/if}
  </a>
{:else}
  <button {type} {disabled} {onclick} class={computedClass} {...restProps}>
    {#if children}
      {@render children()}
    {:else}
      {label}
    {/if}
  </button>
{/if}

<style lang="postcss">
  /* Ring offset color is handled via inline CSS custom properties */
  :global(.light) a,
  :global(.light) button {
    --tw-ring-offset-color: rgb(var(--color-canvas));
  }

  :global(.dark) a,
  :global(.dark) button {
    --tw-ring-offset-color: rgb(var(--color-surface-black));
  }
</style>
