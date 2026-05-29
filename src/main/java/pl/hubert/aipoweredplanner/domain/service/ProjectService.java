package pl.hubert.aipoweredplanner.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.hubert.aipoweredplanner.domain.dto.ProjectDto;
import pl.hubert.aipoweredplanner.domain.dto.ProjectRequest;
import pl.hubert.aipoweredplanner.domain.entity.AppUser;
import pl.hubert.aipoweredplanner.domain.entity.Project;
import pl.hubert.aipoweredplanner.domain.exception.ResourceNotFoundException;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;
import pl.hubert.aipoweredplanner.domain.repository.ProjectRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final AppUserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, AppUserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public List<ProjectDto> getProjectsForUser(Long userId) {
        return projectRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProjectDto getProjectForUser(Long userId, Long projectId) {
        return mapToDto(getProjectIfOwned(userId, projectId));
    }

    public ProjectDto createProject(Long userId, ProjectRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Project project = new Project();
        project.setName(request.name());
        project.setUser(user);
        Project saved = projectRepository.save(project);
        return mapToDto(saved);
    }

    public ProjectDto updateProject(Long userId, Long projectId, ProjectRequest request) {
        Project project = getProjectIfOwned(userId, projectId);
        project.setName(request.name());
        return mapToDto(projectRepository.save(project));
    }

    public void deleteProject(Long userId, Long projectId) {
        Project project = getProjectIfOwned(userId, projectId);
        projectRepository.delete(project);
    }

    private Project getProjectIfOwned(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!project.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to project");
        }
        return project;
    }

    private ProjectDto mapToDto(Project p) {
        return new ProjectDto(p.getId(), p.getName(), p.getUser().getId());
    }
}
