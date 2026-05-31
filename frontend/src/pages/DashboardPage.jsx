import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ChatWidget from '../components/ChatWidget';
import './DashboardPage.css';

const statuses = [
  { id: 'TODO', title: 'Do zrobienia', short: 'Plan', color: 'column-todo', accent: 'bg-slate-700' },
  { id: 'DOING', title: 'W trakcie', short: 'Focus', color: 'column-doing', accent: 'bg-amber-500' },
  { id: 'DONE', title: 'Gotowe', short: 'Done', color: 'column-done', accent: 'bg-emerald-500' },
];

const emptyTaskForm = {
  id: null,
  title: '',
  description: '',
  status: 'TODO',
  projectId: '',
  dueDate: '',
};

const viewOptions = [
  { id: 'board', label: 'Tablica' },
  { id: 'list', label: 'Lista' },
  { id: 'stats', label: 'Statystyki' },
];

const toInputDateTime = (value) => {
  if (!value) return '';
  return value.slice(0, 16);
};

const formatDate = (value) => {
  if (!value) return 'Bez terminu';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Bez terminu';
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getDueState = (task) => {
  if (!task.dueDate || task.status === 'DONE') return null;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  if (due < now) return 'overdue';
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return due <= nextDay ? 'soon' : null;
};

const getProjectName = (projectsById, projectId) => {
  if (!projectId) return 'Bez projektu';
  return projectsById.get(Number(projectId))?.name ?? 'Nieznany projekt';
};

const DashboardPage = () => {
  const { user, logout } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [projectName, setProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [Number(project.id), project])),
    [projects],
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tasksResponse, projectsResponse] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
      ]);
      setTasks(tasksResponse.data ?? []);
      setProjects(projectsResponse.data ?? []);
    } catch (err) {
      console.error('Błąd pobierania danych', err);
      setError('Nie udało się pobrać danych. Sprawdź, czy backend działa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const taskStats = useMemo(() => {
    const totals = Object.fromEntries(statuses.map((status) => [status.id, 0]));
    tasks.forEach((task) => {
      totals[task.status] = (totals[task.status] ?? 0) + 1;
    });
    const total = tasks.length;
    const completed = totals.DONE ?? 0;
    const active = (totals.TODO ?? 0) + (totals.DOING ?? 0);
    const overdue = tasks.filter((task) => getDueState(task) === 'overdue').length;
    const completion = total ? Math.round((completed / total) * 100) : 0;

    return { totals, total, completed, active, overdue, completion };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery = !query
        || task.title?.toLowerCase().includes(query)
        || task.description?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesProject = projectFilter === 'ALL'
        || (projectFilter === 'NONE' && !task.projectId)
        || Number(task.projectId) === Number(projectFilter);

      return matchesQuery && matchesStatus && matchesProject;
    });
  }, [projectFilter, search, statusFilter, tasks]);

  const tasksByStatus = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.id] = filteredTasks.filter((task) => task.status === status.id);
      return acc;
    }, {});
  }, [filteredTasks]);

  const projectStats = useMemo(() => {
    const grouped = new Map();
    projects.forEach((project) => {
      grouped.set(Number(project.id), { id: project.id, name: project.name, total: 0, done: 0 });
    });
    grouped.set('none', { id: 'none', name: 'Bez projektu', total: 0, done: 0 });

    tasks.forEach((task) => {
      const key = task.projectId ? Number(task.projectId) : 'none';
      const row = grouped.get(key) ?? grouped.get('none');
      row.total += 1;
      if (task.status === 'DONE') row.done += 1;
    });

    return Array.from(grouped.values())
      .filter((project) => project.total > 0)
      .map((project) => ({
        ...project,
        percent: project.total ? Math.round((project.done / project.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [projects, tasks]);

  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.status !== 'DONE' && task.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

  const openTaskModal = (task = null, status = 'TODO') => {
    setError('');
    setTaskForm(task
      ? {
          id: task.id,
          title: task.title ?? '',
          description: task.description ?? '',
          status: task.status ?? 'TODO',
          projectId: task.projectId ?? '',
          dueDate: toInputDateTime(task.dueDate),
        }
      : { ...emptyTaskForm, status, projectId: projectFilter !== 'ALL' && projectFilter !== 'NONE' ? projectFilter : '' });
    setIsTaskModalOpen(true);
  };

  const buildTaskPayload = () => ({
    title: taskForm.title.trim(),
    description: taskForm.description.trim(),
    status: taskForm.status,
    projectId: taskForm.projectId ? Number(taskForm.projectId) : null,
    dueDate: taskForm.dueDate || null,
  });

  const handleSaveTask = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) return;

    setSaving(true);
    setError('');
    try {
      const payload = buildTaskPayload();
      const response = taskForm.id
        ? await api.put(`/tasks/${taskForm.id}`, payload)
        : await api.post('/tasks', payload);

      setTasks((currentTasks) => {
        if (!taskForm.id) return [response.data, ...currentTasks];
        return currentTasks.map((task) => (task.id === taskForm.id ? response.data : task));
      });
      setIsTaskModalOpen(false);
      setTaskForm(emptyTaskForm);
    } catch (err) {
      console.error('Błąd zapisywania zadania', err);
      setError('Nie udało się zapisać zadania.');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId, nextStatus) => {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask || currentTask.status === nextStatus) return;

    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === taskId ? { ...task, status: nextStatus } : task
    )));

    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskId ? response.data : task
      )));
    } catch (err) {
      console.error('Błąd zmiany statusu', err);
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskId ? currentTask : task
      )));
      setError('Nie udało się zmienić statusu zadania.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    setError('');
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error('Błąd usuwania zadania', err);
      setError('Nie udało się usunąć zadania.');
    }
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!projectName.trim()) return;

    setError('');
    try {
      const response = await api.post('/projects', { name: projectName.trim() });
      setProjects((currentProjects) => [...currentProjects, response.data]);
      setProjectName('');
    } catch (err) {
      console.error('Błąd tworzenia projektu', err);
      setError('Nie udało się utworzyć projektu.');
    }
  };

  const handleUpdateProject = async (event) => {
    event.preventDefault();
    if (!editingProjectName.trim() || !editingProjectId) return;

    setError('');
    try {
      const response = await api.put(`/projects/${editingProjectId}`, { name: editingProjectName.trim() });
      setProjects((currentProjects) => currentProjects.map((project) => (
        project.id === editingProjectId ? response.data : project
      )));
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch (err) {
      console.error('Błąd edycji projektu', err);
      setError('Nie udało się zmienić nazwy projektu.');
    }
  };

  const handleDeleteProject = async (project) => {
    const assignedCount = tasks.filter((task) => Number(task.projectId) === Number(project.id)).length;
    const message = assignedCount
      ? `Projekt "${project.name}" ma ${assignedCount} zadań. Usunięcie projektu usunie również te zadania. Kontynuować?`
      : `Usunąć projekt "${project.name}"?`;

    if (!window.confirm(message)) return;

    setError('');
    try {
      await api.delete(`/projects/${project.id}`);
      setProjects((currentProjects) => currentProjects.filter((item) => item.id !== project.id));
      setTasks((currentTasks) => currentTasks.filter((task) => Number(task.projectId) !== Number(project.id)));
      if (projectFilter === String(project.id)) setProjectFilter('ALL');
    } catch (err) {
      console.error('Błąd usuwania projektu', err);
      setError('Nie udało się usunąć projektu.');
    }
  };

  const onDropTask = (event, nextStatus) => {
    event.preventDefault();
    if (!draggedTaskId) return;
    updateTaskStatus(draggedTaskId, nextStatus);
    setDraggedTaskId(null);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setProjectFilter('ALL');
  };

  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'U';

  if (loading) {
    return (
      <main className="workspace-shell loading-shell">
        <div className="loading-card">Ładowanie planera...</div>
      </main>
    );
  }

  return (
    <main className="workspace-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Powered Planner</p>
          <h1>Twój plan pracy</h1>
        </div>

        <div className="profile-menu">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((value) => !value)}
            className="avatar-button"
            aria-label="Menu profilu"
          >
            {userInitials}
          </button>

          {isProfileMenuOpen && (
            <div className="profile-popover">
              <div className="profile-summary">
                <strong>{user?.username}</strong>
                <span>{user?.email}</span>
              </div>
              <Link to="/account" className="profile-nav-button">
                Zarządzaj kontem
              </Link>
              <button type="button" onClick={logout} className="danger-menu-button">
                Wyloguj się
              </button>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <section className="summary-grid" aria-label="Podsumowanie zadań">
        <article className="metric-card">
          <span>Wszystkie zadania</span>
          <strong>{taskStats.total}</strong>
          <small>{taskStats.active} aktywnych</small>
        </article>
        <article className="metric-card">
          <span>Ukończone</span>
          <strong>{taskStats.completed}</strong>
          <small>{taskStats.completion}% realizacji</small>
        </article>
        <article className="metric-card">
          <span>Po terminie</span>
          <strong>{taskStats.overdue}</strong>
          <small>{taskStats.overdue ? 'Wymagają reakcji' : 'Brak zaległości'}</small>
        </article>
        <article className="metric-card action-card">
          <button type="button" onClick={() => openTaskModal()} className="primary-button">
            Nowe zadanie
          </button>
          <button type="button" onClick={loadWorkspace} className="secondary-button">
            Odśwież
          </button>
        </article>
      </section>

      <section className="content-grid">
        <aside className="side-panel" aria-label="Projekty i filtry">
          <div className="panel-section">
            <div className="section-heading">
              <h2>Projekty</h2>
              <span>{projects.length}</span>
            </div>

            <form onSubmit={handleCreateProject} className="compact-form">
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Nazwa projektu"
                aria-label="Nazwa nowego projektu"
              />
              <button type="submit">Dodaj</button>
            </form>

            <div className="project-list">
              {projects.map((project) => {
                const assignedCount = tasks.filter((task) => Number(task.projectId) === Number(project.id)).length;
                const isEditing = editingProjectId === project.id;

                return (
                  <div key={project.id} className="project-row">
                    {isEditing ? (
                      <form onSubmit={handleUpdateProject} className="project-edit-form">
                        <input
                          type="text"
                          value={editingProjectName}
                          onChange={(event) => setEditingProjectName(event.target.value)}
                          aria-label="Edytowana nazwa projektu"
                        />
                        <button type="submit">OK</button>
                        <button type="button" onClick={() => setEditingProjectId(null)}>Anuluj</button>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="project-select"
                          onClick={() => setProjectFilter(String(project.id))}
                        >
                          <span>{project.name}</span>
                          <small>{assignedCount} zadań</small>
                        </button>
                        <div className="row-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProjectId(project.id);
                              setEditingProjectName(project.name);
                            }}
                            aria-label={`Edytuj projekt ${project.name}`}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project)}
                            className="danger-link"
                            aria-label={`Usuń projekt ${project.name}`}
                          >
                            Usuń
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {projects.length === 0 && <p className="muted-text">Dodaj pierwszy projekt, żeby grupować zadania.</p>}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-heading">
              <h2>Filtry</h2>
              <button type="button" onClick={resetFilters} className="text-button">Wyczyść</button>
            </div>
            <label>
              Szukaj
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tytuł lub opis"
              />
            </label>
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Wszystkie</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>{status.title}</option>
                ))}
              </select>
            </label>
            <label>
              Projekt
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                <option value="ALL">Wszystkie</option>
                <option value="NONE">Bez projektu</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        <section className="main-panel">
          <div className="view-toolbar">
            <div className="segmented-control" role="tablist" aria-label="Widok">
              {viewOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActiveView(option.id)}
                  className={activeView === option.id ? 'active' : ''}
                  role="tab"
                  aria-selected={activeView === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="result-count">{filteredTasks.length} zadań w widoku</span>
          </div>

          {activeView === 'board' && (
            <div className="kanban-board">
              {statuses.map((status) => (
                <section
                  key={status.id}
                  className={`kanban-column ${status.color}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDropTask(event, status.id)}
                >
                  <header>
                    <div>
                      <span className={`status-dot ${status.accent}`} />
                      <h2>{status.title}</h2>
                    </div>
                    <button type="button" onClick={() => openTaskModal(null, status.id)}>Dodaj</button>
                  </header>

                  <div className="task-stack">
                    {tasksByStatus[status.id].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        projectsById={projectsById}
                        onEdit={() => openTaskModal(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onStatusChange={(nextStatus) => updateTaskStatus(task.id, nextStatus)}
                        onDragStart={() => setDraggedTaskId(task.id)}
                      />
                    ))}
                    {tasksByStatus[status.id].length === 0 && (
                      <div className="empty-dropzone">Przeciągnij zadanie tutaj</div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}

          {activeView === 'list' && (
            <div className="task-table-wrap">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Zadanie</th>
                    <th>Projekt</th>
                    <th>Termin</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        {task.description && <span>{task.description}</span>}
                      </td>
                      <td>{getProjectName(projectsById, task.projectId)}</td>
                      <td>
                        <DueBadge task={task} />
                      </td>
                      <td>
                        <select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)}>
                          {statuses.map((status) => (
                            <option key={status.id} value={status.id}>{status.title}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" onClick={() => openTaskModal(task)}>Edytuj</button>
                          <button type="button" onClick={() => handleDeleteTask(task.id)} className="danger-link">Usuń</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTasks.length === 0 && <EmptyState onCreate={() => openTaskModal()} />}
            </div>
          )}

          {activeView === 'stats' && (
            <div className="stats-view">
              <section className="progress-card">
                <div className="progress-ring" style={{ '--progress': `${taskStats.completion}%` }}>
                  <span>{taskStats.completion}%</span>
                </div>
                <div>
                  <h2>Postęp pracy</h2>
                  <p>{taskStats.completed} z {taskStats.total} zadań jest zakończonych.</p>
                  <div className="status-bars">
                    {statuses.map((status) => {
                      const value = taskStats.totals[status.id] ?? 0;
                      const percent = taskStats.total ? Math.round((value / taskStats.total) * 100) : 0;
                      return (
                        <div key={status.id} className="bar-row">
                          <span>{status.title}</span>
                          <div><i style={{ width: `${percent}%` }} /></div>
                          <strong>{value}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="stats-grid">
                <article>
                  <h2>Postęp projektów</h2>
                  <div className="project-progress-list">
                    {projectStats.map((project) => (
                      <div key={project.id} className="project-progress">
                        <div>
                          <strong>{project.name}</strong>
                          <span>{project.done}/{project.total}</span>
                        </div>
                        <div className="progress-track"><i style={{ width: `${project.percent}%` }} /></div>
                      </div>
                    ))}
                    {projectStats.length === 0 && <p className="muted-text">Brak danych do wykresu.</p>}
                  </div>
                </article>

                <article>
                  <h2>Najbliższe terminy</h2>
                  <div className="due-list">
                    {upcomingTasks.map((task) => (
                      <button key={task.id} type="button" onClick={() => openTaskModal(task)}>
                        <span>{task.title}</span>
                        <DueBadge task={task} />
                      </button>
                    ))}
                    {upcomingTasks.length === 0 && <p className="muted-text">Nie masz zaplanowanych terminów.</p>}
                  </div>
                </article>
              </section>
            </div>
          )}
        </section>
      </section>

      {isTaskModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Formularz zadania">
          <form className="task-modal" onSubmit={handleSaveTask}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">{taskForm.id ? 'Edycja' : 'Nowe zadanie'}</p>
                <h2>{taskForm.id ? 'Zmień szczegóły zadania' : 'Dodaj zadanie do planu'}</h2>
              </div>
              <button type="button" onClick={() => setIsTaskModalOpen(false)} aria-label="Zamknij">×</button>
            </div>

            <label>
              Tytuł
              <input
                type="text"
                value={taskForm.title}
                onChange={(event) => setTaskForm((form) => ({ ...form, title: event.target.value }))}
                required
                autoFocus
              />
            </label>

            <label>
              Opis
              <textarea
                value={taskForm.description}
                onChange={(event) => setTaskForm((form) => ({ ...form, description: event.target.value }))}
                rows="4"
              />
            </label>

            <div className="form-grid">
              <label>
                Status
                <select value={taskForm.status} onChange={(event) => setTaskForm((form) => ({ ...form, status: event.target.value }))}>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>{status.title}</option>
                  ))}
                </select>
              </label>

              <label>
                Projekt
                <select value={taskForm.projectId} onChange={(event) => setTaskForm((form) => ({ ...form, projectId: event.target.value }))}>
                  <option value="">Bez projektu</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Termin
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((form) => ({ ...form, dueDate: event.target.value }))}
                />
              </label>
            </div>

            <div className="modal-actions">
              {taskForm.id ? (
                <button type="button" onClick={() => handleDeleteTask(taskForm.id)} className="danger-button">
                  Usuń
                </button>
              ) : <span />}
              <div>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="secondary-button">
                  Anuluj
                </button>
                <button type="submit" disabled={saving} className="primary-button">
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ChatWidget />
    </main>
  );
};

const TaskCard = ({ task, projectsById, onEdit, onDelete, onStatusChange, onDragStart }) => {
  const dueState = getDueState(task);
  const availableStatuses = statuses.filter((status) => status.id !== task.status);

  return (
    <article className={`task-card ${dueState ? `is-${dueState}` : ''}`} draggable onDragStart={onDragStart}>
      <button type="button" onClick={onEdit} className="task-card-main">
        <strong>{task.title}</strong>
        {task.description && <span>{task.description}</span>}
      </button>
      <div className="task-meta">
        <span>{getProjectName(projectsById, task.projectId)}</span>
        <DueBadge task={task} />
      </div>
      <div className="task-card-actions">
        {availableStatuses.map((status) => (
          <button key={status.id} type="button" onClick={() => onStatusChange(status.id)}>
            {status.short}
          </button>
        ))}
        <button type="button" onClick={onDelete} className="danger-link">Usuń</button>
      </div>
    </article>
  );
};

const DueBadge = ({ task }) => {
  const dueState = getDueState(task);
  return (
    <span className={`due-badge ${dueState ? `due-${dueState}` : ''}`}>
      {formatDate(task.dueDate)}
    </span>
  );
};

const EmptyState = ({ onCreate }) => (
  <div className="empty-state">
    <h2>Brak zadań w tym widoku</h2>
    <p>Zmień filtry albo dodaj nowe zadanie.</p>
    <button type="button" onClick={onCreate} className="primary-button">Nowe zadanie</button>
  </div>
);

export default DashboardPage;
