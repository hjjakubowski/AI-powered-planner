package pl.hubert.aipoweredplanner.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.hubert.aipoweredplanner.domain.entity.Task;
import pl.hubert.aipoweredplanner.domain.entity.TaskStatus;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);
    List<Task> findByProjectId(Long projectId);
    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);
}
