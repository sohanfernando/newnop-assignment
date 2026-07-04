interface DeleteConfirmModalProps {
  taskTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ taskTitle, onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div
      onClick={onCancel}
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(20,15,10,0.35)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-panel-in w-[380px] max-w-[calc(100vw-40px)] rounded-2xl bg-(--color-surface) p-6.5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      >
        <h2 className="m-0 mb-2 text-[17px] font-bold">Delete task?</h2>
        <p className="mb-5.5 text-sm leading-relaxed text-(--color-text)/80">
          "{taskTitle}" will be permanently removed. This can't be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-(--color-border) bg-white px-4 py-2 text-[13.5px] font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-(--color-danger) px-4.5 py-2 text-[13.5px] font-bold text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
