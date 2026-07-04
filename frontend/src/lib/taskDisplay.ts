import type { Task, TaskStatus } from '../types';

export function isOverdue(task: Pick<Task, 'status' | 'dueDate'>): boolean {
  if (task.status === 'DONE') return false;
  const due = new Date(`${task.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function statusLabel(status: TaskStatus): string {
  if (status === 'TODO') return 'To Do';
  if (status === 'IN_PROGRESS') return 'In Progress';
  return 'Done';
}

export function displayStatusLabel(task: Pick<Task, 'status' | 'dueDate'>): string {
  return isOverdue(task) ? 'Overdue' : statusLabel(task.status);
}

export function statusColors(label: string): { bg: string; text: string } {
  if (label === 'Done') return { bg: 'var(--color-done-bg)', text: 'var(--color-done-text)' };
  if (label === 'In Progress') return { bg: 'var(--color-progress-bg)', text: 'var(--color-progress-text)' };
  if (label === 'Overdue') return { bg: 'oklch(0.94 0.055 25)', text: 'var(--color-overdue-text)' };
  return { bg: 'var(--color-avatar-bg)', text: 'var(--color-avatar-text)' };
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
