export type Role = 'USER' | 'ADMIN';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: Role;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string;
  ownerUsername: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface TaskFilters {
  status?: TaskStatus | '';
  ownerId?: number | '';
  page: number;
  size: number;
}
