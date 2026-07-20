import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from './button.svelte';

describe('Button', () => {
  it('renders with the given label', () => {
    render(Button, { label: 'Click me' });
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(Button, { label: 'Primary' });
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  it('applies secondary variant classes', () => {
    render(Button, { label: 'Secondary', variant: 'secondary' });
    expect(screen.getByRole('button')).toHaveClass('bg-surface-pearl');
  });

  it('renders as link when href is provided', () => {
    render(Button, { label: 'Link', href: '/test' });
    expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument();
  });

  it('is disabled when the disabled prop is true', () => {
    render(Button, { label: 'Disabled', disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onclick handler when clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(Button, { label: 'Clickable', onclick: handler });
    await user.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('applies custom class names', () => {
    render(Button, { label: 'Custom', class: 'custom-class' });
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('supports size prop', () => {
    render(Button, { label: 'Large', size: 'lg' });
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3');
  });
});
