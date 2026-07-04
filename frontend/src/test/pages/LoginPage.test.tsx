import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { AuthProvider } from '../../context/AuthContext';
import * as authApi from '../../api/auth';

vi.mock('../../api/auth');

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('renders email and password fields and a submit button', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls the login API with the entered credentials on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'fake-token',
      username: 'sohan7',
      email: 'sohanfernando7@gmail.com',
      role: 'USER',
    });

    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'sohanfernando7@gmail.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'sohanfernando7@gmail.com',
        password: 'password123',
      });
    });
  });

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/something went wrong|invalid credentials/i)).toBeInTheDocument();
  });
});
