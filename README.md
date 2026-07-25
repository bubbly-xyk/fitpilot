# FitPilot

FitPilot 是一款 AI 智能健身搭子，可生成训练与饮食计划、记录训练，
并通过图片识别辅助估算食物营养。

## 本地运行

需要 Node.js 24 和 Python 3.12。

首次配置后端：

```powershell
Copy-Item server\.env.example server\.env
Set-Location server
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
Set-Location ..
```

编辑 `server\.env`，填入服务端模型配置、至少 32 个字符的演示访问密码
和会话密钥。真实密钥只能放在该文件中，不要放进前端代码或提交到 Git。

启动 API：

```powershell
.\server\run.ps1
```

另开一个终端启动 Web：

```powershell
npm install
npm run dev
```

打开 `http://localhost:5173`，输入 `DEMO_ACCESS_PASSWORD` 后使用。
Vite 会把同源 `/api` 请求代理到 `http://127.0.0.1:8000`。

## 安全边界

- 浏览器不保存模型 API Key、上游地址或模型名称。
- API 只提供训练计划、饮食计划和食物识别三种固定业务接口。
- 演示版限流与会话控制保存在单个 API 进程内。
- 多实例或生产部署前，必须使用共享存储实现全局限流和会话撤销，
  并通过同站 HTTPS 反向代理发布 Web 与 `/api`。

## 验证

```powershell
npm test
npm run lint
npm run build

Set-Location server
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m mypy app
```

## Vercel 预览部署

仓库根目录已经包含 Vite 静态站点和 FastAPI Python Function 的 Vercel 配置。
部署时在 Vercel 的 Preview 环境配置 `server/.env.example` 中列出的模型变量，
并额外设置 `APP_ENV=production`、`DEMO_ACCESS_PASSWORD` 和 `SESSION_SECRET`。
`VERCEL_URL` 与 `VERCEL_BRANCH_URL` 由平台自动注入，后端只接受这些同源地址。

当前演示版的登录限流保存在单个 Function 实例内，只能作为尽力而为的保护；
如果对公网长期开放，应改用 Redis 等共享存储实现全局限流。
