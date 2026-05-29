package pl.hubert.aipoweredplanner.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import pl.hubert.aipoweredplanner.domain.entity.TaskStatus;

public record TaskRequest(
    @NotBlank(message = "Task title is required")
    @Size(max = 160, message = "Task title must be at most 160 characters")
    String title,

    @Size(max = 2000, message = "Task description must be at most 2000 characters")
    String description,

    TaskStatus status,

    Long projectId,

    LocalDateTime dueDate,

    @Size(max = 10000, message = "Kanban state must be at most 10000 characters")
    String kanbanState
) {}
