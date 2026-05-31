package pl.hubert.aipoweredplanner.domain.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.hubert.aipoweredplanner.domain.dto.TaskDto;
import pl.hubert.aipoweredplanner.domain.dto.TaskRequest;
import pl.hubert.aipoweredplanner.domain.entity.AppUser;
import pl.hubert.aipoweredplanner.domain.entity.Project;
import pl.hubert.aipoweredplanner.domain.entity.Role;
import pl.hubert.aipoweredplanner.domain.entity.Task;
import pl.hubert.aipoweredplanner.domain.entity.TaskStatus;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;
import pl.hubert.aipoweredplanner.domain.repository.ProjectRepository;
import pl.hubert.aipoweredplanner.domain.repository.TaskRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private AppUserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void createTaskAssignsCurrentUserProjectAndDefaultStatus() {
        AppUser user = user(1L);
        Project project = project(10L, user);
        TaskRequest request = new TaskRequest(
                "Read chapter",
                "Database indexes",
                null,
                project.getId(),
                LocalDateTime.now().plusDays(1),
                null
        );

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        TaskDto result = taskService.createTask(user.getId(), request);

        assertThat(result.id()).isEqualTo(99L);
        assertThat(result.title()).isEqualTo("Read chapter");
        assertThat(result.status()).isEqualTo(TaskStatus.TODO);
        assertThat(result.projectId()).isEqualTo(project.getId());
        assertThat(result.userId()).isEqualTo(user.getId());
    }

    @Test
    void updateTaskStatusChangesOnlyStatus() {
        AppUser user = user(1L);
        Task task = task(7L, user, TaskStatus.TODO);

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);

        TaskDto result = taskService.updateTaskStatus(user.getId(), task.getId(), TaskStatus.DONE);

        assertThat(result.status()).isEqualTo(TaskStatus.DONE);
        assertThat(result.title()).isEqualTo("Existing task");
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

    private Project project(Long id, AppUser user) {
        Project project = new Project();
        project.setId(id);
        project.setName("Studies");
        project.setUser(user);
        return project;
    }

    private Task task(Long id, AppUser user, TaskStatus status) {
        Task task = new Task();
        task.setId(id);
        task.setTitle("Existing task");
        task.setDescription("Description");
        task.setStatus(status);
        task.setUser(user);
        task.setCreatedAt(LocalDateTime.now());
        return task;
    }
}
