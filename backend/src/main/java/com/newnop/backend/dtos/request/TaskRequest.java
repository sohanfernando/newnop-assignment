package com.newnop.backend.dtos.request;

import com.newnop.backend.enums.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class TaskRequest {
  @NotBlank(message = "Title is required")
  private String title;

  private String description;

  private TaskStatus status;

  @NotNull(message = "Due date is required")
  @FutureOrPresent(message = "Due date must be today or in the future")
  private LocalDate dueDate;
}
