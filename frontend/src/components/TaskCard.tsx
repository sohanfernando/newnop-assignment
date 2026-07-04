import { StatusDropdown } from './StatusDropdown';
import { formatDate, initials, isOverdue } from '../lib/taskDisplay';
import type { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  flashing: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}

export function TaskCard({ task, flashing, onView, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  return (
    <div
      onClick={onView}
      className={`cursor-pointer rounded-xl border border-(--color-border) bg-(--color-surface) p-3.5 ${
        flashing ? 'animate-row-flash' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{task.title}</div>
          {task.description && (
            <div className="mt-0.5 truncate text-[12.5px] text-(--color-text-muted)">{task.description}</div>
          )}
        </div>
        <StatusDropdown task={task} onChange={onStatusChange} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-(--color-avatar-bg) text-[10.5px] font-bold text-(--color-avatar-text)">
            {initials(task.ownerUsername)}
          </span>
          <span className="truncate text-[13px] font-semibold">{task.ownerUsername}</span>
        </div>
        <span
          className="shrink-0 text-[13px] font-semibold"
          style={{ color: isOverdue(task) ? 'var(--color-overdue-text)' : 'var(--color-text)' }}
        >
          {formatDate(task.dueDate)}
        </span>
      </div>

      <div className="mt-3 flex justify-end gap-1 border-t border-(--color-border-soft) pt-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit"
          className="flex items-center rounded-md p-1.5 text-(--color-text-muted) hover:bg-(--color-border-soft)"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M10.5 2.5l2 2L4.5 12.5l-2.8.8.8-2.8L10.5 2.5Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
          className="flex items-center rounded-md p-1.5 text-(--color-danger) hover:bg-(--color-border-soft)"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M2.5 4.5h10M6 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M5.5 4.5v8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-8"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
