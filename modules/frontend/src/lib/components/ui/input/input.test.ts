import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Input from './input.svelte';

describe('Input', () => {
  it('renders an input with default classes', () => {
    render(Input, { id: 'name' });
    expect(screen.getByRole('textbox')).toHaveClass('rounded-pill', 'border-hairline');
  });

  it('renders a label and required marker', () => {
    render(Input, { id: 'email', label: 'Email', required: true });
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('forwards input events', async () => {
    const oninput = vi.fn();
    render(Input, { id: 'message', oninput });
    const input = screen.getByRole('textbox');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(oninput).toHaveBeenCalledOnce();
  });
});
