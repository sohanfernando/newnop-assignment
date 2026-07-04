import { TASK_STATUSES, type Task, type TaskStatus } from '../types';
import { statusColors, statusLabel } from '../lib/taskDisplay';

interface StatusDropdownProps {
  task: Pick<Task, 'status'>;
  onChange: (status: TaskStatus) => void;
}

export function StatusDropdown({ task, onChange }: StatusDropdownProps) {
  const colors = statusColors(statusLabel(task.status));

  return (
    <select
      value={task.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className="cursor-pointer rounded-full border-none px-2.5 py-1 text-xs font-bold outline-none"
      style={{ background: colors.bg, color: colors.text }}
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {statusLabel(s)}
        </option>
      ))}
    </select>
  );
}
