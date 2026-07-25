# AI Localization and Mobile Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce Chinese AI food output, honor dietary restrictions as hard constraints, and ship a legacy-compatible build for WeChat mobile browsers.

**Architecture:** Strengthen the existing task-specific server prompts without changing response schemas. Use Vite's official legacy build path for older WebViews, and keep an HTML-only boot message visible whenever JavaScript cannot start.

**Tech Stack:** FastAPI, pytest, DeepSeek-compatible chat completion, Qwen vision, React 19, Vite 8, `@vitejs/plugin-legacy`, Node test runner, Vercel.

## Global Constraints

- Preserve the existing JSON response schemas and same-origin API routes.
- Keep user notes isolated as untrusted data.
- Do not expose or commit model credentials.
- Keep `feature/secure-model-proxy` and update Draft PR #3.
- Publish the verified result to the stable Production alias.

---

### Task 1: Lock Chinese and Dietary Prompt Requirements

**Files:**
- Modify: `server/tests/ai/test_prompts.py`
- Modify: `server/app/ai/prompts.py`

**Interfaces:**
- Consumes: `UserProfile.notes`, `UserProfile.diet_pref`, and image data URLs.
- Produces: `diet_messages(profile)` and `food_messages(image_data_url)` with explicit language and dietary constraints.

- [ ] Add a failing food prompt test asserting that all string values, especially `food` and `portion`, must be simplified Chinese.
- [ ] Add a failing diet prompt test with `notes="花生过敏，不吃海鲜"` asserting that restrictions are hard constraints covering ingredients, additions, and seasoning.
- [ ] Run only `server/tests/ai/test_prompts.py` and confirm both new tests fail.
- [ ] Strengthen `food_messages` and `diet_messages` with the exact requirements.
- [ ] Re-run the prompt tests and confirm they pass.

### Task 2: Add WeChat-Compatible Production Bundles

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `index.html`

**Interfaces:**
- Consumes: the existing React entry module.
- Produces: modern module chunks, legacy SystemJS chunks, polyfills, and an HTML boot fallback.

- [ ] Install the Vite 8-compatible official `@vitejs/plugin-legacy` development dependency.
- [ ] Configure `legacy({ targets: ["defaults", "not IE 11"] })`.
- [ ] Add an inline-styled fallback inside `#root` explaining that FitPilot is loading and recommending the system browser or a WeChat upgrade if it remains visible.
- [ ] Run `npm run build`.
- [ ] Verify `dist/index.html` contains both modern module scripts and legacy `nomodule` scripts.

### Task 3: Verify, Publish, and Exercise Production

**Files:**
- Verify all changed source, test, lock, and deployment files.

**Interfaces:**
- Consumes: the complete repository source and configured Vercel secrets.
- Produces: an updated GitHub branch, Draft PR, and stable Production deployment.

- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Run backend pytest, Ruff, and MyPy.
- [ ] Run `git diff --check`, confirm `server/.env` is ignored, and scan deployable files for credential-shaped values.
- [ ] Commit and push `feature/secure-model-proxy`.
- [ ] Deploy Production with the existing runtime secrets and stable allowed origin.
- [ ] Inspect the stable alias for `Ready`.
- [ ] Exercise `/api/v1/auth/login` with the demo password and require HTTP 204.
