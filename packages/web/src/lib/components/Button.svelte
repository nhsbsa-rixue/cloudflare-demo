<script lang="ts">
  type Variant = 'primary' | 'secondary' | 'ghost';
  type ButtonType = 'button' | 'submit' | 'reset';

  interface Props {
    label: string;
    variant?: Variant;
    disabled?: boolean;
    type?: ButtonType;
    onclick?: (event: MouseEvent) => void;
  }

  const variantClasses: Record<Variant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary:
      'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  let { label, variant = 'primary', disabled = false, type = 'button', onclick }: Props = $props();
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm transition-colors
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
         disabled:opacity-50 disabled:pointer-events-none
         {variantClasses[variant]}"
>
  {label}
</button>
