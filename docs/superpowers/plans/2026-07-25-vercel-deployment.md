# FitPilot Vercel Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the secure FitPilot Web and FastAPI demo from one Vercel project and synchronize the implementation branch to GitHub.

**Architecture:** Vercel serves the Vite `dist` output and routes `/api/*` to one Python Function that re-exports the existing FastAPI application. Runtime secrets live only in Vercel Preview environment variables, and allowed origins include the automatic Vercel deployment URLs.

**Tech Stack:** Vite 8, React 19, FastAPI, Python 3.12, Vercel CLI, GitHub CLI.

## Global Constraints

- Never commit or print values from `server/.env`.
- Deploy as Vercel Preview, not production.
- Keep `feature/secure-model-proxy`; do not merge `main`.
- Create a Draft PR targeting `main`.
- Use a new random online demo password and session secret.
- Preserve exact-origin checks and secure production cookies.

---

### Task 1: Add Vercel Runtime Entry Point

**Files:**
- Create: `api/index.py`
- Create: `requirements.txt`
- Create: `vercel.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `server/app/main.py:app`.
- Produces: Vercel Python Function at the `/api/*` public route.

- [ ] Create `api/index.py` that prepends `server/` to `sys.path` and imports
  `app.main:app`.
- [ ] Add root Python dependencies matching `server/pyproject.toml`.
- [ ] Configure `npm run build`, `dist`, the Python runtime, and an `/api/*`
  rewrite in `vercel.json`.
- [ ] Ignore `.vercel/`.
- [ ] Run `vercel build` and require a successful static and Python build.

### Task 2: Support Automatic Vercel Origins

**Files:**
- Modify: `server/app/core/settings.py`
- Modify: `server/app/core/request_context.py`
- Modify: `server/app/main.py`
- Test: `server/tests/test_app_security.py`

**Interfaces:**
- Produces: `Settings.allowed_origins -> list[str]`.
- Consumes: `ALLOWED_ORIGIN`, `VERCEL_URL`, and `VERCEL_BRANCH_URL`.

- [ ] Add a failing test where `ALLOWED_ORIGIN` is absent and
  `VERCEL_URL=fitpilot-preview.vercel.app`.
- [ ] Verify requests from `https://fitpilot-preview.vercel.app` pass and
  another Origin returns `ORIGIN_NOT_ALLOWED`.
- [ ] Make `RequestContextMiddleware` accept a frozen set of exact origins.
- [ ] Use the same list for credentialed CORS.
- [ ] Run backend pytest, Ruff, and MyPy.

### Task 3: Verify and Commit Deployment Adaptation

**Files:**
- Modify: `README.md`
- Create: deployment design and plan documents.

- [ ] Document that Preview secrets live in Vercel and rate limits are
  process-local.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, backend pytest, Ruff,
  MyPy, `git diff --check`, and a client-secret scan.
- [ ] Commit only deployment code and documentation.

### Task 4: Publish GitHub Branch and Draft PR

- [ ] Push `feature/secure-model-proxy` to `origin` with upstream tracking.
- [ ] Create a Draft PR to `main` describing the secure proxy, Vercel adapter,
  and verification evidence.
- [ ] Record the branch and PR URL.

### Task 5: Configure Vercel and Deploy Preview

- [ ] Link or create the Vercel project from the repository root.
- [ ] Copy non-secret provider names and URLs from `server/.env`.
- [ ] Stream API keys from `server/.env` into Vercel Preview Sensitive
  variables without placing them in command arguments or output.
- [ ] Generate and stream a random online demo password and session secret.
- [ ] Add `APP_ENV=production`, `SESSION_HOURS=8`, and
  `ALLOW_INSECURE_MODEL_URLS=false`.
- [ ] Run `vercel deploy . -y` with a ten-minute timeout.
- [ ] Report the Preview URL and the generated demo password.
