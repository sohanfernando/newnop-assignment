package com.newnop.backend.service;

import com.newnop.backend.dtos.request.TaskRequest;
import com.newnop.backend.dtos.response.TaskResponse;
import com.newnop.backend.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TaskService {
  TaskResponse createTask(TaskRequest request, String email);

  TaskResponse getTaskById(Long id, String email);

  Page<TaskResponse> getAllTasks(TaskStatus status, Long ownerId, Pageable pageable, String email);

  TaskResponse updateTask(Long id, TaskRequest request, String email);

  void deleteTask(Long id, String email);
}
