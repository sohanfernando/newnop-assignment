package com.newnop.backend.dtos.response;

import com.newnop.backend.enums.TaskStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskResponse {
  private Long id;
  private String title;
  private String description;
  private TaskStatus status;
  private LocalDate dueDate;
  private String ownerUsername;
  private Long ownerId;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
