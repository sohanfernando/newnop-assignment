import { useState, type FormEvent } from 'react';
import { TASK_STATUSES, type Task, type TaskStatus } from '../types';
import { statusLabel } from '../lib/taskDisplay';

interface TaskFormModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (payload: { title: string; description: string; status: TaskStatus; dueDate: string }) => Promise<void>;
}

export function TaskFormModal({ task, onClose, onSubmit }: TaskFormModalProps) {
  const isEdit = task !== null;
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'TODO');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), status, dueDate });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,15,10,0.35)]"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="animate-panel-in w-[480px] max-w-[calc(100vw-40px)] rounded-2xl bg-(--color-surface) p-7 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      >
        <h2 className="m-0 mb-4.5 text-lg font-bold tracking-tight">{isEdit ? 'Edit task' : 'New task'}</h2>

        <label className="mb-1.5 block text-[13px] font-semibold">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Set up CI pipeline"
          className="mb-3.5 w-full rounded-lg border border-(--color-border) px-3 py-2.5 text-sm outline-none focus:border-(--color-accent)"
        />

        <label className="mb-1.5 block text-[13px] font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs to happen?"
          rows={3}
          className="mb-3.5 w-full resize-y rounded-lg border border-(--color-border) px-3 py-2.5 text-sm outline-none focus:border-(--color-accent)"
        />

        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-lg border border-(--color-border) bg-white px-2.5 py-2 text-[13.5px] outline-none"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-(--color-border) px-2.5 py-2 text-[13.5px] outline-none"
            />
          </div>
        </div>

        {error && <p className="mb-1 mt-1.5 text-[12.5px] font-semibold text-(--color-danger)">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--color-border) bg-white px-4 py-2 text-[13.5px] font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-(--color-accent) px-4.5 py-2 text-[13.5px] font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save task'}
          </button>
        </div>
      </form>
    </div>
  );
}
