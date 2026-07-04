import type { Task } from '../types';
import { displayStatusLabel, formatDate, isOverdue, statusColors } from '../lib/taskDisplay';

interface TaskViewModalProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskViewModal({ task, onClose, onEdit, onDelete }: TaskViewModalProps) {
  const label = displayStatusLabel(task);
  const colors = statusColors(label);
  const overdue = isOverdue(task);

  return (
    <div
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,15,10,0.35)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-panel-in w-[480px] max-w-[calc(100vw-40px)] rounded-2xl bg-(--color-surface) p-7 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <h2 className="m-0 text-lg font-bold tracking-tight">{task.title}</h2>
          <span
            className="inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{ background: colors.bg, color: colors.text }}
          >
            {label}
          </span>
        </div>
        {task.description && (
          <p className="mb-5 whitespace-pre-wrap text-sm leading-relaxed text-(--color-text)/90">
            {task.description}
          </p>
        )}
        <div className="mb-5 grid grid-cols-2 gap-3.5 rounded-[10px] bg-(--color-bg) p-3.5 px-4">
          <div>
            <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-(--color-text-muted)">
              Owner
            </div>
            <div className="text-[13.5px] font-semibold">{task.ownerUsername}</div>
          </div>
          <div>
            <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-(--color-text-muted)">
              Due date
            </div>
            <div
              className="text-[13.5px] font-semibold"
              style={{ color: overdue ? 'var(--color-overdue-text)' : 'var(--color-text)' }}
            >
              {formatDate(task.dueDate)}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-(--color-border) bg-white px-3.5 py-2 text-[13.5px] font-bold text-(--color-danger)"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--color-border) bg-white px-3.5 py-2 text-[13.5px] font-bold"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg bg-(--color-accent) px-4 py-2 text-[13.5px] font-bold text-white"
          >
            Edit task
          </button>
        </div>
      </div>
    </div>
  );
}
