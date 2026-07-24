# FitPilot Web + Python Backend Design

## 1. Goal

Convert the current browser-only FitPilot demo into a local, internally usable
full-stack application while preserving the existing GitHub Pages demo.

The first delivery covers React Web, FastAPI, PostgreSQL, phone-code
authentication in development mode, server-owned AI credentials, persistent
fitness data, and versioned AI-generated plans. WeChat Mini Program and mobile
apps are later projects that reuse the same `/api/v1` backend.

## 2. Confirmed Product Decisions

- Delivery order: Web + backend first, WeChat Mini Program second, mobile app
  third.
- Backend language: Python.
- Backend framework: FastAPI.
- Database: PostgreSQL.
- Authentication: phone verification code.
- First environment: local/internal only.
- SMS behavior: development adapter that prints the code to the backend console.
- Existing browser `localStorage` data is not migrated.
- AI credentials are configured once on the backend and never supplied by users.
- The current remote `main` branch and GitHub Pages deployment must remain
  untouched until the user explicitly approves a later merge or deployment.

## 3. Current-State Constraints

The current application is React 19 + Vite + TypeScript. Its state is stored
through React Context and browser `localStorage` in `src/store.tsx` and
`src/lib/storage.ts`. AI and vision requests are sent directly from the browser
by `src/lib/llm.ts`, including a client-side API key. Browser-specific image and
canvas code exists in `src/pages/PhotoPage.tsx` and
`src/components/ShareCard.tsx`.

Reusable assets include the TypeScript domain shapes in `src/types.ts`, the
calorie calculation in `src/lib/tdee.ts`, the exercise catalogue, fixtures, and
most Web presentation components. Browser storage, direct AI calls, navigation,
image capture, chart rendering, and canvas export are not portable to Mini
Program or React Native and must remain client adapters or Web-only components.

## 4. Architecture Decision

Use a monorepo with a modular-monolith FastAPI backend.

```text
fitpilot/
|-- apps/
|   |-- web/                React + Vite Web client
|   `-- api/                FastAPI application and worker
|       `-- app/
|           |-- auth/
|           |-- users/
|           |-- workouts/
|           |-- nutrition/
|           |-- checkins/
|           |-- ai/
|           |-- files/
|           `-- core/
|-- packages/
|   `-- api-client/         Generated TypeScript client
|-- infra/
|   `-- docker-compose.yml
`-- docs/
```

FastAPI exposes `/api/v1` and owns authentication, authorization, persistence,
AI orchestration, file validation, and the OpenAPI contract. PostgreSQL is the
only authoritative store for the new application. The Web client consumes a
generated TypeScript client derived from FastAPI OpenAPI instead of manually
duplicating request and response types.

The backend remains one deployable application with internally separated
modules. It is not split into microservices. AI work is executed by a separate
worker process from the same Python package so that long-running generation
does not hold an HTTP request open.

### Alternatives Considered

1. Separate frontend and backend repositories: clearer repository ownership but
   higher contract-versioning and local-development overhead for the current
   project size.
2. Backend-as-a-Service: faster CRUD setup but poorer fit for server-owned AI,
   phone authentication adapters, future WeChat identity binding, and a later
   mainland-China deployment.
3. NestJS backend: enables direct TypeScript sharing, but Python is preferred
   for FitPilot's AI, image analysis, and future data-processing roadmap.

## 5. Runtime and Dependencies

- Python 3.12.x.
- FastAPI and Pydantic for HTTP APIs and validation.
- SQLAlchemy 2 async sessions for PostgreSQL access.
- Psycopg 3 as the PostgreSQL driver.
- Alembic for versioned schema migrations.
- A stable PostgreSQL driver supported by SQLAlchemy.
- Pytest for backend testing.
- PostgreSQL in Docker Compose for local development.
- React, Vite, and TypeScript for the Web client.
- A generated TypeScript API client from the backend OpenAPI document.

Dependency versions are pinned when implementation begins and are selected from
stable, mutually compatible releases. No client application contains database,
AI-provider, SMS-provider, or WeChat secrets.

Relevant official documentation:

- FastAPI OpenAPI and security features:
  https://fastapi.tiangolo.com/features/
- SQLAlchemy 2:
  https://docs.sqlalchemy.org/en/20/
- Alembic:
  https://alembic.sqlalchemy.org/en/latest/tutorial.html

## 6. Database Design

All primary keys are server-generated UUIDs. All timestamps are stored as UTC
`timestamptz`. User-owned tables include `user_id` and enforce ownership in the
service layer. Database foreign keys and appropriate unique constraints protect
referential integrity.

### Identity and Authentication

- `users`: FitPilot account, status, creation time, and deletion time.
- `auth_identities`: provider (`phone`, later `wechat`, `apple`, or others),
  provider subject, user reference, and provider metadata. Provider plus subject
  is unique.
- `phone_verification_codes`: phone number, purpose, code hash, expiry, attempt
  count, used time, and creation time. Plain codes are never stored.
- `auth_sessions`: user, refresh-token hash, expiry, revoked time, device label,
  and last-used time. Plain refresh tokens are never stored.

### Profile and Fitness Data

- `user_profiles`: sex, age, height, weight, goal, activity level, experience
  level, training days, equipment, dietary preferences, and free-text `notes`.
- `workout_plans`: user, status, version, schema version, prompt version,
  profile snapshot, plan JSONB, source AI request, and timestamps.
- `diet_plans`: user, status, version, schema version, prompt version, target
  calories, profile snapshot, plan JSONB, source AI request, and timestamps.
- `workout_logs`: user, workout date, optional plan reference, duration,
  completion status, perceived effort, and notes.
- `food_logs`: user, observed time, meal type, food name, portion, calories,
  nutrients, optional source file, recognition metadata, and user-confirmed
  status.
- `body_metrics`: user, recorded time, weight, optional body-fat percentage,
  optional waist measurement, and notes.
- `files`: owner, storage key, MIME type, byte size, checksum, status, and
  timestamps.
- `ai_jobs`: owner, job type, status, idempotency key, model, prompt version,
  input reference, output reference, token usage, latency, error code, attempt
  count, and timestamps.

Generated workout and diet content uses validated, versioned JSONB. This keeps
the nested AI schema adaptable while preserving searchable headers and stable
history. Regeneration creates a new plan version and archives the previous
active plan instead of overwriting it.

The profile snapshot and prompt version stored with each plan make historic
results reproducible. Later profile edits do not silently mutate old plans.

## 7. Authentication Design

The API provides:

```text
POST /api/v1/auth/sms/request
POST /api/v1/auth/sms/verify
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Development codes expire after 5 minutes, allow at most 5 verification
attempts, and cannot be requested for the same phone number more than once per
60 seconds. Production adapters additionally enforce daily and source-IP
limits.

Successful verification creates or finds a phone identity and returns a
15-minute access token plus a rotating 30-day refresh token. Refresh reuse after
rotation revokes the associated session. Logout revokes the current session.

The design intentionally separates `users` from `auth_identities`. A later
WeChat login binds OpenID/UnionID to the same FitPilot user instead of creating a
second fitness-data account.

## 8. API Design

Core resources:

```text
GET, PUT    /api/v1/profile
GET, POST   /api/v1/workout-plans
GET, POST   /api/v1/diet-plans
GET, POST   /api/v1/workout-logs
GET, POST   /api/v1/food-logs
GET, POST   /api/v1/body-metrics
POST        /api/v1/files
```

Every read and mutation is scoped by the authenticated user. Resource lookups
do not accept a caller-supplied `user_id`. Cross-user resources return the same
not-found response as missing resources to avoid confirming their existence.

Long-running AI operations use jobs:

```text
POST /api/v1/ai/workout-plan-jobs
POST /api/v1/ai/diet-plan-jobs
POST /api/v1/ai/food-recognition-jobs
GET  /api/v1/ai/jobs/{job_id}
```

Create-job requests require an idempotency key. Repeating the same request with
the same authenticated user and key returns the original job. The client polls
job status and stops on `succeeded` or `failed`.

## 9. AI and File Flows

For plan generation, the backend loads the authenticated user's profile,
including `notes`, creates a versioned prompt, writes a queued job, and returns
the job ID. The worker calls the configured AI provider, validates the response
with Pydantic, and saves the plan and completed job in one transaction.

Invalid model output may receive one repair attempt. Network timeout, invalid
output after repair, provider authentication failure, rate limit, and quota
failure produce separate stable error codes.

Food recognition first validates and stores the uploaded image. The worker
creates a recognition draft. The draft does not become a `food_logs` record
until the user reviews and confirms or edits it.

The development file adapter stores files under a private local data directory.
The API serves authorized file access; files are not placed in the Web public
directory. A production object-storage adapter later replaces the
implementation without changing resource APIs.

## 10. Error Handling and Observability

All API errors use:

```json
{
  "error": {
    "code": "AI_TIMEOUT",
    "message": "生成计划超时，请稍后重试",
    "request_id": "uuid"
  }
}
```

Stable machine-readable codes drive client behavior. Validation, unauthenticated,
forbidden/not-found, conflict, rate-limit, provider, and internal errors map to
appropriate HTTP statuses.

Every request receives a request ID. Structured logs contain request ID,
route, status, duration, and safe error codes. Logs never include verification
codes, access or refresh tokens, AI keys, full prompts, uploaded image contents,
or full health profiles.

The API exposes liveness and readiness endpoints. Readiness fails when the
database or required schema is unavailable. AI-provider outages do not make the
whole API unready; they fail only AI jobs.

The application does not silently replace failed AI output with sample data.
Explicit local mock behavior is enabled only with `AI_MODE=mock`.

## 11. Web Migration

The current Web UI is preserved where practical. The migration replaces
`localStorage` persistence and direct AI calls in slices:

1. Introduce authentication and generated API client.
2. Move profile reads and writes to the API.
3. Move workout plans, diet plans, logs, and body metrics to the API.
4. Replace direct AI calls with job creation and polling.
5. Replace direct image recognition with authorized upload and recognition jobs.

Browser storage retains only non-authoritative UI preferences and appropriate
session material. It never becomes the source of truth for health or fitness
records.

## 12. Test Strategy

### Unit

- Phone-code expiry, attempts, hashing, and throttling.
- Token creation, rotation, revocation, and reuse detection.
- Profile field validation and free-text note handling.
- Plan version activation and archival.
- Prompt construction includes non-blank profile notes and omits blank notes.
- AI-output schema validation and error-code mapping.

### Integration

- PostgreSQL constraints, transactions, and ownership queries.
- Alembic upgrade from an empty database to head.
- Authentication through profile and fitness resource APIs.
- AI job idempotency and worker state transitions.
- File ownership and confirmation of food-recognition drafts.

### Contract

- FastAPI OpenAPI is generated in CI.
- The generated TypeScript client is up to date.
- Breaking contract changes fail the contract check.

### End to End

With `AI_MODE=mock`, a browser test requests a development code, signs in,
creates a profile with notes, generates workout and diet plans, records a
workout and body metric, confirms a food-recognition draft, refreshes the page,
and verifies persistence.

### Security

- User A cannot read, update, delete, or infer User B's resources.
- Expired, revoked, malformed, and replayed credentials are rejected.
- Verification-code and job-creation rate limits are enforced.
- Logs and client bundles are scanned for configured secrets.

## 13. Delivery Phases

1. Repository and runtime foundation: local feature branch, monorepo layout,
   FastAPI skeleton, PostgreSQL, Alembic, Docker Compose, health checks, and CI.
2. Identity and profile: phone development code, token sessions, user/profile
   schema, API, and Web authentication.
3. Core persistence: replace Web local persistence for plans, logs, food, and
   body metrics.
4. AI backend: server-owned provider client, PostgreSQL jobs, worker, versioned
   plan generation, and notes integration.
5. Images and food recognition: upload validation, private file adapter,
   recognition drafts, and user confirmation.
6. Hardening: contract generation, complete automated tests, log redaction,
   account data deletion, backup design, and production configuration
   documentation.
7. Later projects: WeChat Mini Program, then React Native/Expo application,
   real SMS, production hosting, filing/domain work, and object storage.

Each phase must leave the local application runnable and independently
testable. No phase modifies or deploys the current GitHub Pages demo.

## 14. Acceptance Criteria

- The remote `main` commit and GitHub Pages deployment remain unchanged.
- One documented local command starts Web, API, worker, and PostgreSQL.
- A user can sign in using the development phone code.
- Profile, plans, workout logs, food logs, and body metrics survive browser and
  service restarts.
- Two test users cannot access each other's records.
- AI and database secrets do not appear in browser source, storage, responses,
  or logs.
- Workout and diet generation includes the user's non-blank notes.
- AI failures return stable visible errors and never silently show fixtures.
- Swagger/OpenAPI documents all `/api/v1` endpoints.
- The generated TypeScript API client matches the checked OpenAPI document.
- Backend tests, Web tests, lint, type checking, builds, integration tests, and
  the mock-AI end-to-end flow pass.

## 15. Branch and Release Safety

The design and later implementation live on the local
`feature/fullstack-foundation` branch. No push, pull request, merge to `main`,
GitHub Pages deployment, production service creation, or credentialed external
action occurs without a later explicit user request.
