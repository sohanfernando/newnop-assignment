import { apiClient } from './client';
import type { ApiResponse, Page, Task, TaskFilters, TaskRequest } from '../types';

export async function fetchTasks(filters: TaskFilters): Promise<Page<Task>> {
  const params: Record<string, string | number> = {
    page: filters.page,
    size: filters.size,
  };
  if (filters.status) params.status = filters.status;
  if (filters.ownerId) params.ownerId = filters.ownerId;

  const res = await apiClient.get<ApiResponse<Page<Task>>>('/api/tasks', { params });
  return res.data.data;
}

export async function fetchTaskById(id: number): Promise<Task> {
  const res = await apiClient.get<ApiResponse<Task>>(`/api/tasks/${id}`);
  return res.data.data;
}

export async function createTask(payload: TaskRequest): Promise<Task> {
  const res = await apiClient.post<ApiResponse<Task>>('/api/tasks', payload);
  return res.data.data;
}

export async function updateTask(id: number, payload: TaskRequest): Promise<Task> {
  const res = await apiClient.put<ApiResponse<Task>>(`/api/tasks/${id}`, payload);
  return res.data.data;
}

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`);
}
