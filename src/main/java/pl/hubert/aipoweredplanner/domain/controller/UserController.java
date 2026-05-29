package pl.hubert.aipoweredplanner.domain.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.hubert.aipoweredplanner.domain.dto.AuthResponse;
import pl.hubert.aipoweredplanner.domain.dto.UserUpdateRequest;
import pl.hubert.aipoweredplanner.domain.entity.AppUser;
import pl.hubert.aipoweredplanner.domain.exception.DuplicateResourceException;
import pl.hubert.aipoweredplanner.domain.exception.ResourceNotFoundException;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;

import java.util.Locale;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final AppUserRepository userRepository;

    public UserController(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private AppUser getCurrentUserEntity() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = auth.getName();
        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(principal, principal)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        AppUser user = getCurrentUserEntity();
        return ResponseEntity.ok(toAuthResponse(user));
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse> updateCurrentUser(@Valid @RequestBody UserUpdateRequest request) {
        AppUser user = getCurrentUserEntity();
        String email = normalizeEmail(request.email());

        boolean emailAlreadyTaken = userRepository.findByEmailIgnoreCase(email)
                .filter(existingUser -> !existingUser.getId().equals(user.getId()))
                .isPresent();

        if (emailAlreadyTaken) {
            throw new DuplicateResourceException("Email already exists");
        }

        user.setEmail(email);
        AppUser savedUser = userRepository.save(user);

        return ResponseEntity.ok(toAuthResponse(savedUser));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUser(HttpServletRequest request) {
        AppUser user = getCurrentUserEntity();
        userRepository.delete(user);

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private AuthResponse toAuthResponse(AppUser user) {
        return new AuthResponse(user.getId(), user.getEmail(), user.getUsername(), user.getRole());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
