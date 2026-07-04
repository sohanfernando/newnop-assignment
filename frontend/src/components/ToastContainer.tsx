import { useToast } from '../context/ToastContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex w-80 max-w-[calc(100vw-40px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-toast-in flex items-start gap-2.5 rounded-[10px] border border-(--color-border) bg-(--color-surface) p-3 pl-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          style={{ borderLeft: '3px solid var(--color-accent)' }}
        >
          <div className="flex-1 text-[13px] font-semibold leading-tight">{toast.message}</div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 rounded p-0.5 text-(--color-text-muted)"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
