# FitPilot Vercel 演示部署设计

日期：2026-07-25

## 目标

把当前 `feature/secure-model-proxy` 分支同步到 GitHub，并发布一个可在其他
手机和电脑访问的 Vercel 演示站点。网页、认证和 AI API 使用同一域名；
DeepSeek 与 DashScope Key 只存储在 Vercel 环境变量中。

## 架构

使用单个 Vercel 项目：

- Vite 构建到 `dist/`，由 Vercel 静态托管。
- `api/index.py` 导出已有 FastAPI `app`，成为一个 Python Function。
- `vercel.json` 将 `/api/*` 重写到该 Function，浏览器 URL 保持不变。
- `requirements.txt` 在项目根声明 Python Function 运行依赖。
- FastAPI 从 `VERCEL_URL` / `VERCEL_BRANCH_URL` 自动加入当前 Vercel
  域名，继续严格校验 `Origin`。

## 安全与环境变量

- `.env` 不上传、不提交。
- `MODEL_API_KEY`、`VISION_MODEL_API_KEY`、`SESSION_SECRET` 在 Vercel
  标记为 Sensitive。
- 线上使用新的随机 `DEMO_ACCESS_PASSWORD` 和 `SESSION_SECRET`。
- `APP_ENV=production`，Cookie 启用 `Secure + HttpOnly + SameSite=Strict`。
- Vercel 多实例下进程内限流是演示级尽力限制，不视为全局配额。

## GitHub 与发布

- 保持当前分支 `feature/secure-model-proxy`。
- 提交部署适配后推送到 `origin`，针对 `main` 创建 Draft PR。
- 使用 Vercel CLI 发布 Preview deployment；Preview 环境变量只在
  Vercel 项目中配置。

## 验收

- Web 测试、lint、build 通过。
- 后端 pytest、Ruff、MyPy 通过。
- `vercel build` 成功识别 Vite 静态产物与 Python Function。
- GitHub 分支和 Draft PR 可见。
- Vercel 返回可公开访问的 HTTPS Preview URL。
