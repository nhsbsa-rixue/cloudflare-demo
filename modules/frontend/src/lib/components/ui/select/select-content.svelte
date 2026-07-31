<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 6,
    portalProps,
    children,
    ...restProps
  }: SelectPrimitive.ContentProps & {
    portalProps?: SelectPrimitive.PortalProps;
  } = $props();
</script>

<SelectPrimitive.Portal {...portalProps}>
  <SelectPrimitive.Content
    bind:ref
    {sideOffset}
    class={cn(
      "border-hairline bg-canvas relative z-50 max-h-96 min-w-[var(--bits-select-anchor-width)] overflow-y-auto overflow-x-hidden rounded-md border p-1 shadow-product",
      className,
    )}
    {...restProps}
  >
    <SelectPrimitive.Viewport class="flex flex-col gap-0.5 p-1">
      {@render children?.()}
    </SelectPrimitive.Viewport>
  </SelectPrimitive.Content>
</SelectPrimitive.Portal>
