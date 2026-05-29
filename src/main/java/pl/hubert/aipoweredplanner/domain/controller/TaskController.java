package pl.hubert.aipoweredplanner.domain.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pl.hubert.aipoweredplanner.domain.dto.TaskDto;
import pl.hubert.aipoweredplanner.domain.dto.TaskRequest;
import pl.hubert.aipoweredplanner.domain.dto.TaskStatusRequest;
import pl.hubert.aipoweredplanner.domain.exception.ResourceNotFoundException;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;
import pl.hubert.aipoweredplanner.domain.service.TaskService;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final AppUserRepository userRepository;

    public TaskController(TaskService taskService, AppUserRepository userRepository) {
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = auth.getName();
        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(principal, principal)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"))
                .getId();
    }

    @GetMapping
    public List<TaskDto> getTasks() {
        return taskService.getTasksForUser(getCurrentUserId());
    }

    @GetMapping("/{id}")
    public TaskDto getTask(@PathVariable Long id) {
        return taskService.getTaskForUser(getCurrentUserId(), id);
    }

    @PostMapping
    public TaskDto createTask(@Valid @RequestBody TaskRequest request) {
        return taskService.createTask(getCurrentUserId(), request);
    }

    @PutMapping("/{id}")
    public TaskDto updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return taskService.updateTask(getCurrentUserId(), id, request);
    }

    @PatchMapping("/{id}/status")
    public TaskDto updateTaskStatus(@PathVariable Long id, @Valid @RequestBody TaskStatusRequest request) {
        return taskService.updateTaskStatus(getCurrentUserId(), id, request.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(getCurrentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
