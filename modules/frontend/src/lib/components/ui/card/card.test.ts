import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Card from './card.svelte';

describe('Card', () => {
  it('renders a container element', () => {
    const { container } = render(Card);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('uses utility styles by default', () => {
    const { container } = render(Card);
    expect(container.firstElementChild).toHaveClass('rounded-lg', 'border', 'bg-canvas');
  });

  it('applies tile dark mode styles', () => {
    const { container } = render(Card, { variant: 'tile', tileMode: 'dark' });
    expect(container.firstElementChild).toHaveClass('bg-surface-tile-1', 'text-body-on-dark');
  });
});
