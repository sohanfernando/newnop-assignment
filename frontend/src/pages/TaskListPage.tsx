import { useCallback, useEffect, useState } from 'react';
import { deleteTask, createTask, fetchTasks, updateTask } from '../api/tasks';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTaskSocket } from '../hooks/useTaskSocket';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { TaskViewModal } from '../components/TaskViewModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { formatDate, initials, isOverdue } from '../lib/taskDisplay';
import { TASK_STATUSES, type Page, type Task, type TaskStatus } from '../types';

const PAGE_SIZE = 8;

type Modal = { type: 'view' | 'edit'; task: Task } | { type: 'create' } | null;

interface OwnerOption {
  id: number;
  name: string;
}

export function TaskListPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [tasks, setTasks] = useState<Page<Task> | null>(null);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [ownerId, setOwnerId] = useState<number | ''>('');
  const [ownerOptions, setOwnerOptions] = useState<OwnerOption[]>([]);
  const [counts, setCounts] = useState({ TODO: 0, IN_PROGRESS: 0, DONE: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTasks({
        page,
        size: PAGE_SIZE,
        status: status || undefined,
        ownerId: ownerId || undefined,
      });
      setTasks(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, status, ownerId]);

  const loadStats = useCallback(async () => {
    try {
      const scopeOwnerId = ownerId || undefined;
      const [todo, inProgress, done] = await Promise.all([
        fetchTasks({ page: 0, size: 1, status: 'TODO', ownerId: scopeOwnerId }),
        fetchTasks({ page: 0, size: 1, status: 'IN_PROGRESS', ownerId: scopeOwnerId }),
        fetchTasks({ page: 0, size: 1, status: 'DONE', ownerId: scopeOwnerId }),
      ]);
      setCounts({ TODO: todo.totalElements, IN_PROGRESS: inProgress.totalElements, DONE: done.totalElements });

      if (isAdmin) {
        const all = await fetchTasks({ page: 0, size: 1000 });
        const distinct = new Map<number, string>();
        all.content.forEach((t) => distinct.set(t.ownerId, t.ownerUsername));
        setOwnerOptions(Array.from(distinct, ([id, name]) => ({ id, name })));
      }
    } catch {
      // stats are a soft-fail enhancement; the main task list error already surfaces
    }
  }, [ownerId, isAdmin]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useTaskSocket({
    onTaskUpserted: (task) => {
      loadTasks();
      loadStats();
      setFlashId(task.id);
      setTimeout(() => setFlashId((cur) => (cur === task.id ? null : cur)), 2200);
    },
    onTaskDeleted: (id) => {
      if (modal && modal.type !== 'create' && modal.task.id === id) setModal(null);
      loadTasks();
      loadStats();
    },
  });

  async function handleCreate(payload: { title: string; description: string; status: TaskStatus; dueDate: string }) {
    const created = await createTask(payload);
    setModal(null);
    pushToast(`Task "${created.title}" created.`);
    loadTasks();
    loadStats();
  }

  async function handleEdit(id: number, payload: { title: string; description: string; status: TaskStatus; dueDate: string }) {
    const updated = await updateTask(id, payload);
    setModal(null);
    pushToast(`Task "${updated.title}" updated.`);
    loadTasks();
    loadStats();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const title = deleteTarget.title;
    try {
      await deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      pushToast(`Task "${title}" deleted.`);
      loadTasks();
      loadStats();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    }
  }

  const total = tasks?.totalElements ?? 0;
  const pageStart = page * PAGE_SIZE;
  const rangeLabel =
    total === 0 ? 'No tasks found' : `Showing ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, total)} of ${total} tasks`;

  const statusPill = (active: boolean) =>
    `whitespace-nowrap rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
      active
        ? 'border-transparent bg-(--color-accent) text-white'
        : 'border-(--color-border) bg-white text-(--color-text)'
    }`;

  return (
    <div className="flex h-full w-full">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between border-b border-(--color-border) px-7 py-5">
          <div>
            <h1 className="m-0 text-[21px] font-bold tracking-tight">{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
            <p className="mt-0.5 text-[13px] text-(--color-text-muted)">{rangeLabel}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-(--color-text-muted)">
              <span className="h-2 w-2 rounded-full bg-(--color-accent) animate-pulse-dot" />
              Live
            </div>
            <button
              type="button"
              onClick={() => setModal({ type: 'create' })}
              className="flex items-center gap-1.5 rounded-lg bg-(--color-accent) px-4 py-2.5 text-[13.5px] font-bold text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              New Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-7 pt-5">
          <StatCard label="To Do" value={counts.TODO} color="var(--color-avatar-text)" />
          <StatCard label="In Progress" value={counts.IN_PROGRESS} color="var(--color-progress-text)" />
          <StatCard label="Done" value={counts.DONE} color="var(--color-done-text)" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-7 pb-3.5 pt-4.5">
          <button
            type="button"
            onClick={() => {
              setPage(0);
              setStatus('');
            }}
            className={statusPill(status === '')}
          >
            All
          </button>
          {TASK_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setPage(0);
                setStatus(s);
              }}
              className={statusPill(status === s)}
            >
              {s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
            </button>
          ))}

          {isAdmin && (
            <select
              value={ownerId}
              onChange={(e) => {
                setPage(0);
                setOwnerId(e.target.value ? Number(e.target.value) : '');
              }}
              className="rounded-lg border border-(--color-border) bg-white px-2.5 py-1.5 text-[13.5px] outline-none"
            >
              <option value="">All owners</option>
              {ownerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="px-7 pb-2 text-sm text-(--color-danger)">{error}</p>}

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-7">
          <div className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-(--color-border) bg-(--color-bg)">
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-(--color-text-muted)">
                    Task
                  </th>
                  <th className="w-[130px] px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-(--color-text-muted)">
                    Status
                  </th>
                  <th className="w-[120px] px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-(--color-text-muted)">
                    Due
                  </th>
                  <th className="w-[160px] px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-(--color-text-muted)">
                    Owner
                  </th>
                  <th className="w-[100px] px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {tasks?.content.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setModal({ type: 'view', task })}
                    className={`cursor-pointer border-b border-(--color-border-soft) last:border-b-0 hover:bg-(--color-bg) ${
                      flashId === task.id ? 'animate-row-flash' : ''
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm font-bold">{task.title}</div>
                      {task.description && (
                        <div className="mt-0.5 max-w-[380px] overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-(--color-text-muted)">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge task={task} />
                    </td>
                    <td
                      className="px-4 py-3 align-top text-[13px] font-semibold"
                      style={{ color: isOverdue(task) ? 'var(--color-overdue-text)' : 'var(--color-text)' }}
                    >
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-(--color-avatar-bg) text-[10.5px] font-bold text-(--color-avatar-text)">
                          {initials(task.ownerUsername)}
                        </span>
                        <span className="text-[13px] font-semibold">{task.ownerUsername}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ type: 'edit', task });
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
                            setDeleteTarget(task);
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
                    </td>
                  </tr>
                ))}
                {!loading && tasks?.content.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="mb-1 text-[15px] font-bold">No tasks match your filters</div>
                      <div className="text-[13px] text-(--color-text-muted)">
                        Try adjusting your filters, or create a new task.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {tasks && (
          <Pagination page={tasks.number} totalPages={tasks.totalPages} rangeLabel={rangeLabel} onChange={setPage} />
        )}
      </div>

      {modal?.type === 'view' && (
        <TaskViewModal
          task={modal.task}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', task: modal.task })}
          onDelete={() => {
            setDeleteTarget(modal.task);
            setModal(null);
          }}
        />
      )}

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <TaskFormModal
          task={modal.type === 'edit' ? modal.task : null}
          onClose={() => setModal(null)}
          onSubmit={(payload) => (modal.type === 'edit' ? handleEdit(modal.task.id, payload) : handleCreate(payload))}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          taskTitle={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
