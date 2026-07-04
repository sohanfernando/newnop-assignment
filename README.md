# Task Tracker

A full-stack task tracker with JWT authentication, role-based access control (User/Admin), task CRUD with pagination and filtering, and real-time updates over WebSocket.

- **Backend**: Spring Boot 4.1.0 (Java 21), Spring Security, Spring Data JPA, MySQL, JWT, STOMP-over-WebSocket
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS v4, React Router, Axios, STOMP/SockJS client
- **Containerized**: `docker compose up --build` runs the whole stack (MySQL + backend + frontend) with one command
- **Live on Azure**: deployed and auto-redeployed on every push to `main` — see [Live Deployment](#live-deployment)

## Contents

- [Live Deployment](#live-deployment)
- [Setup Instructions](#setup-instructions)
- [Running with Docker](#running-with-docker)
- [Default Admin Account](#default-admin-account)
- [Running Tests](#running-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Overview](#api-overview)
- [API Documentation (Postman)](#api-documentation-postman)
- [Design Decisions](#design-decisions)
- [Assumptions](#assumptions)
- [Future Improvements](#future-improvements)

## Live Deployment

The app is deployed on Azure and stays in sync with `main` automatically:

- **Frontend**: https://tasktracker-frontend-sohan.azurewebsites.net
- **Backend**: https://tasktracker-backend-sohan.azurewebsites.net

Log in with the [seeded admin account](#default-admin-account) to see Admin-only functionality, or register a new account.

**Infrastructure** (Azure, resource group `tasktracker-rg`): Azure Container Registry (image storage) + App Service Plan (Linux, B1) running two Web Apps for Containers (backend, frontend-via-nginx) + Azure Database for MySQL Flexible Server (Burstable B1ms). Provisioned via the Azure CLI; see [CI/CD Pipeline](#cicd-pipeline) for how deploys happen.

> This is a demo deployment for assignment review, not a production setup — the MySQL server's firewall is open to all IPs for simplicity, secrets are stored as GitHub Actions/App Service secrets rather than a dedicated vault, and the resource group may be deleted after review to stop billing against the Azure free-trial credit.

## Setup Instructions

### Prerequisites

- Java 21
- Node.js 20+ (CI uses Node 22)
- MySQL 8+ running locally (or reachable via env vars — see below)

### Database setup

The backend connects to a database named `task_tracker_db` and will create it automatically on first run (`createDatabaseIfNotExist=true`) — you only need a running MySQL server with a user that has permission to create databases. No manual schema setup is required; Hibernate creates/updates tables on startup (`spring.jpa.hibernate.ddl-auto=update`).

### Backend setup

```bash
cd backend
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`. On first boot it seeds a default admin account (see [below](#default-admin-account)) if one doesn't already exist.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app starts on `http://localhost:5173` and expects the backend at `http://localhost:8080` (see [environment configuration](#environment-configuration) to change this).

## Running with Docker

As an alternative to running Java/Node/MySQL locally, the whole stack (MySQL + backend + frontend) can be brought up with one command:

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- MySQL: `localhost:3306` (persisted in a named volume, `mysql_data`)

Each service's host port can be overridden via environment variables if any of the defaults conflict with something already running on your machine — e.g. `MYSQL_HOST_PORT=3307 BACKEND_HOST_PORT=8081 FRONTEND_HOST_PORT=5174 docker compose up --build`. The database credentials, JWT secret, and admin account can also be overridden the same way as the [environment configuration](#environment-configuration) below (e.g. `DB_PASSWORD=...`, `JWT_SECRET=...`).

Tear down with `docker compose down` (add `-v` to also delete the MySQL volume and start fresh next time).

### Environment configuration

Neither side requires any configuration to run locally with defaults — the values below only need to be set if you want to override them (e.g. pointing at a different database, or deploying somewhere other than localhost).

**Backend** (`backend/.env.example` documents these; Spring Boot reads them as real environment variables, not from a `.env` file):

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/task_tracker_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true` | JDBC connection string |
| `DB_USERNAME` | `root` | MySQL username |
| `DB_PASSWORD` | `1234` | MySQL password |
| `JWT_SECRET` | (dev key baked into `application.properties`) | Base64 HMAC key used to sign JWTs — override for any real deployment |
| `JWT_EXPIRATION` | `86400000` (24h, ms) | JWT token lifetime |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin` / `admin@tasktracker.local` / `admin123` | Seeded default admin credentials |
| `SERVER_PORT` | `8080` | Backend HTTP port |

**Frontend** (`frontend/.env.example` — copy to `.env` to override):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend base URL used by the API client and the WebSocket connection |

## Default Admin Account

Registration through the app always creates a `USER` role (see [Assumptions](#assumptions)). To exercise Admin-only functionality (viewing/managing all users' tasks), log in with the seeded account:

```
email:    admin@tasktracker.local
password: admin123
```

This is created automatically on backend startup by `AdminSeeder` if no user with that email exists yet.

## Running Tests

**Backend** (36 tests: JUnit + Mockito unit tests, plus MockMvc integration tests against an in-memory H2 database):

```bash
cd backend
./mvnw test
```

**Frontend** (22 tests: Vitest + React Testing Library):

```bash
cd frontend
npm test
```

## CI/CD Pipeline

`.github/workflows/ci.yml` runs on every push and pull request, with four jobs:

- **`backend`**: installs dependencies (`mvnw dependency:go-offline`), lints (`mvnw spotless:check`, Google Java Format via Spotless), then runs the full test suite (`mvnw test`).
- **`frontend`**: installs dependencies (`npm ci`), lints (`npm run lint`, oxlint), runs tests (`npm test`), then does a production build as an extra safety net.
- **`deploy-backend`** / **`deploy-frontend`** (CD): only run on a **push to `main`** (never on pull requests), and only after their corresponding test job passes (`needs:`). Each logs into Azure and ACR, builds a fresh Docker image tagged both `:latest` and with the commit SHA, pushes both tags to Azure Container Registry, then restarts the corresponding Azure Web App so it pulls the new image. `deploy-frontend` also depends on `deploy-backend` finishing first, since its build bakes in the backend's URL.

Azure authentication uses a Service Principal (repo secret `AZURE_CREDENTIALS`, scoped to just the `tasktracker-rg` resource group via the `azure/login` action) plus ACR admin credentials (`ACR_USERNAME` / `ACR_PASSWORD`) for `docker/login-action`. None of these are committed — they're GitHub Actions repository secrets.

## API Overview

Base URL: `http://localhost:8080`. All `/api/tasks/**` endpoints require `Authorization: Bearer <token>` obtained from login/register.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create a new `USER` account, returns a JWT |
| POST | `/api/auth/login` | — | Authenticate, returns a JWT |
| POST | `/api/tasks` | User/Admin | Create a task (owned by the caller) |
| GET | `/api/tasks/{id}` | User/Admin | Get a task by id (403 if not owner and not Admin) |
| GET | `/api/tasks` | User/Admin | Paginated list; query params: `status`, `ownerId`, `page`, `size`, `sortBy`, `sortDir`. Regular users are always scoped to their own tasks regardless of `ownerId`; Admins see everyone's and can filter by any `ownerId` |
| PUT | `/api/tasks/{id}` | User/Admin | Update a task (403 if not owner and not Admin) |
| DELETE | `/api/tasks/{id}` | User/Admin | Delete a task (403 if not owner and not Admin) |

**Real-time updates**: connect to the SockJS endpoint at `/ws`. Subscribe to:
- `/topic/tasks` — broadcast on every create/update (payload: the full task)
- `/topic/tasks/deleted` — broadcast on every delete (payload: the deleted task's id)

## API Documentation (Postman)

A Postman collection and environment covering every endpoint above are provided in [`postman/`](postman/).

## Design Decisions

- **Monorepo layout**: `backend/` and `frontend/` in one repository, matching the single-repo-link submission format.
- **JWT auth, stateless sessions**: Spring Security is configured with `SessionCreationPolicy.STATELESS`; a custom `JwtAuthFilter` reads the `Authorization` header on every request. No refresh tokens — a single 24h access token, simple by design for this scope.
- **RBAC enforced in the service layer, not just routes**: ownership/role checks live in `TaskServiceImpl` (not just controller-level `@PreAuthorize`), so `getTaskById`/`updateTask`/`deleteTask` all throw `AccessDeniedException` (→ 403) for non-owner, non-admin callers, while Admins bypass the ownership check entirely.
- **Real-time via STOMP over WebSocket**: `SimpMessagingTemplate` broadcasts to `/topic/tasks` and `/topic/tasks/deleted` from `TaskServiceImpl` after every mutation, so every connected client (not just the requester) sees changes live — the frontend subscribes via `@stomp/stompjs` + `sockjs-client`.
- **Frontend state**: React Context for auth (`AuthContext`, token persisted in `localStorage`) and toast notifications (`ToastContext`); no external state-management library — the app is small enough that prop drilling plus two contexts is simpler than adding Redux/Zustand.
- **Task view/create/edit as modals, not separate routes**: matches a design mockup provided mid-project; still satisfies "view task details" as a UI concept without the overhead of extra routes for what's fundamentally one page (the task list) with overlays.
- **Backend code style**: Spotless + Google Java Format enforced in CI, not just a local convention.
- **Docker Compose over Kubernetes/etc.**: three services (MySQL, backend, frontend-via-nginx) with multi-stage Dockerfiles, host ports overridable via env vars (`MYSQL_HOST_PORT`, `BACKEND_HOST_PORT`, `FRONTEND_HOST_PORT`) so it doesn't collide with a locally-running MySQL/backend/frontend. The frontend's `VITE_API_BASE_URL` is baked in at build time (defaults to `http://localhost:8080`), which is correct as long as the backend's *host* port is left at its default — this is a build-time static-site constraint, not something Compose can override at container-start like the backend's env vars.
- **Azure App Service for Containers over Kubernetes/Container Apps**: reuses the same Dockerfiles built for local Docker Compose with zero changes, and the same env-var-driven config (`DB_URL`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, etc.) just gets set as Azure Web App settings instead of Compose environment variables — one config mechanism, two places it's supplied. `CorsConfig` was changed from a hardcoded localhost allowlist to reading `CORS_ALLOWED_ORIGINS` for exactly this reason: the deployed frontend's real origin needs to be allowed without a code change per environment.

## Assumptions

The take-home spec describes what `User` and `Admin` roles can *do*, but not how an `Admin` account gets *created* — there's no "Admin registration" flow described. Decisions made to fill that gap:

- **Registration always creates a `USER`** — there is no self-service way to become an Admin. Instead, a default Admin account is seeded automatically on backend startup (see [above](#default-admin-account)). This was the simplest way to guarantee a reviewer can access Admin functionality with zero manual steps (e.g. no direct database editing required).
- **Task ownership is fixed at creation** — there's no endpoint (for anyone, including Admins) to reassign a task to a different owner. The spec only asks for Admins to "view and manage all tasks," which we read as full CRUD rights over any task, not reassignment.
- **No free-text search** — the spec asks for filtering by status and owner only; a search box wasn't added because there's no backend endpoint for it, and implementing it as a client-side filter over one paginated page would silently miss matches on other pages.
- **Admin's owner filter dropdown** is populated from the usernames/ids already present in the currently loaded (unfiltered) task page, rather than a dedicated "list users" endpoint — reasonable at this scale, called out below as an area to improve.
- **Task stats row** (To Do / In Progress / Done counts shown in the UI) is computed via three separate lightweight count-only requests to the existing list endpoint, not a dedicated aggregate endpoint.

## Future Improvements

With more time, in rough priority order:

1. **Dedicated `GET /api/users` (Admin-only) endpoint** for the owner filter dropdown and any future admin user-management UI, instead of deriving it from loaded tasks.
2. **Task ownership reassignment** for Admins, if that turns out to be part of "manage all tasks" after all.
3. **Refresh tokens** / shorter-lived access tokens instead of a single 24h JWT.
4. **Rate limiting** on `/api/auth/**` to slow down credential-stuffing attempts.
5. **A dedicated stats endpoint** instead of three separate count queries.
6. **Free-text search** on task title/description, backed by a real query parameter.
7. **Harden the deployment**: restrict the MySQL firewall to just the backend's outbound IPs instead of allow-all, move secrets into Azure Key Vault, enable `httpsOnly` enforcement and a custom domain with a managed certificate.
8. **End-to-end tests** (e.g. Playwright) as an additional CI stage, covering the real-time update flow across two simulated browser sessions (done manually during development, not automated in CI).
