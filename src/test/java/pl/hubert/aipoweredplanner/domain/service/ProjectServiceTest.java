package pl.hubert.aipoweredplanner.domain.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.hubert.aipoweredplanner.domain.dto.ProjectDto;
import pl.hubert.aipoweredplanner.domain.dto.ProjectRequest;
import pl.hubert.aipoweredplanner.domain.entity.AppUser;
import pl.hubert.aipoweredplanner.domain.entity.Project;
import pl.hubert.aipoweredplanner.domain.entity.Role;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;
import pl.hubert.aipoweredplanner.domain.repository.ProjectRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private AppUserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void createProjectAssignsCurrentUser() {
        AppUser user = user(1L);
        ProjectRequest request = new ProjectRequest("University");

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project saved = invocation.getArgument(0);
            saved.setId(22L);
            return saved;
        });

        ProjectDto result = projectService.createProject(user.getId(), request);

        assertThat(result.id()).isEqualTo(22L);
        assertThat(result.name()).isEqualTo("University");
        assertThat(result.userId()).isEqualTo(user.getId());
    }

    @Test
    void updateProjectChangesNameWhenOwnedByUser() {
        AppUser user = user(1L);
        Project project = new Project();
        project.setId(8L);
        project.setName("Old name");
        project.setUser(user);

        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(project)).thenReturn(project);

        ProjectDto result = projectService.updateProject(user.getId(), project.getId(), new ProjectRequest("New name"));

        assertThat(result.name()).isEqualTo("New name");
    }

    private AppUser user(Long id) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setEmail("user@example.com");
        user.setUsername("student");
        user.setPasswordHash("hash");
        user.setRole(Role.USER);
        return user;
    }
}
