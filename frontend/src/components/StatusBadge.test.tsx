import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('shows "To Do" for a TODO task due in the future', () => {
    render(<StatusBadge task={{ status: 'TODO', dueDate: '2999-01-01' }} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('shows "In Progress" for an IN_PROGRESS task due in the future', () => {
    render(<StatusBadge task={{ status: 'IN_PROGRESS', dueDate: '2999-01-01' }} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows "Done" for a DONE task even with a past due date', () => {
    render(<StatusBadge task={{ status: 'DONE', dueDate: '2000-01-01' }} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows "Overdue" for a non-done task past its due date', () => {
    render(<StatusBadge task={{ status: 'TODO', dueDate: '2000-01-01' }} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});
