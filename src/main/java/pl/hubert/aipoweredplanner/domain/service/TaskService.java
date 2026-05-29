package pl.hubert.aipoweredplanner.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.hubert.aipoweredplanner.domain.dto.TaskDto;
import pl.hubert.aipoweredplanner.domain.dto.TaskRequest;
import pl.hubert.aipoweredplanner.domain.entity.AppUser;
import pl.hubert.aipoweredplanner.domain.entity.Project;
import pl.hubert.aipoweredplanner.domain.entity.Task;
import pl.hubert.aipoweredplanner.domain.entity.TaskStatus;
import pl.hubert.aipoweredplanner.domain.exception.ResourceNotFoundException;
import pl.hubert.aipoweredplanner.domain.repository.AppUserRepository;
import pl.hubert.aipoweredplanner.domain.repository.ProjectRepository;
import pl.hubert.aipoweredplanner.domain.repository.TaskRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final AppUserRepository userRepository;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository, AppUserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public List<TaskDto> getTasksForUser(Long userId) {
        return taskRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskForUser(Long userId, Long taskId) {
        return mapToDto(getTaskIfOwned(userId, taskId));
    }

    public TaskDto createTask(Long userId, TaskRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Task task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status() != null ? request.status() : TaskStatus.TODO);
        task.setDueDate(request.dueDate());
        task.setKanbanState(request.kanbanState());
        task.setUser(user);
        task.setCreatedAt(LocalDateTime.now());

        if (request.projectId() != null) {
            Project project = projectRepository.findById(request.projectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
            if (!project.getUser().getId().equals(userId)) {
                throw new SecurityException("Unauthorized access to project");
            }
            task.setProject(project);
        }

        Task saved = taskRepository.save(task);
        return mapToDto(saved);
    }

    public TaskDto updateTask(Long userId, Long taskId, TaskRequest request) {
        Task task = getTaskIfOwned(userId, taskId);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());
        if (request.kanbanState() != null) {
            task.setKanbanState(request.kanbanState());
        }
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        
        if (request.projectId() != null) {
             Project project = projectRepository.findById(request.projectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
            if (!project.getUser().getId().equals(userId)) {
                throw new SecurityException("Unauthorized access to project");
            }
            task.setProject(project);
        } else {
            task.setProject(null);
        }

        return mapToDto(taskRepository.save(task));
    }

    public TaskDto updateTaskStatus(Long userId, Long taskId, TaskStatus status) {
        Task task = getTaskIfOwned(userId, taskId);
        task.setStatus(status);
        return mapToDto(taskRepository.save(task));
    }

    public void deleteTask(Long userId, Long taskId) {
        Task task = getTaskIfOwned(userId, taskId);
        taskRepository.delete(task);
    }

    private Task getTaskIfOwned(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!task.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to task");
        }
        return task;
    }

    private TaskDto mapToDto(Task t) {
        return new TaskDto(
            t.getId(),
            t.getTitle(),
            t.getDescription(),
            t.getStatus(),
            t.getProject() != null ? t.getProject().getId() : null,
            t.getUser().getId(),
            t.getCreatedAt(),
            t.getDueDate(),
            t.getKanbanState()
        );
    }
}
