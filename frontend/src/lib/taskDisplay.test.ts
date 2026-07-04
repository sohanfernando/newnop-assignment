import { describe, expect, it } from 'vitest';
import { displayStatusLabel, formatDate, initials, isOverdue, statusColors, statusLabel } from './taskDisplay';
import type { Task } from '../types';

function makeTask(overrides: Partial<Pick<Task, 'status' | 'dueDate'>>): Pick<Task, 'status' | 'dueDate'> {
  return { status: 'TODO', dueDate: '2020-01-01', ...overrides };
}

describe('isOverdue', () => {
  it('returns true for a past due date that is not done', () => {
    expect(isOverdue(makeTask({ status: 'TODO', dueDate: '2000-01-01' }))).toBe(true);
  });

  it('returns false for a future due date', () => {
    expect(isOverdue(makeTask({ status: 'TODO', dueDate: '2999-01-01' }))).toBe(false);
  });

  it('returns false for a done task even if the due date has passed', () => {
    expect(isOverdue(makeTask({ status: 'DONE', dueDate: '2000-01-01' }))).toBe(false);
  });
});

describe('statusLabel', () => {
  it('maps TODO to "To Do"', () => {
    expect(statusLabel('TODO')).toBe('To Do');
  });

  it('maps IN_PROGRESS to "In Progress"', () => {
    expect(statusLabel('IN_PROGRESS')).toBe('In Progress');
  });

  it('maps DONE to "Done"', () => {
    expect(statusLabel('DONE')).toBe('Done');
  });
});

describe('displayStatusLabel', () => {
  it('shows "Overdue" instead of the raw status when the task is overdue', () => {
    expect(displayStatusLabel(makeTask({ status: 'IN_PROGRESS', dueDate: '2000-01-01' }))).toBe('Overdue');
  });

  it('shows the raw status label when not overdue', () => {
    expect(displayStatusLabel(makeTask({ status: 'IN_PROGRESS', dueDate: '2999-01-01' }))).toBe('In Progress');
  });
});

describe('statusColors', () => {
  it('returns distinct colors for each known label', () => {
    const labels = ['Done', 'In Progress', 'Overdue', 'To Do'];
    const colorPairs = labels.map((label) => statusColors(label));
    const unique = new Set(colorPairs.map((c) => `${c.bg}|${c.text}`));
    expect(unique.size).toBe(labels.length);
  });
});

describe('formatDate', () => {
  it('formats an ISO date as a human-readable string', () => {
    expect(formatDate('2026-08-01')).toBe('Aug 1, 2026');
  });
});

describe('initials', () => {
  it('takes the first letter of up to two words, uppercased', () => {
    expect(initials('Sohan Fernando')).toBe('SF');
  });

  it('handles a single-word name', () => {
    expect(initials('admin')).toBe('A');
  });
});
