<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    type?: string;
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    readonly?: boolean;
    label?: string;
    required?: boolean;
    class?: string;
    name?: string;
    id?: string;
    autocomplete?: string | 'on' | 'off' | 'email' | 'password' | 'username' | 'current-password' | 'new-password';
    onchange?: (event: Event) => void;
    oninput?: (event: Event) => void;
    onblur?: (event: Event) => void;
    onfocus?: (event: Event) => void;
  }

  let {
    type = 'text',
    placeholder,
    value = '',
    disabled = false,
    readonly = false,
    label,
    required = false,
    class: className,
    name,
    id,
    autocomplete,
    onchange,
    oninput,
    onblur,
    onfocus,
  }: Props = $props();

  const inputClass = $derived(cn(
    'w-full rounded-pill border border-hairline bg-canvas px-5 py-3 text-body placeholder-ink-muted-48 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-transparent disabled:bg-divider-soft disabled:text-ink-muted-48 disabled:cursor-not-allowed',
    className
  ));
</script>

{#if label}
  <label for={id} class="block text-sm font-medium text-body mb-2">
    {label}
    {#if required}
      <span class="text-primary">*</span>
    {/if}
  </label>
{/if}

<input
  {type}
  {placeholder}
  bind:value
  {disabled}
  {readonly}
  {required}
  {name}
  {id}
  autocomplete={autocomplete as any}
  {onchange}
  {oninput}
  {onblur}
  {onfocus}
  class={inputClass}
/>
