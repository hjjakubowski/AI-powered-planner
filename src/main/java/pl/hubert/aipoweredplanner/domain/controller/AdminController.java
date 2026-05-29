package pl.hubert.aipoweredplanner.domain.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.hubert.aipoweredplanner.domain.dto.AuthResponse;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AppUserRepository userRepository;

    public AdminController(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public List<AuthResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new AuthResponse(user.getId(), user.getEmail(), user.getUsername(), user.getRole()))
                .collect(Collectors.toList());
    }
}
