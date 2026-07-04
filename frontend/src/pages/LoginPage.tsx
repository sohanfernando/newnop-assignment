import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { PasswordInput } from '../components/PasswordInput';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-[400px] max-w-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-9 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-(--color-accent) text-base font-extrabold text-white">
            T
          </div>
          <div className="text-[17px] font-bold tracking-tight">Task Tracker</div>
        </div>

        <h1 className="mb-1.5 text-[22px] font-bold tracking-tight">Welcome back</h1>
        <p className="mb-6 text-sm text-(--color-text-muted)">Sign in to manage your team's tasks.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mb-4 w-full rounded-lg border border-(--color-border) px-3 py-2.5 text-sm outline-none focus:border-(--color-accent)"
          />

          <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-semibold">
            Password
          </label>
          <div className="mb-6">
            <PasswordInput
              id="login-password"
              required
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="mb-4 text-sm font-medium text-(--color-danger)">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-(--color-accent) py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-(--color-text-muted)">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-(--color-accent) no-underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
