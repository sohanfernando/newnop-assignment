package com.newnop.backend.controller;

import com.newnop.backend.dtos.request.TaskRequest;
import com.newnop.backend.dtos.response.ApiResponse;
import com.newnop.backend.dtos.response.TaskResponse;
import com.newnop.backend.enums.TaskStatus;
import com.newnop.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

  private final TaskService taskService;

  @PostMapping
  public ResponseEntity<ApiResponse<TaskResponse>> createTask(
      @Valid @RequestBody TaskRequest request, Authentication auth) {
    TaskResponse response = taskService.createTask(request, auth.getName());
    return ResponseEntity.ok(ApiResponse.success("Task created", response));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<TaskResponse>> getTask(
      @PathVariable Long id, Authentication auth) {
    TaskResponse response = taskService.getTaskById(id, auth.getName());
    return ResponseEntity.ok(ApiResponse.success("Task retrieved", response));
  }

  @GetMapping
  public ResponseEntity<ApiResponse<Page<TaskResponse>>> getAllTasks(
      @RequestParam(required = false) TaskStatus status,
      @RequestParam(required = false) Long ownerId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "createdAt") String sortBy,
      @RequestParam(defaultValue = "desc") String sortDir,
      Authentication auth) {

    Sort sort =
        sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();
    Pageable pageable = PageRequest.of(page, size, sort);

    Page<TaskResponse> response =
        taskService.getAllTasks(status, ownerId, pageable, auth.getName());
    return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", response));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
      @PathVariable Long id, @Valid @RequestBody TaskRequest request, Authentication auth) {
    TaskResponse response = taskService.updateTask(id, request, auth.getName());
    return ResponseEntity.ok(ApiResponse.success("Task updated", response));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id, Authentication auth) {
    taskService.deleteTask(id, auth.getName());
    return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
  }
}
