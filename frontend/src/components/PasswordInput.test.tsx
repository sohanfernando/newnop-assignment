import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('renders masked by default', () => {
    render(<PasswordInput value="secret" onChange={() => {}} />);
    expect(screen.getByDisplayValue('secret')).toHaveAttribute('type', 'password');
  });

  it('reveals the value as plain text when the toggle is clicked, and re-hides on a second click', async () => {
    const user = userEvent.setup();
    render(<PasswordInput value="secret" onChange={() => {}} />);

    const toggle = screen.getByRole('button', { name: /show password/i });
    await user.click(toggle);
    expect(screen.getByDisplayValue('secret')).toHaveAttribute('type', 'text');

    const hideToggle = screen.getByRole('button', { name: /hide password/i });
    await user.click(hideToggle);
    expect(screen.getByDisplayValue('secret')).toHaveAttribute('type', 'password');
  });

  it('calls onChange with the new value when typed into', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<PasswordInput value="" onChange={onChange} />);

    const input = container.querySelector('input')!;
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
