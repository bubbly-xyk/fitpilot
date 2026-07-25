# Remove Demo Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the demo watermark and the complete Settings UI from FitPilot, then publish the revised Preview deployment.

**Architecture:** Keep the existing navigation-driven single-page structure and remove the obsolete leaf route from its shared navigation configuration and render switch. Preserve the startup cleanup for legacy browser settings because it has no visible UI and protects existing users.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Oxlint, Node test runner, GitHub, Vercel.

## Global Constraints

- Do not change the remaining navigation order or product functionality.
- Do not expose or commit model credentials.
- Keep the existing `feature/secure-model-proxy` branch and Draft PR.
- Deploy the result as Vercel Preview.

---

### Task 1: Remove Demo-Only UI

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/navConfig.tsx`
- Modify: `src/App.tsx`
- Delete: `src/pages/SettingsPage.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS` and `TabKey` from `src/components/navConfig.tsx`.
- Produces: navigation containing only dashboard, workout, diet, photo, library, and profile.

- [ ] Remove the sidebar footer block containing the local-data and Demo 2026 text.
- [ ] Remove the Settings icon import, `settings` union member, and navigation item.
- [ ] Remove the Settings page import and render branch from `App`.
- [ ] Delete the now-unreachable Settings page.
- [ ] Run `rg -n "Demo|2026|设置|SettingsPage|settings" src` and confirm only the intentional legacy storage cleanup may remain.

### Task 2: Verify and Publish

**Files:**
- Verify all changed frontend and deployment files.

**Interfaces:**
- Consumes: the revised Vite source tree.
- Produces: a GitHub commit and Ready Vercel Preview deployment.

- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Run the backend pytest, Ruff, and MyPy checks to guard the combined deployment.
- [ ] Run `git diff --check` and confirm `server/.env` is ignored.
- [ ] Commit and push `feature/secure-model-proxy`.
- [ ] Deploy with `vercel deploy . -y --target=preview` and inspect for `Ready`.
