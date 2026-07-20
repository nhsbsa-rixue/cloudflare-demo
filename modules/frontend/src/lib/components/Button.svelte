<!-- This component is deprecated. Use $lib/components/ui instead. -->
<script lang="ts">
  import UIButton from '$lib/components/ui/button/button.svelte';

  interface Props {
    label?: string;
    variant?: 'primary' | 'secondary' | 'dark' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'pill';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    href?: string;
    onclick?: (event: MouseEvent) => void;
    class?: string;
  }

  let { label, variant, size, disabled, type, href, onclick, class: className }: Props = $props();
</script>

<UIButton {label} {variant} {size} {disabled} {type} {href} {onclick} class={className} />
