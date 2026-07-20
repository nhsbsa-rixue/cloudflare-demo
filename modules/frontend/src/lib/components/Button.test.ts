import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
// Note: This test file is deprecated. Test the UI button directly in src/lib/components/ui/button/button.test.ts
import Button from './Button.svelte';

describe('Button (Legacy Re-export)', () => {
  it('renders with the given label', () => {
    render(Button, { label: 'Click me' });
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
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
