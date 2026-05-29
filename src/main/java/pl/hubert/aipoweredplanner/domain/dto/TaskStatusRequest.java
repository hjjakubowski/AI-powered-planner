package pl.hubert.aipoweredplanner.domain.dto;

import jakarta.validation.constraints.NotNull;
import pl.hubert.aipoweredplanner.domain.entity.TaskStatus;

public record TaskStatusRequest(
    @NotNull(message = "Task status is required")
    TaskStatus status
) {}
