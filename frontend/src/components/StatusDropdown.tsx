import { ChevronDown } from 'lucide-react';
import { TASK_STATUSES, type Task, type TaskStatus } from '../types';
import { statusColors, statusLabel } from '../lib/taskDisplay';

interface StatusDropdownProps {
  task: Pick<Task, 'status'>;
  onChange: (status: TaskStatus) => void;
}

export function StatusDropdown({ task, onChange }: StatusDropdownProps) {
  const colors = statusColors(statusLabel(task.status));

  return (
    <div className="relative inline-flex items-center">
      <select
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        className="cursor-pointer appearance-none rounded-full border-none py-1 pl-2.5 pr-6 text-xs font-bold outline-none"
        style={{ background: colors.bg, color: colors.text }}
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        strokeWidth={2.5}
        className="pointer-events-none absolute right-1.5"
        style={{ color: colors.text }}
      />
    </div>
  );
}
