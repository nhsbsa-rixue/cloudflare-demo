import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders with the given label', () => {
    render(Button, { label: 'Click me' });
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(Button, { label: 'Primary' });
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
  });

  it('applies secondary variant classes', () => {
    render(Button, { label: 'Secondary', variant: 'secondary' });
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
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
});
