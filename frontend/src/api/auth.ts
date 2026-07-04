import { apiClient } from './client';
import type { ApiResponse, AuthResponse } from '../types';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', payload);
  return res.data.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', payload);
  return res.data.data;
}
