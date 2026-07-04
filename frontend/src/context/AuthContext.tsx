import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { AuthResponse, Role } from '../types';

interface AuthUser {
  username: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(auth: AuthResponse) {
  localStorage.setItem('token', auth.token);
  localStorage.setItem(
    'user',
    JSON.stringify({ username: auth.username, email: auth.email, role: auth.role }),
  );
}

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      async login(email, password) {
        const auth = await authApi.login({ email, password });
        persistSession(auth);
        setUser({ username: auth.username, email: auth.email, role: auth.role });
      },
      async register(username, email, password) {
        const auth = await authApi.register({ username, email, password });
        persistSession(auth);
        setUser({ username: auth.username, email: auth.email, role: auth.role });
      },
      logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
