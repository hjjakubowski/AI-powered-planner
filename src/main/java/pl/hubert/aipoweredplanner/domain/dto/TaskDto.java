package pl.hubert.aipoweredplanner.domain.dto;

import pl.hubert.aipoweredplanner.domain.entity.TaskStatus;
import java.time.LocalDateTime;

public record TaskDto(
    Long id,
    String title,
    String description,
    TaskStatus status,
    Long projectId,
    Long userId,
    LocalDateTime createdAt,
    LocalDateTime dueDate,
    String kanbanState
) {}