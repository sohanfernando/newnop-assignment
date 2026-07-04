package com.newnop.backend.service.impl;

import com.newnop.backend.dtos.request.TaskRequest;
import com.newnop.backend.dtos.response.TaskResponse;
import com.newnop.backend.entity.Task;
import com.newnop.backend.entity.User;
import com.newnop.backend.enums.Role;
import com.newnop.backend.enums.TaskStatus;
import com.newnop.backend.repository.TaskRepository;
import com.newnop.backend.repository.UserRepository;
import com.newnop.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .ownerUsername(task.getOwner().getUsername())
                .ownerId(task.getOwner().getId())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    @Override
    public TaskResponse createTask(TaskRequest request, String email) {
        User user = getUser(email);
        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .dueDate(request.getDueDate())
                .owner(user)
                .build();

        Task saved = taskRepository.save(task);
        TaskResponse response = mapToResponse(saved);
        messagingTemplate.convertAndSend("/topic/tasks", response);
        return response;
    }

    @Override
    public TaskResponse getTaskById(Long id, String email) {
        User user = getUser(email);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (user.getRole() != Role.ADMIN && !task.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to view this task");
        }
        return mapToResponse(task);
    }

    @Override
    public Page<TaskResponse> getAllTasks(TaskStatus status, Long ownerId,
                                          Pageable pageable, String email) {
        User user = getUser(email);

        if (user.getRole() == Role.ADMIN) {
            return taskRepository.findWithFilters(status, ownerId, pageable)
                    .map(this::mapToResponse);
        } else {
            return taskRepository.findWithFilters(status, user.getId(), pageable)
                    .map(this::mapToResponse);
        }
    }

    @Override
    public TaskResponse updateTask(Long id, TaskRequest request, String email) {
        User user = getUser(email);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (user.getRole() != Role.ADMIN && !task.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to update this task");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());

        Task updated = taskRepository.save(task);
        TaskResponse response = mapToResponse(updated);
        messagingTemplate.convertAndSend("/topic/tasks", response);
        return response;
    }

    @Override
    public void deleteTask(Long id, String email) {
        User user = getUser(email);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (user.getRole() != Role.ADMIN && !task.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this task");
        }

        taskRepository.delete(task);
        messagingTemplate.convertAndSend("/topic/tasks/deleted", id);
    }
}