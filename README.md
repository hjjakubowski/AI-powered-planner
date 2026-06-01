# AI Powered Planner

AI Powered Planner is a full-stack web application for organizing study and work tasks. Users can create projects, manage tasks in `TODO`, `DOING` and `DONE` states, track progress in board/list/statistics views, and use an AI assistant to generate a daily plan from open tasks.

The application consists of a Spring Boot backend, a React/Vite frontend, PostgreSQL persistence, and an optional Google Gemini integration through Spring AI.

## Features

- User registration, login, logout, and account deletion.
- Session-based authentication with CSRF protection.
- Role-based authorization with `USER` and `ADMIN`.
- Per-user project CRUD.
- Per-user task CRUD with title, description, status, due date and optional project assignment.
- Kanban-style dashboard with drag-and-drop status changes.
- List view with search and filters by status/project.
- Statistics view with completion rate, overdue tasks, project progress and upcoming deadlines.
- AI chat assistant and "suggest plan" action based on active tasks.
- OpenAPI/Swagger documentation for the REST API.
- Docker Compose setup for PostgreSQL, backend and frontend.

## Tech Stack

Backend:

- Java 21
- Spring Boot 4
- Spring Web
- Spring Security
- Spring Data JPA
- Jakarta Validation
- Spring AI Google GenAI
- PostgreSQL
- H2 for tests
- Gradle Wrapper
- Springdoc OpenAPI

Frontend:

- React 19
- Vite 8
- React Router
- Axios
- React Markdown
- Tailwind/Vite tooling
- CSS files colocated with application views

Infrastructure:

- Docker Compose
- PostgreSQL 16 Alpine
- Nginx for the production frontend container

## Quick Start

Start the full stack with Docker:

```bash
cp .env.example .env
docker compose up --build
```

Available services:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080/api` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| PostgreSQL from host | `localhost:5433` |

The default `.env.example` uses `GOOGLE_GENAI_API_KEY=disabled`, so the app starts without a real Gemini key. In that mode, the planner still works and the AI assistant returns a configuration message instead of calling the model.

To enable real AI responses, edit `.env`:

```env
GOOGLE_GENAI_API_KEY=your-google-ai-studio-key
GOOGLE_GENAI_MODEL=gemini-2.5-flash
```

Then rebuild or restart the backend:

```bash
docker compose up --build
```

## Local Development

The recommended local workflow is:

1. Run PostgreSQL in Docker.
2. Run the backend with Gradle.
3. Run the frontend with Vite.

Start only the database:

```bash
docker compose up -d postgres
```

Start the backend:

```bash
./gradlew bootRun
```

By default the backend connects to:

```text
jdbc:postgresql://localhost:5433/mydatabase
username: myuser
password: secret
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and uses `http://localhost:8080/api` as the default API URL.

To point the frontend to another backend:

```bash
cd frontend
VITE_API_URL=http://localhost:8080/api npm run dev
```

Use the same host consistently in local development. For example, prefer `http://localhost:5173` with `http://localhost:8080/api`, because the app uses session cookies and CSRF tokens.

Do not run the Docker backend and `./gradlew bootRun` at the same time if both use port `8080`.

## Configuration

Backend configuration is read from environment variables, with fallbacks in `src/main/resources/application.properties`.

| Variable | Default | Description |
| --- | --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5433/mydatabase` | JDBC URL used by the backend in local mode. |
| `SPRING_DATASOURCE_USERNAME` | `myuser` | Database user. |
| `SPRING_DATASOURCE_PASSWORD` | `secret` | Database password. |
| `SPRING_DATASOURCE_DRIVER` | `org.postgresql.Driver` | JDBC driver class. |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` | Hibernate schema strategy. |
| `SPRING_JPA_SHOW_SQL` | `false` | Enables SQL logging. |
| `GOOGLE_GENAI_API_KEY` | `disabled` | Google AI Studio key. Placeholder values disable real AI calls. |
| `GOOGLE_GENAI_MODEL` | `gemini-2.5-flash` | Gemini model used by Spring AI. |
| `SPRING_DOCKER_COMPOSE_ENABLED` | `false` | Spring Boot Docker Compose integration flag. |
| `VITE_API_URL` | `http://localhost:8080/api` | API base URL used by the frontend build/runtime. |

Do not commit real secrets. `.env` is ignored by Git; `.env.example` is safe to commit.

## Authentication And Security

The application uses server-side HTTP sessions instead of storing raw credentials in browser storage.

Current flow:

- `POST /api/auth/login` validates credentials and stores authentication in the HTTP session.
- The frontend sends cookies with `axios` using `withCredentials: true`.
- Mutating requests use CSRF protection through `X-XSRF-TOKEN`.
- `GET /api/auth/csrf` returns the CSRF token used by the frontend.
- `POST /api/auth/logout` invalidates the session.
- User-facing API responses use DTOs instead of exposing JPA entities.
- Admin user listing returns a safe DTO without password hashes or entity relations.
- AI prompt context is limited and task text is treated as untrusted user data.

Allowed local CORS origins are configured in `SecurityConfig`:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:3000`

## API Overview

All application endpoints are under `/api`. Except for authentication, CSRF and OpenAPI docs, endpoints require an authenticated session.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user. |
| `POST` | `/api/auth/login` | Log in with username or email. |
| `POST` | `/api/auth/logout` | Log out and invalidate the session. |
| `GET` | `/api/auth/csrf` | Get CSRF token. |
| `GET` | `/api/user/me` | Get current user profile. |
| `PUT` | `/api/user/me` | Update current user's email. |
| `DELETE` | `/api/user/me` | Delete current user account. |
| `GET` | `/api/projects` | List current user's projects. |
| `POST` | `/api/projects` | Create project. |
| `GET` | `/api/projects/{id}` | Get project if owned by current user. |
| `PUT` | `/api/projects/{id}` | Update project if owned by current user. |
| `DELETE` | `/api/projects/{id}` | Delete project if owned by current user. |
| `GET` | `/api/tasks` | List current user's tasks. |
| `POST` | `/api/tasks` | Create task. |
| `GET` | `/api/tasks/{id}` | Get task if owned by current user. |
| `PUT` | `/api/tasks/{id}` | Update task if owned by current user. |
| `PATCH` | `/api/tasks/{id}/status` | Update task status. |
| `DELETE` | `/api/tasks/{id}` | Delete task. |
| `POST` | `/api/ai/chat` | Send message to the AI planning assistant. |
| `POST` | `/api/ai/suggest-plan` | Generate a daily plan from active tasks. |
| `GET` | `/api/admin/users` | List users, `ADMIN` only. |

OpenAPI documentation is available after starting the backend:

```text
http://localhost:8080/swagger-ui.html
```

## Data Model

Main entities:

- `AppUser`: email, username, password hash, role, projects and tasks.
- `Project`: project name, owner and tasks.
- `Task`: title, description, status, owner, optional project, creation date, due date and optional Kanban state.

Relationships:

- A user has many projects.
- A user has many tasks.
- A project has many tasks.
- A task always belongs to a user and may belong to a project.

Project and task reads/writes are scoped to the currently authenticated user.

## Repository Structure

```text
.
├── src/main/java/pl/hubert/aipoweredplanner
│   ├── AiPoweredPlannerApplication.java
│   └── domain
│       ├── config          # OpenAPI configuration
│       ├── controller      # REST controllers
│       ├── dto             # request/response DTOs
│       ├── entity          # JPA entities
│       ├── exception       # custom exceptions and global error handler
│       ├── repository      # Spring Data repositories
│       ├── security        # Spring Security, session auth, CSRF and CORS
│       └── service         # business logic and AI integration
├── src/main/resources
│   └── application.properties
├── src/test                # backend tests and test profile
├── frontend
│   ├── src
│   │   ├── components      # reusable UI components
│   │   ├── context         # AuthContext and ChatContext
│   │   ├── pages           # login, register, dashboard and account views
│   │   └── services        # API client
│   ├── Dockerfile
│   └── nginx.conf
├── compose.yaml
├── Dockerfile              # backend image
└── docs/sprawozdanie.md
```

## Testing And Quality Checks

Backend tests:

```bash
./gradlew test
```

Backend tests use the `test` Spring profile and an H2 in-memory database configured in `src/test/resources/application-test.properties`.

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Recommended full verification before submitting changes:

```bash
./gradlew test
cd frontend
npm run lint
npm run build
```

## Production Build

Build backend JAR:

```bash
./gradlew bootJar
java -jar build/libs/ai-powered-planner-0.0.1-SNAPSHOT.jar
```

Build frontend:

```bash
cd frontend
npm run build
npm run preview
```

Build Docker images:

```bash
docker compose build
```

## Known Limitations And Next Steps

- Hibernate uses `ddl-auto=update` by default. This is acceptable for local development, but production deployments should use explicit migrations with Flyway or Liquibase.
- There is no public admin bootstrap flow. Admin users must be provisioned manually or through a dedicated seed/migration.
- Account email change and account deletion currently rely on an active session. A stronger flow should require password re-confirmation.
- AI responses are best-effort. If Gemini is unavailable or not configured, the assistant returns a controlled fallback message.
- Some frontend dependencies and old assets may still be candidates for cleanup if the Kanban/dashboard implementation remains consolidated in one view.

## Useful Commands

```bash
# Run only PostgreSQL
docker compose up -d postgres

# Run backend locally
./gradlew bootRun

# Run frontend locally
cd frontend && npm run dev

# Run backend tests
./gradlew test

# Lint and build frontend
cd frontend && npm run lint && npm run build

# Start full stack
docker compose up --build
```
