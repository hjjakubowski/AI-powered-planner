package pl.hubert.aipoweredplanner.domain.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pl.hubert.aipoweredplanner.domain.dto.ProjectDto;
import pl.hubert.aipoweredplanner.domain.dto.ProjectRequest;
import pl.hubert.aipoweredplanner.domain.exception.ResourceNotFoundException;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;
import pl.hubert.aipoweredplanner.domain.service.ProjectService;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final AppUserRepository userRepository;

    public ProjectController(ProjectService projectService, AppUserRepository userRepository) {
        this.projectService = projectService;
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
    public List<ProjectDto> getProjects() {
        return projectService.getProjectsForUser(getCurrentUserId());
    }

    @GetMapping("/{id}")
    public ProjectDto getProject(@PathVariable Long id) {
        return projectService.getProjectForUser(getCurrentUserId(), id);
    }

    @PostMapping
    public ProjectDto createProject(@Valid @RequestBody ProjectRequest request) {
        return projectService.createProject(getCurrentUserId(), request);
    }

    @PutMapping("/{id}")
    public ProjectDto updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return projectService.updateProject(getCurrentUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(getCurrentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
