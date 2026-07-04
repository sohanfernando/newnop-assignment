import type { Task } from '../types';
import { displayStatusLabel, statusColors } from '../lib/taskDisplay';

export function StatusBadge({ task }: { task: Pick<Task, 'status' | 'dueDate'> }) {
  const label = displayStatusLabel(task);
  const colors = statusColors(label);
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}
