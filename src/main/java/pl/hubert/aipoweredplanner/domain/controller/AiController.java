package pl.hubert.aipoweredplanner.domain.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.hubert.aipoweredplanner.domain.dto.AiChatRequest;
import pl.hubert.aipoweredplanner.domain.exception.ResourceNotFoundException;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;
import pl.hubert.aipoweredplanner.domain.service.AiPlannerService;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiPlannerService aiPlannerService;
    private final AppUserRepository userRepository;

    public AiController(AiPlannerService aiPlannerService, AppUserRepository userRepository) {
        this.aiPlannerService = aiPlannerService;
        this.userRepository = userRepository;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = auth.getName();
        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(principal, principal)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"))
                .getId();
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@Valid @RequestBody AiChatRequest request) {
        String userMessage = request.message() == null ? "" : request.message();
        String reply = aiPlannerService.chatWithAssistant(getCurrentUserId(), userMessage);
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    @PostMapping("/suggest-plan")
    public ResponseEntity<Map<String, String>> suggestPlan() {
        String reply = aiPlannerService.chatWithAssistant(
                getCurrentUserId(),
                "Zaproponuj konkretny plan dnia na podstawie moich zadań TODO i DOING."
        );
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
