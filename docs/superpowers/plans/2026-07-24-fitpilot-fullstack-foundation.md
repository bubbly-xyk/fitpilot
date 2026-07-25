# FitPilot Full-Stack Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first independently testable full-stack FitPilot slice: monorepo structure, FastAPI, PostgreSQL, development phone-code authentication, persistent user profiles, generated OpenAPI types, and an authenticated React Web flow.

**Architecture:** Keep all work on the local `feature/fullstack-foundation` branch. Move the existing Vite app into `apps/web`, add a modular FastAPI service in `apps/api`, and use PostgreSQL as the profile source of truth. FastAPI OpenAPI generates TypeScript types consumed by a small Web API client; the browser keeps access tokens in memory and receives rotating refresh tokens through an HttpOnly cookie.

**Tech Stack:** React 19, Vite 8, TypeScript 6, TanStack Query, Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2 async sessions, Psycopg 3, Alembic, PyJWT, PostgreSQL, Pytest, Vitest, Testing Library, Playwright, Docker Compose.

## Global Constraints

- Do not push any branch, open a pull request, merge `main`, or deploy GitHub Pages.
- `origin/main` must remain at `2dd3cbaa7d0357d6f016bca926d61686f9064af0` throughout this plan.
- Implement only on local branch `feature/fullstack-foundation`.
- Python runtime is 3.12.x.
- API prefix is `/api/v1`.
- PostgreSQL is the authoritative store for all new profile and authentication data.
- Existing `localStorage` profile data is not imported or dual-written.
- Development SMS codes are printed by the API process; the API never returns the code.
- Access tokens expire after 15 minutes and stay in Web memory.
- Refresh tokens expire after 30 days, rotate on every use, and are stored in an HttpOnly cookie.
- AI, fitness-plan persistence, activity logs, food logs, body metrics, files, Mini Program, and mobile apps are outside this first implementation slice.
- Existing Web build, lint, and prompt-note tests must remain green after the repository move.

---

## Planned File Structure

```text
fitpilot/
|-- apps/
|   |-- web/
|   |   |-- src/
|   |   |-- test/
|   |   |-- e2e/
|   |   |-- package.json
|   |   |-- vite.config.ts
|   |   `-- playwright.config.ts
|   `-- api/
|       |-- app/
|       |   |-- auth/
|       |   |-- profiles/
|       |   |-- core/
|       |   |-- db/
|       |   `-- main.py
|       |-- alembic/
|       |-- scripts/
|       |-- tests/
|       |-- Dockerfile
|       |-- alembic.ini
|       `-- pyproject.toml
|-- packages/
|   `-- api-client/
|       |-- src/
|       |   |-- client.ts
|       |   |-- index.ts
|       |   `-- schema.d.ts
|       `-- package.json
|-- infra/
|   `-- docker-compose.yml
|-- docs/
|-- .env.example
|-- package.json
`-- package-lock.json
```

The first slice intentionally leaves the existing workout, diet, dashboard,
photo, and exercise presentation code in `apps/web`. Only authentication and
profile persistence switch to the backend in this plan.

---

### Task 1: Move the Web App into an npm Workspace Without Behavior Changes

**Files:**
- Create: `apps/web/package.json`
- Create: `package.json`
- Move: `src/` to `apps/web/src/`
- Move: `public/` to `apps/web/public/`
- Move: `test/` to `apps/web/test/`
- Move: `index.html` to `apps/web/index.html`
- Move: `vite.config.ts` to `apps/web/vite.config.ts`
- Move: `tsconfig.json` to `apps/web/tsconfig.json`
- Move: `tsconfig.app.json` to `apps/web/tsconfig.app.json`
- Move: `tsconfig.node.json` to `apps/web/tsconfig.node.json`
- Move: `postcss.config.js` to `apps/web/postcss.config.js`
- Move: `tailwind.config.js` to `apps/web/tailwind.config.js`
- Move: `.oxlintrc.json` to `apps/web/.oxlintrc.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the existing Vite application and its current npm scripts.
- Produces: npm workspace `@fitpilot/web` with root scripts `web:dev`, `web:test`, `web:lint`, and `web:build`.

- [ ] **Step 1: Capture the baseline**

Run:

```powershell
git status --short --branch
git rev-parse origin/main
npm test
npm run lint
npm run build
```

Expected:

```text
Branch is feature/fullstack-foundation.
origin/main is 2dd3cbaa7d0357d6f016bca926d61686f9064af0.
Tests, lint, and build pass.
```

- [ ] **Step 2: Move the Web files with Git-aware operations**

Run:

```powershell
New-Item -ItemType Directory -Force apps/web | Out-Null
git mv src apps/web/src
git mv public apps/web/public
git mv test apps/web/test
git mv index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json apps/web/
git mv postcss.config.js tailwind.config.js .oxlintrc.json apps/web/
git mv package.json apps/web/package.json
```

Expected: `git status --short` shows renames, not delete/add pairs for the moved files.

- [ ] **Step 3: Change the Web package name and preserve its scripts**

Replace the first five fields of `apps/web/package.json` with:

```json
{
  "name": "@fitpilot/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "node --import ./test/register-loader.mjs --test test/*.test.ts",
    "lint": "oxlint",
    "preview": "vite preview"
  }
}
```

Keep the existing dependency and devDependency objects unchanged.

- [ ] **Step 4: Create the root workspace manifest**

Create `package.json` with:

```json
{
  "name": "fitpilot",
  "private": true,
  "version": "0.0.0",
  "workspaces": [
    "apps/web",
    "packages/api-client"
  ],
  "scripts": {
    "web:dev": "npm --workspace @fitpilot/web run dev",
    "web:test": "npm --workspace @fitpilot/web run test",
    "web:lint": "npm --workspace @fitpilot/web run lint",
    "web:build": "npm --workspace @fitpilot/web run build",
    "test": "npm run web:test",
    "lint": "npm run web:lint",
    "build": "npm run web:build"
  }
}
```

- [ ] **Step 5: Regenerate the workspace lockfile**

Run:

```powershell
npm install
```

Expected: root `package-lock.json` contains workspace entries for `apps/web`; installation completes without peer-dependency errors.

- [ ] **Step 6: Prove the move preserved behavior**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Expected: all commands pass; the Vite output is under `apps/web/dist`.

- [ ] **Step 7: Commit the mechanical move**

Run:

```powershell
git add package.json package-lock.json apps/web
git commit -m "chore: move web app into workspace"
```

Expected: one commit containing only the workspace move and manifest changes.

---

### Task 2: Add the FastAPI Runtime, PostgreSQL, and Health Checks

**Files:**
- Create: `apps/api/pyproject.toml`
- Create: `apps/api/app/__init__.py`
- Create: `apps/api/app/main.py`
- Create: `apps/api/app/core/__init__.py`
- Create: `apps/api/app/core/settings.py`
- Create: `apps/api/app/core/errors.py`
- Create: `apps/api/app/core/request_id.py`
- Create: `apps/api/app/db/__init__.py`
- Create: `apps/api/app/db/session.py`
- Create: `apps/api/app/core/health.py`
- Create: `apps/api/tests/conftest.py`
- Create: `apps/api/tests/test_health.py`
- Create: `apps/api/tests/test_errors.py`
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`
- Create: `infra/docker-compose.yml`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Consumes: root npm workspace from Task 1.
- Produces:
  - `app.main:create_app() -> FastAPI`
  - `app.core.settings:get_settings() -> Settings`
  - `app.db.session:get_session() -> AsyncIterator[AsyncSession]`
  - `ApiProblem(status_code, code, message)`
  - `GET /health/live`
  - `GET /health/ready`
  - one Compose command that starts Web, API, and PostgreSQL.

- [ ] **Step 1: Write failing health tests**

Create `apps/api/tests/test_health.py`:

```python
from httpx import ASGITransport, AsyncClient

from app.main import create_app


async def test_liveness_does_not_require_database() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_readiness_executes_database_probe(client: AsyncClient) -> None:
    response = await client.get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
```

Create `apps/api/tests/conftest.py` with a real test-database client:

```python
import os
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ.setdefault(
    "AUTH_SECRET",
    "fitpilot-test-secret-01234567890123456789",
)

from app.core.settings import get_settings
from app.main import create_app


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    get_settings.cache_clear()
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as test_client:
        yield test_client
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
Set-Location apps/api
python -m pytest tests/test_health.py -v
```

Expected: collection fails because `app.main` does not exist.

- [ ] **Step 3: Create the Python package manifest**

Create `apps/api/pyproject.toml`:

```toml
[build-system]
requires = ["hatchling>=1.27,<2"]
build-backend = "hatchling.build"

[project]
name = "fitpilot-api"
version = "0.1.0"
requires-python = ">=3.12,<3.13"
dependencies = [
  "alembic>=1.16,<2",
  "fastapi>=0.116,<1",
  "psycopg[binary]>=3.2,<4",
  "pydantic-settings>=2.10,<3",
  "pyjwt[crypto]>=2.10,<3",
  "sqlalchemy[asyncio]>=2.0,<2.1",
  "uvicorn[standard]>=0.35,<1",
]

[project.optional-dependencies]
dev = [
  "httpx>=0.28,<1",
  "mypy>=1.16,<2",
  "pytest>=8.4,<9",
  "pytest-asyncio>=1.0,<2",
  "ruff>=0.12,<1",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
pythonpath = ["."]

[tool.hatch.build.targets.wheel]
packages = ["app"]

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.mypy]
python_version = "3.12"
strict = true
plugins = ["pydantic.mypy"]
```

Install the editable package:

```powershell
python -m pip install -e ".[dev]"
```

Expected: installation succeeds under Python 3.12.

- [ ] **Step 4: Implement settings and the async session factory**

Create `apps/api/app/core/settings.py`:

```python
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_ENV = Path(__file__).resolve().parents[4] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_ENV,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "postgresql+psycopg://fitpilot:fitpilot@localhost:5432/fitpilot"
    web_origin: AnyHttpUrl = AnyHttpUrl("http://localhost:5173")
    auth_secret: str = Field(min_length=32)
    access_token_minutes: int = 15
    refresh_token_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Create `apps/api/app/db/session.py`:

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.settings import get_settings


settings = get_settings()
engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session
```

- [ ] **Step 5: Implement health routes and the app factory**

Create `apps/api/app/core/health.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session


router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def ready(session: AsyncSession = Depends(get_session)) -> dict[str, str]:
    await session.execute(text("SELECT 1"))
    return {"status": "ready"}
```

Create `apps/api/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.health import router as health_router
from app.core.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="FitPilot API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(settings.web_origin).rstrip("/")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health_router)
    return app


app = create_app()
```

- [ ] **Step 6: Add stable errors and request IDs**

Create `apps/api/app/core/errors.py`:

```python
from dataclasses import dataclass

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@dataclass
class ApiProblem(Exception):
    status_code: int
    code: str
    message: str


async def api_problem_handler(request: Request, exc: ApiProblem) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": request.state.request_id,
            }
        },
    )


async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "请求参数不正确",
                "request_id": request.state.request_id,
                "details": exc.errors(),
            }
        },
    )
```

Create `apps/api/app/core/request_id.py` with ASGI middleware that:

1. accepts a valid incoming `X-Request-Id` containing 1-100 visible ASCII
   characters, otherwise creates `str(uuid.uuid4())`;
2. stores it as `request.state.request_id`;
3. returns it in the `X-Request-Id` response header.

Register the middleware plus the `ApiProblem` and `RequestValidationError`
handlers in `create_app()`. Authentication and profile services raise
`ApiProblem` with stable codes; routers do not expose raw database or JWT
exceptions.

Create `apps/api/tests/test_errors.py` that adds a test-only route to a new app
instance:

```python
async def test_api_problem_uses_stable_envelope() -> None:
    app = create_app()

    @app.get("/problem")
    async def problem() -> None:
        raise ApiProblem(429, "RATE_LIMITED", "请求过于频繁")

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/problem", headers={"X-Request-Id": "test-request"})

    assert response.status_code == 429
    assert response.headers["X-Request-Id"] == "test-request"
    assert response.json() == {
        "error": {
            "code": "RATE_LIMITED",
            "message": "请求过于频繁",
            "request_id": "test-request",
        }
    }
```

- [ ] **Step 7: Add Compose and environment templates**

Create `.env.example`:

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://fitpilot:fitpilot@localhost:5432/fitpilot
TEST_DATABASE_URL=postgresql+psycopg://fitpilot:fitpilot@localhost:5433/fitpilot_test
WEB_ORIGIN=http://localhost:5173
AUTH_SECRET=fitpilot-development-secret-0123456789
```

Create `infra/docker-compose.yml` with services:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: fitpilot
      POSTGRES_USER: fitpilot
      POSTGRES_PASSWORD: fitpilot
    ports:
      - "5432:5432"
    volumes:
      - fitpilot_pg:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fitpilot -d fitpilot"]
      interval: 3s
      timeout: 3s
      retries: 20

  postgres-test:
    image: postgres:17-alpine
    profiles: ["test"]
    environment:
      POSTGRES_DB: fitpilot_test
      POSTGRES_USER: fitpilot
      POSTGRES_PASSWORD: fitpilot
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fitpilot -d fitpilot_test"]
      interval: 2s
      timeout: 2s
      retries: 20

  api:
    build: ../apps/api
    env_file: ../.env
    environment:
      DATABASE_URL: postgresql+psycopg://fitpilot:fitpilot@postgres:5432/fitpilot
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    environment:
      VITE_API_BASE_URL: http://localhost:8000/api/v1
    ports:
      - "5173:5173"
    depends_on:
      - api

volumes:
  fitpilot_pg:
```

Create `apps/api/Dockerfile`:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY pyproject.toml ./
COPY app ./app
RUN python -m pip install --no-cache-dir .

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:24-alpine

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @fitpilot/web --include-workspace-root

COPY apps/web apps/web
EXPOSE 5173
CMD ["npm", "--workspace", "@fitpilot/web", "run", "dev", "--", "--host", "0.0.0.0"]
```

When Task 6 introduces `@fitpilot/api-client`, update this Dockerfile to copy
`packages/api-client/package.json` before `npm ci` and
`packages/api-client/src` before the final command.

Append these ignores to `.gitignore`:

```gitignore
.env
.venv/
__pycache__/
.pytest_cache/
.mypy_cache/
.ruff_cache/
apps/api/*.db
```

- [ ] **Step 8: Start databases and run the tests**

Run:

```powershell
Copy-Item .env.example .env
docker compose -f infra/docker-compose.yml --profile test up -d postgres postgres-test
$env:AUTH_SECRET='development-secret-with-at-least-32-chars'
$env:TEST_DATABASE_URL='postgresql+psycopg://fitpilot:fitpilot@localhost:5433/fitpilot_test'
Set-Location apps/api
python -m pytest tests/test_health.py tests/test_errors.py -v
python -m ruff check .
python -m mypy app
```

Expected: both health tests pass; Ruff and MyPy report no errors.

- [ ] **Step 9: Commit the runtime foundation**

Run:

```powershell
git add .env.example .gitignore package.json apps/api apps/web/Dockerfile infra
git commit -m "feat: add FastAPI and PostgreSQL runtime"
```

---

### Task 3: Add Authentication and Profile Tables with Alembic

**Files:**
- Create: `apps/api/app/db/base.py`
- Create: `apps/api/app/auth/__init__.py`
- Create: `apps/api/app/auth/models.py`
- Create: `apps/api/app/profiles/__init__.py`
- Create: `apps/api/app/profiles/models.py`
- Create: `apps/api/alembic.ini`
- Create: `apps/api/alembic/env.py`
- Create: `apps/api/alembic/script.py.mako`
- Create: `apps/api/alembic/versions/20260724_01_create_identity_and_profile_tables.py`
- Create: `apps/api/tests/test_migrations.py`
- Modify: `apps/api/Dockerfile`

**Interfaces:**
- Produces SQLAlchemy models:
  - `User`
  - `AuthIdentity`
  - `PhoneVerificationCode`
  - `AuthSession`
  - `UserProfile`
- Produces an Alembic migration from an empty database to the complete first-slice schema.

- [ ] **Step 1: Write a failing migration test**

Create `apps/api/tests/test_migrations.py`:

```python
import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_upgrade_head_creates_first_slice_tables() -> None:
    sync_url = os.environ["TEST_DATABASE_URL"]
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", sync_url)

    command.downgrade(config, "base")
    command.upgrade(config, "head")

    tables = set(inspect(create_engine(sync_url)).get_table_names())
    assert {
        "users",
        "auth_identities",
        "phone_verification_codes",
        "auth_sessions",
        "user_profiles",
        "alembic_version",
    } <= tables
```

- [ ] **Step 2: Verify the migration test fails**

Run:

```powershell
Set-Location apps/api
python -m pytest tests/test_migrations.py -v
```

Expected: failure because `alembic.ini` and model metadata do not exist.

- [ ] **Step 3: Implement the declarative base**

Create `apps/api/app/db/base.py`:

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
```

- [ ] **Step 4: Implement the exact first-slice model contract**

Use these columns and constraints:

```text
users:
  id UUID PK
  status VARCHAR(20) NOT NULL DEFAULT 'active'
  deleted_at TIMESTAMPTZ NULL
  created_at, updated_at

auth_identities:
  id UUID PK
  user_id UUID FK users.id ON DELETE CASCADE
  provider VARCHAR(20) NOT NULL
  provider_subject VARCHAR(255) NOT NULL
  provider_metadata JSONB NOT NULL DEFAULT {}
  UNIQUE(provider, provider_subject)
  created_at, updated_at

phone_verification_codes:
  id UUID PK
  phone VARCHAR(20) NOT NULL
  purpose VARCHAR(20) NOT NULL
  code_hash VARCHAR(64) NOT NULL
  expires_at TIMESTAMPTZ NOT NULL
  attempt_count INTEGER NOT NULL DEFAULT 0
  used_at TIMESTAMPTZ NULL
  created_at, updated_at
  INDEX(phone, purpose, created_at)

auth_sessions:
  id UUID PK
  user_id UUID FK users.id ON DELETE CASCADE
  family_id UUID NOT NULL
  refresh_token_hash VARCHAR(64) UNIQUE NOT NULL
  expires_at TIMESTAMPTZ NOT NULL
  revoked_at TIMESTAMPTZ NULL
  replaced_by_id UUID FK auth_sessions.id NULL
  device_label VARCHAR(120) NULL
  last_used_at TIMESTAMPTZ NULL
  created_at, updated_at

user_profiles:
  user_id UUID PK FK users.id ON DELETE CASCADE
  gender VARCHAR(10) NOT NULL
  height_cm NUMERIC(5,2) NOT NULL
  weight_kg NUMERIC(5,2) NOT NULL
  age INTEGER NOT NULL
  goal VARCHAR(20) NOT NULL
  level VARCHAR(20) NOT NULL
  days_per_week INTEGER NOT NULL
  equipment VARCHAR(20) NOT NULL
  diet_pref VARCHAR(20) NOT NULL
  notes VARCHAR(500) NOT NULL DEFAULT ''
  target_calories INTEGER NOT NULL
  created_at, updated_at
```

Implement relationships only where the next task consumes them:

```python
class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    status: Mapped[str] = mapped_column(String(20), default="active")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    identities: Mapped[list["AuthIdentity"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list["AuthSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="AuthSession.user_id",
    )
```

Import all model modules at the bottom of `apps/api/app/db/base.py` so Alembic
receives one complete `Base.metadata`.

- [ ] **Step 5: Configure Alembic and generate the migration**

From `apps/api`, run:

```powershell
python -m alembic init alembic
python -m alembic revision --autogenerate -m "create identity and profile tables"
```

Edit `alembic/env.py` to use
`config.get_main_option("sqlalchemy.url") or get_settings().database_url` with
SQLAlchemy's sync `create_engine` path for migrations, and set:

```python
from app.db.base import Base

target_metadata = Base.metadata
```

Inspect the generated revision. It must create all five business tables,
ownership foreign keys, unique constraints, and the phone lookup index listed
above. It must not contain table drops.

- [ ] **Step 6: Run migration and model checks**

Update `apps/api/Dockerfile` so its final command runs the migration before the
local API process:

```dockerfile
COPY alembic.ini ./
COPY alembic ./alembic
CMD ["sh", "-c", "python -m alembic upgrade head && exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

Run:

```powershell
python -m alembic downgrade base
python -m alembic upgrade head
python -m pytest tests/test_migrations.py -v
python -m ruff check .
python -m mypy app
```

Expected: migration round trip and all static checks pass.

- [ ] **Step 7: Commit the schema**

Run:

```powershell
git add apps/api/app/db apps/api/app/auth apps/api/app/profiles apps/api/alembic apps/api/alembic.ini apps/api/tests/test_migrations.py
git commit -m "feat: add identity and profile schema"
```

---

### Task 4: Implement Development Phone Authentication and Rotating Sessions

**Files:**
- Create: `apps/api/app/auth/schemas.py`
- Create: `apps/api/app/auth/security.py`
- Create: `apps/api/app/auth/sms.py`
- Create: `apps/api/app/auth/service.py`
- Create: `apps/api/app/auth/dependencies.py`
- Create: `apps/api/app/auth/router.py`
- Create: `apps/api/tests/auth/test_sms_auth.py`
- Create: `apps/api/tests/auth/test_refresh_rotation.py`
- Modify: `apps/api/tests/conftest.py`
- Modify: `apps/api/app/main.py`
- Modify: `apps/api/app/core/settings.py`

**Interfaces:**
- Produces:
  - `request_sms_code(session, sender, phone, purpose) -> VerificationChallenge`
  - `verify_sms_code(session, challenge_id, code, device_label) -> TokenPair`
  - `rotate_refresh_token(session, raw_token) -> TokenPair`
  - `revoke_session(session, raw_token) -> None`
  - `get_current_user() -> User`
- HTTP:
  - `POST /api/v1/auth/sms/request`
  - `POST /api/v1/auth/sms/verify`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`

- [ ] **Step 1: Write failing authentication tests**

Create tests that prove these exact behaviors:

```python
async def test_request_code_never_returns_plain_code(
    client: AsyncClient,
    fake_sms: FakeSmsSender,
) -> None:
    response = await client.post(
        "/api/v1/auth/sms/request",
        json={"phone": "+8613800138000", "purpose": "login"},
    )

    assert response.status_code == 202
    assert set(response.json()) == {"verificationId", "expiresAt"}
    assert fake_sms.last_message.phone == "+8613800138000"
    assert len(fake_sms.last_message.code) == 6
    assert fake_sms.last_message.code not in response.text


async def test_verify_code_sets_http_only_refresh_cookie(
    client: AsyncClient,
    fake_sms: FakeSmsSender,
) -> None:
    challenge = await request_challenge(client, fake_sms)
    response = await client.post(
        "/api/v1/auth/sms/verify",
        json={
            "verificationId": challenge["verificationId"],
            "code": fake_sms.last_message.code,
            "deviceLabel": "pytest",
        },
    )

    assert response.status_code == 200
    assert response.json()["tokenType"] == "bearer"
    assert response.json()["expiresIn"] == 900
    assert "accessToken" in response.json()
    assert response.cookies["fitpilot_refresh"]
    assert "HttpOnly" in response.headers["set-cookie"]
```

Also test:

- wrong code increments attempts;
- the sixth attempt is rejected;
- a code older than 5 minutes is rejected;
- a used challenge cannot be reused;
- a second request inside 60 seconds returns HTTP 429;
- `/auth/me` rejects missing and malformed access tokens;
- `/auth/me` returns the current user's UUID for a valid token.

- [ ] **Step 2: Run tests and confirm red state**

Run:

```powershell
python -m pytest tests/auth -v
```

Expected: failures because auth routes and services do not exist.

- [ ] **Step 3: Implement security primitives**

Create `apps/api/app/auth/security.py` with these public signatures:

```python
def normalize_phone(value: str) -> str:
    """Return an E.164 phone number or raise ValueError."""


def generate_sms_code() -> str:
    """Return a zero-padded six-digit cryptographically secure code."""


def hash_sms_code(secret: str, challenge_id: UUID, code: str) -> str:
    """Return HMAC-SHA256(secret, challenge_id:code) as lowercase hex."""


def generate_refresh_token() -> str:
    """Return secrets.token_urlsafe(48)."""


def hash_refresh_token(raw_token: str) -> str:
    """Return SHA-256(raw_token) as lowercase hex."""


def create_access_token(
    *,
    secret: str,
    user_id: UUID,
    session_id: UUID,
    expires_at: datetime,
) -> str:
    """Return an HS256 JWT with sub, sid, iat, and exp claims."""
```

`normalize_phone` accepts only `^\+[1-9][0-9]{7,14}$`. It never guesses a
country code.

Add these internal service return types to `apps/api/app/auth/schemas.py`:

```python
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class VerificationChallenge:
    verification_id: UUID
    expires_at: datetime


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    expires_in: int = 900
```

- [ ] **Step 4: Implement the SMS adapter**

Create `apps/api/app/auth/sms.py`:

```python
from dataclasses import asdict, dataclass
import json
import logging
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True)
class SmsMessage:
    phone: str
    code: str
    purpose: str


class SmsSender(Protocol):
    async def send(self, message: SmsMessage) -> None:
        raise NotImplementedError


class DevelopmentSmsSender:
    def __init__(self, logger: logging.Logger) -> None:
        self._logger = logger

    async def send(self, message: SmsMessage) -> None:
        self._logger.warning(
            "development_sms_code phone=%s purpose=%s code=%s",
            message.phone,
            message.purpose,
            message.code,
        )


class FileSmsSender:
    def __init__(self, output_path: Path) -> None:
        self._output_path = output_path

    async def send(self, message: SmsMessage) -> None:
        payload = json.dumps(asdict(message), ensure_ascii=False)
        temporary = self._output_path.with_suffix(".tmp")
        temporary.write_text(payload + "\n", encoding="utf-8")
        temporary.replace(self._output_path)
```

Do not use `DevelopmentSmsSender` when `APP_ENV=production`; application startup
must fail until a production sender is configured. `FileSmsSender` is selected
only when `APP_ENV=test` and `TEST_SMS_OUTPUT_PATH` is non-empty. Add
`test_sms_output_path: Path | None = None` to `Settings`.

- [ ] **Step 5: Implement service transactions and refresh rotation**

Implement the service signatures from this task. Use `SELECT ... FOR UPDATE`
when consuming challenges and refresh sessions.

Verification transaction:

1. Lock the challenge.
2. Reject used, expired, or exhausted challenges.
3. Constant-time compare the expected HMAC.
4. Mark the challenge used.
5. Find or create `AuthIdentity(provider="phone")` and its `User`.
6. Create an `AuthSession` with a new `family_id`.
7. Commit once.

Refresh transaction:

1. Hash the cookie and lock its session row.
2. If the row was already revoked, revoke every row in its `family_id` and
   reject the request as `REFRESH_TOKEN_REUSED`.
3. Mark the current row revoked.
4. Create a replacement row in the same family.
5. Set `replaced_by_id` on the old row.
6. Commit once and return a new access/refresh pair.

- [ ] **Step 6: Implement HTTP schemas and cookie behavior**

Use camelCase API aliases:

```python
class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class SmsRequest(ApiModel):
    phone: str
    purpose: Literal["login"] = "login"


class SmsVerifyRequest(ApiModel):
    verification_id: UUID = Field(alias="verificationId")
    code: str = Field(pattern=r"^[0-9]{6}$")
    device_label: str | None = Field(default=None, alias="deviceLabel", max_length=120)


class AccessTokenResponse(ApiModel):
    access_token: str = Field(alias="accessToken")
    token_type: Literal["bearer"] = Field(default="bearer", alias="tokenType")
    expires_in: int = Field(default=900, alias="expiresIn")


class VerificationChallengeResponse(ApiModel):
    verification_id: UUID = Field(alias="verificationId")
    expires_at: datetime = Field(alias="expiresAt")


class CurrentUserResponse(ApiModel):
    id: UUID
```

Set refresh cookies with:

```python
response.set_cookie(
    key="fitpilot_refresh",
    value=token_pair.refresh_token,
    max_age=60 * 60 * 24 * settings.refresh_token_days,
    httponly=True,
    secure=settings.app_env == "production",
    samesite="lax",
    path="/api/v1/auth",
)
```

Clear the same cookie path during logout.

Update `apps/api/tests/conftest.py` with an app-scoped fake sender and reusable
login fixtures:

```python
class FakeSmsSender:
    last_message: SmsMessage | None = None

    async def send(self, message: SmsMessage) -> None:
        self.last_message = message


@pytest.fixture
def app() -> FastAPI:
    return create_app()


@pytest.fixture(autouse=True)
def fake_sms(app: FastAPI) -> Iterator[FakeSmsSender]:
    sender = FakeSmsSender()
    app.dependency_overrides[get_sms_sender] = lambda: sender
    yield sender
    app.dependency_overrides.clear()


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as test_client:
        yield test_client


async def login_headers(
    client: AsyncClient,
    fake_sms: FakeSmsSender,
    phone: str,
) -> dict[str, str]:
    challenge = await client.post(
        "/api/v1/auth/sms/request",
        json={"phone": phone, "purpose": "login"},
    )
    assert fake_sms.last_message is not None
    verified = await client.post(
        "/api/v1/auth/sms/verify",
        json={
            "verificationId": challenge.json()["verificationId"],
            "code": fake_sms.last_message.code,
        },
    )
    return {"Authorization": f"Bearer {verified.json()['accessToken']}"}
```

Add async fixtures `auth_headers`, `first_user_headers`, and
`second_user_headers` that call `login_headers` with `+8613800138000`,
`+8613800138001`, and `+8613800138002` respectively.

- [ ] **Step 7: Register routes and pass auth tests**

Register the auth router under `/api/v1/auth` in `create_app()`.

Run:

```powershell
python -m pytest tests/auth -v
python -m pytest -v
python -m ruff check .
python -m mypy app
```

Expected: all authentication, migration, and health tests pass.

- [ ] **Step 8: Commit authentication**

Run:

```powershell
git add apps/api/app/auth apps/api/app/core/settings.py apps/api/app/main.py apps/api/tests/auth
git commit -m "feat: add phone authentication"
```

---

### Task 5: Add the Authenticated Profile API

**Files:**
- Create: `apps/api/app/profiles/schemas.py`
- Create: `apps/api/app/profiles/service.py`
- Create: `apps/api/app/profiles/router.py`
- Create: `apps/api/tests/profiles/test_profile_api.py`
- Modify: `apps/api/app/main.py`

**Interfaces:**
- Produces:
  - `get_profile(session, user_id) -> UserProfile | None`
  - `upsert_profile(session, user_id, payload) -> UserProfile`
  - `GET /api/v1/profile`
  - `PUT /api/v1/profile`

- [ ] **Step 1: Write failing profile API tests**

Create `apps/api/tests/profiles/test_profile_api.py` with:

```python
PROFILE = {
    "gender": "male",
    "heightCm": 175,
    "weightKg": 75,
    "age": 28,
    "goal": "fatloss",
    "level": "beginner",
    "daysPerWeek": 4,
    "equipment": "dumbbell",
    "dietPref": "none",
    "notes": "膝盖不适，避免跳跃动作",
    "targetCalories": 2200,
}


async def test_profile_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/api/v1/profile")
    assert response.status_code == 401


async def test_put_then_get_profile(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    saved = await client.put("/api/v1/profile", json=PROFILE, headers=auth_headers)
    loaded = await client.get("/api/v1/profile", headers=auth_headers)

    assert saved.status_code == 200
    assert saved.json() == PROFILE
    assert loaded.json() == PROFILE


async def test_profiles_are_isolated(
    client: AsyncClient,
    first_user_headers: dict[str, str],
    second_user_headers: dict[str, str],
) -> None:
    await client.put("/api/v1/profile", json=PROFILE, headers=first_user_headers)
    response = await client.get("/api/v1/profile", headers=second_user_headers)

    assert response.status_code == 404
```

Add parameterized validation tests for:

```text
gender: male | female
heightCm: 100..250
weightKg: 30..350
age: 14..100
goal: fatloss | muscle | shape
level: beginner | intermediate | advanced
daysPerWeek: 1..7
equipment: bodyweight | dumbbell | gym
dietPref: none | halal | vegetarian
notes: 0..500 characters after preserving user-visible whitespace
targetCalories: 800..6000
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
python -m pytest tests/profiles/test_profile_api.py -v
```

Expected: 404 because profile routes do not exist.

- [ ] **Step 3: Implement strict request and response schemas**

Create `apps/api/app/profiles/schemas.py`:

```python
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProfilePayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    gender: Literal["male", "female"]
    height_cm: float = Field(alias="heightCm", ge=100, le=250)
    weight_kg: float = Field(alias="weightKg", ge=30, le=350)
    age: int = Field(ge=14, le=100)
    goal: Literal["fatloss", "muscle", "shape"]
    level: Literal["beginner", "intermediate", "advanced"]
    days_per_week: int = Field(alias="daysPerWeek", ge=1, le=7)
    equipment: Literal["bodyweight", "dumbbell", "gym"]
    diet_pref: Literal["none", "halal", "vegetarian"] = Field(alias="dietPref")
    notes: str = Field(default="", max_length=500)
    target_calories: int = Field(alias="targetCalories", ge=800, le=6000)
```

Use `ProfilePayload` for both PUT input and response, serialized with aliases.

- [ ] **Step 4: Implement ownership-scoped upsert**

`get_profile` selects only by `UserProfile.user_id == current_user.id`.

`upsert_profile` must:

1. Select the caller's row.
2. Create or update only that row.
3. Quantize height and weight to two decimal places before persistence.
4. Commit once.
5. Refresh and return the model.

No API accepts `user_id` in path, query, or body.

- [ ] **Step 5: Register routes and pass all API tests**

Register `profiles.router` under `/api/v1`.

Run:

```powershell
python -m pytest tests/profiles -v
python -m pytest -v
python -m ruff check .
python -m mypy app
```

Expected: all tests and static checks pass.

- [ ] **Step 6: Commit the profile API**

Run:

```powershell
git add apps/api/app/profiles apps/api/app/main.py apps/api/tests/profiles
git commit -m "feat: add authenticated profile API"
```

---

### Task 6: Generate the TypeScript Contract and Add the Web Auth Shell

**Files:**
- Create: `apps/api/scripts/export_openapi.py`
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/src/schema.d.ts`
- Create: `packages/api-client/src/client.ts`
- Create: `packages/api-client/src/index.ts`
- Create: `apps/web/src/auth/AuthProvider.tsx`
- Create: `apps/web/src/auth/LoginPage.tsx`
- Create: `apps/web/src/auth/useAuth.ts`
- Create: `apps/web/src/auth/AuthProvider.test.tsx`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/Dockerfile`
- Modify: `apps/web/package.json`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces:
  - `ApiClient`
  - `api.requestSms(phone) -> Promise<VerificationChallenge>`
  - `api.verifySms(verificationId, code) -> Promise<AccessTokenResponse>`
  - `api.refresh() -> Promise<AccessTokenResponse>`
  - `api.getMe() -> Promise<CurrentUser>`
  - `AuthProvider`
  - `useAuth()`

- [ ] **Step 1: Add failing Web auth tests**

Install test and query dependencies:

```powershell
npm install --workspace @fitpilot/web @tanstack/react-query
npm install --workspace @fitpilot/web --save-dev vitest jsdom @testing-library/react @testing-library/user-event
npm install --save-dev openapi-typescript
```

Add scripts to `apps/web/package.json`:

```json
{
  "test:unit": "vitest run",
  "test:legacy": "node --import ./test/register-loader.mjs --test test/*.test.ts",
  "test": "npm run test:legacy && npm run test:unit"
}
```

Write `AuthProvider.test.tsx` to prove:

- startup calls `/auth/refresh` with `credentials: "include"`;
- successful refresh loads `/auth/me`;
- failed refresh renders `LoginPage`;
- successful verification keeps the access token in provider state;
- a successful token response schedules refresh 60 seconds before expiry;
- logout clears provider state;
- the token is never written to `localStorage` or `sessionStorage`.

Run:

```powershell
npm run web:test
```

Expected: Vitest fails because `AuthProvider` does not exist.

- [ ] **Step 2: Export OpenAPI deterministically**

Create `apps/api/scripts/export_openapi.py`:

```python
import json
import os
from pathlib import Path

os.environ.setdefault(
    "AUTH_SECRET",
    "fitpilot-openapi-export-secret-0123456789",
)

from app.main import create_app


output = Path(__file__).parents[1] / "openapi.json"
output.write_text(
    json.dumps(create_app().openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
)
```

Create `packages/api-client/package.json`:

```json
{
  "name": "@fitpilot/api-client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": "./src/index.ts"
}
```

Add this workspace dependency to `apps/web/package.json`:

```json
{
  "dependencies": {
    "@fitpilot/api-client": "0.0.0"
  }
}
```

Update `apps/web/Dockerfile` dependency and source copy layers:

```dockerfile
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN npm ci --workspace @fitpilot/web --include-workspace-root

COPY apps/web apps/web
COPY packages/api-client/src packages/api-client/src
```

Run `npm install` at the repository root after adding the workspace package and
dependency so `package-lock.json` records the local link.

Add root scripts:

```json
{
  "api:openapi": "cd apps/api && python scripts/export_openapi.py",
  "api:types": "npm run api:openapi && openapi-typescript apps/api/openapi.json -o packages/api-client/src/schema.d.ts",
  "contract:check": "npm run api:types && git diff --exit-code -- apps/api/openapi.json packages/api-client/src/schema.d.ts"
}
```

Run:

```powershell
npm run api:types
```

Expected: `apps/api/openapi.json` and `packages/api-client/src/schema.d.ts` are generated.

- [ ] **Step 3: Implement the fetch client**

Create `packages/api-client/src/client.ts` with:

```typescript
export interface AccessTokenResponse {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
}

export interface VerificationChallenge {
  verificationId: string;
  expiresAt: string;
}

export interface CurrentUser {
  id: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class ApiClient {
  private accessToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        payload?.error?.code ?? 'HTTP_ERROR',
        payload?.error?.message ?? `HTTP ${response.status}`,
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  requestSms(phone: string): Promise<VerificationChallenge> {
    return this.request('/auth/sms/request', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose: 'login' }),
    });
  }

  verifySms(verificationId: string, code: string): Promise<AccessTokenResponse> {
    return this.request('/auth/sms/verify', {
      method: 'POST',
      body: JSON.stringify({ verificationId, code }),
    });
  }

  refresh(): Promise<AccessTokenResponse> {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  logout(): Promise<void> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  getMe(): Promise<CurrentUser> {
    return this.request('/auth/me');
  }
}
```

In `packages/api-client/src/index.ts`, export the client classes and bind
generated schema names without duplicating them:

```typescript
export { ApiClient, ApiError } from './client';
export type { paths, components } from './schema';
export type ProfilePayload = components['schemas']['ProfilePayload'];
```

Export one singleton configured from `import.meta.env.VITE_API_BASE_URL` in the
Web app, not inside the reusable package.

- [ ] **Step 4: Implement `AuthProvider`**

Provider state:

```typescript
interface AuthState {
  status: 'loading' | 'anonymous' | 'authenticated';
  user: { id: string } | null;
  requestCode(phone: string): Promise<{ verificationId: string; expiresAt: string }>;
  verifyCode(verificationId: string, code: string): Promise<void>;
  logout(): Promise<void>;
}
```

Startup behavior:

1. POST `/auth/refresh`.
2. On success, call `api.setAccessToken(accessToken)`.
3. GET `/auth/me`.
4. Set `authenticated`.
5. For 401, clear the token and set `anonymous`.
6. For network errors, render a retryable error state instead of pretending the
   user is logged out.
7. Schedule refresh at `max(30, expiresIn - 60)` seconds after every successful
   token response; replace the timer after each rotation and clear it on logout.

Do not read or write Web Storage in the auth module.

- [ ] **Step 5: Implement the two-step login page**

`LoginPage.tsx` contains:

1. E.164 phone input, prefilled with `+86`.
2. “获取验证码” action that displays the development instruction:
   `验证码已发送。开发环境请查看 API 控制台。`
3. Six-digit code input.
4. “登录” action.
5. Visible rate-limit, invalid-code, expired-code, and network errors.

Disable submit buttons during requests and keep only one request in flight.

- [ ] **Step 6: Wire authentication into the Web root**

Wrap the app in this order:

```tsx
<StrictMode>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
</StrictMode>
```

At the top of `App`:

```tsx
const { status } = useAuth();
if (status === 'loading') return <FullPageSpinner />;
if (status === 'anonymous') return <LoginPage />;
```

Keep the existing authenticated navigation and pages unchanged in this task.

- [ ] **Step 7: Run Web and contract verification**

Run:

```powershell
npm run api:types
npm run contract:check
npm run web:test
npm run web:lint
npm run web:build
```

Expected: generated contract is clean and all Web checks pass.

- [ ] **Step 8: Commit contract and auth shell**

Run:

```powershell
git add package.json package-lock.json apps/api/openapi.json apps/api/scripts packages/api-client apps/web
git commit -m "feat: add generated API client and web login"
```

---

### Task 7: Replace Web Profile `localStorage` with the Profile API

**Files:**
- Create: `apps/web/src/profile/profileApi.ts`
- Create: `apps/web/src/profile/useProfile.ts`
- Create: `apps/web/src/profile/useProfile.test.tsx`
- Modify: `apps/web/src/pages/ProfilePage.tsx:21`
- Modify: `apps/web/src/store.tsx:23`
- Modify: `apps/web/src/pages/WorkoutPage.tsx:8`
- Modify: `apps/web/src/pages/DietPage.tsx:23`
- Modify: `apps/web/src/pages/DashboardPage.tsx:77`
- Create: `apps/web/e2e/auth-profile.spec.ts`
- Create: `apps/web/playwright.config.ts`
- Create: `infra/docker-compose.e2e.yml`
- Modify: `.gitignore`
- Modify: `apps/web/package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: authenticated `ApiClient` and generated profile schema.
- Produces:
  - `useProfileQuery()`
  - `useSaveProfileMutation()`
  - authenticated Web flow with PostgreSQL-backed profile persistence.

- [ ] **Step 1: Write failing profile hook tests**

`useProfile.test.tsx` must prove:

```typescript
it('loads the profile from GET /profile instead of localStorage', async () => {
  localStorage.setItem('fitpilot:profile', JSON.stringify({ notes: 'stale' }));
  server.use(http.get('/api/v1/profile', () => HttpResponse.json(PROFILE)));

  const { result } = renderHook(() => useProfileQuery(), { wrapper });

  await waitFor(() => expect(result.current.data).toEqual(PROFILE));
  expect(result.current.data?.notes).toBe('膝盖不适，避免跳跃动作');
});

it('invalidates the profile query after PUT /profile', async () => {
  const { result } = renderHook(() => useSaveProfileMutation(), { wrapper });
  await act(() => result.current.mutateAsync(PROFILE));
  expect(queryClient.getQueryData(['profile'])).toEqual(PROFILE);
});
```

Use MSW for HTTP interception and add it as a Web dev dependency.

Run:

```powershell
npm run web:test
```

Expected: failure because profile hooks do not exist.

- [ ] **Step 2: Implement profile API hooks**

`profileApi.ts` exports:

```typescript
export function getProfile(): Promise<UserProfile>;
export function saveProfile(profile: UserProfile): Promise<UserProfile>;
```

`useProfile.ts` exports:

```typescript
export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: false,
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveProfile,
    onSuccess(profile) {
      queryClient.setQueryData(['profile'], profile);
    },
  });
}
```

Treat API 404 as `null` in `getProfile` so a new user sees the blank form.
Propagate all other errors.

- [ ] **Step 3: Migrate `ProfilePage`**

Replace `useApp().profile` and `setProfile` with the query and mutation hooks.

Required UI states:

- loading skeleton while GET is pending;
- default form when GET returns 404;
- save button disabled during PUT;
- success message only after PUT returns 200;
- server validation and network errors displayed near the save action;
- `notes` remains capped at 500 characters;
- `targetCalories` is calculated client-side for immediate preview and validated
  again by the API.

- [ ] **Step 4: Remove profile ownership from the legacy store**

Remove from `AppContextValue`, `AppProvider`, and its value:

```text
profile
setProfile
```

The remaining local store still owns workout plan, diet plan, check-ins, food
logs, body metrics, and the legacy AI settings until the next approved
implementation plan.

Update pages that read `profile` to use `useProfileQuery`. Until their backend
migration, they may consume the fetched profile while keeping their existing
local workout/diet/log state.

Do not change the Settings page in this slice. The server-owned AI follow-up
plan removes the legacy settings and direct browser model calls in the same
commit so the intermediate Web build never references a missing setting.

- [ ] **Step 5: Add the end-to-end authentication/profile test**

Install Playwright and add:

```json
{
  "e2e": "playwright test"
}
```

`auth-profile.spec.ts` must:

1. Open `/`.
2. Request a code for `+8613800138000`.
3. Read `apps/web/.e2e/last-sms.json` from the Playwright Node process.
4. Submit the code.
5. Fill every profile field and notes.
6. Save.
7. Reload.
8. Verify values came back.
9. Restart only the Web page, not PostgreSQL, and verify persistence again.

Use the `FileSmsSender` from `apps/api/app/auth/sms.py`. It implements the same
`SmsSender` protocol and atomically writes this exact shape:

```json
{
  "phone": "+8613800138000",
  "code": "123456",
  "purpose": "login"
}
```

The Compose E2E override sets `APP_ENV=test`, mounts `apps/web/.e2e` at
`/tmp/fitpilot-e2e`, and configures dependency injection to use
`TEST_SMS_OUTPUT_PATH=/tmp/fitpilot-e2e/last-sms.json`. Playwright deletes the file
before requesting a code and waits up to 5 seconds for it to appear. No
test-only HTTP route is included in any environment. Add `apps/web/.e2e/` to
`.gitignore`.

Create `infra/docker-compose.e2e.yml`:

```yaml
services:
  api:
    environment:
      APP_ENV: test
      TEST_SMS_OUTPUT_PATH: /tmp/fitpilot-e2e/last-sms.json
    volumes:
      - ../apps/web/.e2e:/tmp/fitpilot-e2e
```

- [ ] **Step 6: Document local operation**

Update `README.md` with exact commands:

```powershell
Copy-Item .env.example .env
docker compose -f infra/docker-compose.yml up --build
```

Document URLs:

```text
Web: http://localhost:5173
API docs: http://localhost:8000/docs
Liveness: http://localhost:8000/health/live
Readiness: http://localhost:8000/health/ready
```

State explicitly that this branch is local-only and does not replace the
GitHub Pages demo.

- [ ] **Step 7: Run the first-slice quality gate**

Run:

```powershell
docker compose -f infra/docker-compose.yml --profile test up -d postgres postgres-test
docker compose -f infra/docker-compose.yml -f infra/docker-compose.e2e.yml up -d --build --wait
Set-Location apps/api
python -m alembic upgrade head
python -m pytest -v
python -m ruff check .
python -m mypy app
Set-Location ../..
npm run contract:check
npm run web:test
npm run web:lint
npm run web:build
npm --workspace @fitpilot/web run e2e
docker compose -f infra/docker-compose.yml -f infra/docker-compose.e2e.yml down
git diff --check
git status --short
git rev-parse origin/main
```

Expected:

```text
All API, Web, contract, and E2E checks pass.
git diff --check has no output.
Only intentional first-slice files are modified.
origin/main remains 2dd3cbaa7d0357d6f016bca926d61686f9064af0.
```

- [ ] **Step 8: Commit the vertical slice**

Run:

```powershell
git add apps/web README.md package.json package-lock.json
git commit -m "feat: persist authenticated profiles"
```

- [ ] **Step 9: Verify the local branch without publishing**

Run:

```powershell
git status --short --branch
git log --oneline --decorate main..HEAD
git ls-remote --heads origin feature/fullstack-foundation
```

Expected:

```text
Working tree is clean.
Local branch contains the implementation commits.
The remote branch query returns no matching ref.
```

Do not run `git push`, `gh pr create`, a Pages deployment command, or a
production deployment command.

---

## First-Slice Completion Checklist

- [ ] Existing moved Web tests, lint, and build pass.
- [ ] `docker compose -f infra/docker-compose.yml up --build` starts Web, API, and PostgreSQL.
- [ ] `/health/live` and `/health/ready` return 200 under healthy conditions.
- [ ] Alembic upgrades an empty PostgreSQL database to head.
- [ ] The API never returns or persists a plain verification code.
- [ ] Phone verification creates a user and rotating session.
- [ ] Refresh tokens are HttpOnly and are rejected after reuse.
- [ ] The Web stores no access or refresh token in Web Storage.
- [ ] A new user can create and reload a PostgreSQL-backed profile.
- [ ] A second user cannot see the first user's profile.
- [ ] The 500-character notes field is persisted exactly and remains available to later AI work.
- [ ] OpenAPI and generated TypeScript types are synchronized.
- [ ] Legacy settings remain buildable until the server-owned AI follow-up removes them together with direct browser model calls.
- [ ] `origin/main` and the GitHub Pages deployment remain unchanged.

## Follow-Up Planning Boundaries

After this plan passes its completion checklist, create separate implementation
plans in this order:

1. Workout plans, diet plans, workout logs, food logs, and body metrics moved
   from the legacy store to PostgreSQL APIs.
2. Server-owned AI provider, PostgreSQL job worker, versioned workout/diet
   generation, prompt notes, idempotency, explicit provider errors, and removal
   of the legacy Settings/API-key UI.
3. Private file storage, image validation, food-recognition drafts, and user
   confirmation.
4. Account deletion, backup/restore checks, security hardening, production SMS
   adapter, and production deployment readiness.

Each follow-up plan begins from fresh evidence gathered after the previous
slice is complete. None of them authorizes a GitHub push, merge, Pages update,
or production deployment.
