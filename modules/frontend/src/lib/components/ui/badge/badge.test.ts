import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Badge from './badge.svelte';

describe('Badge', () => {
  it('applies default variant styles', () => {
    const { container } = render(Badge);
    expect(container.firstElementChild).toHaveClass('bg-primary', 'text-white');
  });

  it('applies pearl variant styles', () => {
    const { container } = render(Badge, { variant: 'pearl' });
    expect(container.firstElementChild).toHaveClass('bg-surface-pearl', 'border-hairline');
  });

  it('applies selected state ring styles', () => {
    const { container } = render(Badge, { selected: true });
    expect(container.firstElementChild).toHaveClass('ring-primary');
  });
});
