import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div className="flex w-[232px] shrink-0 flex-col border-r border-(--color-border) bg-[oklch(0.995_0.003_80)] p-4">
      <div className="flex items-center gap-2.5 px-1 pb-6">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-(--color-accent) text-sm font-extrabold text-white">
          T
        </div>
        <div className="text-[15px] font-bold tracking-tight">Task Tracker</div>
      </div>

      <div className="flex items-center gap-2.5 rounded-lg bg-(--color-accent-soft) px-2.5 py-2.5 text-sm font-semibold text-(--color-accent)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="14" height="2.2" rx="1" fill="currentColor" />
          <rect x="1" y="6.9" width="14" height="2.2" rx="1" fill="currentColor" />
          <rect x="1" y="11.8" width="14" height="2.2" rx="1" fill="currentColor" />
        </svg>
        {isAdmin ? 'All Tasks' : 'My Tasks'}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 border-t border-(--color-border) pt-3.5">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-(--color-avatar-bg) text-[13px] font-bold text-(--color-avatar-text)">
          {initials(user.username)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold">
            {user.username}
          </div>
          <div
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: isAdmin ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          >
            {user.role}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className="flex shrink-0 items-center rounded-md p-1.5 text-(--color-text-muted) hover:bg-(--color-border-soft)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M10.5 11.5 14 8l-3.5-3.5M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
