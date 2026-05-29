package pl.hubert.aipoweredplanner.domain.dto;

import pl.hubert.aipoweredplanner.domain.entity.Role;

public record AuthResponse(
    Long id,
    String email,
    String username,
    Role role
) {}
