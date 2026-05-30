package pl.hubert.aipoweredplanner.domain.dto;

import jakarta.validation.constraints.Size;

public record AiChatRequest(
    @Size(max = 1000, message = "Message must be at most 1000 characters")
    String message
) {}
