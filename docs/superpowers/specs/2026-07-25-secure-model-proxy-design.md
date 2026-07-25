# FitPilot 安全模型代理设计

日期：2026-07-25

## 目标

将 FitPilot 现有的浏览器直连模型 API 改为服务端代理：

- 模型密钥、上游地址和模型名称只由服务端环境变量提供。
- 网页不再展示或保存 API Key、Base URL、模型名称。
- 网页完成一次演示密码认证后，可直接生成训练计划、饮食计划和识别食物。
- 限制公开演示站点被批量调用、跨站调用、发送任意提示词或利用代理访问任意地址。

本次只修改 `D:\work\bak\fitpilot`，不推送或部署原 GitHub 仓库。

## 方案选择

采用 Python 3.12 + FastAPI 的任务型 Backend for Frontend，而不是通用
OpenAI-compatible 转发接口。

任务型接口只接受业务数据，由后端生成受控提示词：

- `POST /api/v1/ai/workout-plan`
- `POST /api/v1/ai/diet-plan`
- `POST /api/v1/ai/recognize-food`

客户端不能提交上游 URL、模型名称、API Key、system prompt 或任意 messages。
这样可同时减少密钥泄露、SSRF、任意模型调用和额度滥用风险。

## 组件和数据流

```text
React/Vite 网页
  -> POST /api/v1/auth/login（演示访问密码）
  <- Secure + HttpOnly + SameSite=Strict 会话 Cookie
  -> 固定的 AI 业务接口
FastAPI
  -> 校验 Origin、会话、限流、并发、请求大小和业务字段
  -> 在服务端构建提示词
  -> 使用环境变量指定的模型和上游地址
模型供应商
  -> 返回结果
FastAPI
  -> 校验、裁剪并返回业务响应
```

生产部署要求网页和 API 使用同一站点，通过反向代理将 `/api` 转发到
FastAPI。开发环境由 Vite 将 `/api` 代理到本地 FastAPI。

## 环境变量

后端读取以下变量：

```dotenv
MODEL_API_KEY=
MODEL_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-chat

VISION_MODEL_API_KEY=
VISION_MODEL_BASE_URL=
VISION_MODEL_NAME=

DEMO_ACCESS_PASSWORD=
SESSION_SECRET=
ALLOWED_ORIGIN=http://localhost:5173
APP_ENV=development
```

规则：

- 文本模型三个变量必须完整配置。
- 视觉模型变量为空时，图片识别接口返回“未配置视觉模型”，不自动使用
  不支持视觉的文本模型。
- Base URL 由启动配置读取和验证，任何请求体都不能覆盖。
- `DEMO_ACCESS_PASSWORD` 和 `SESSION_SECRET` 最少 32 个字符。
- `.env` 必须被 Git 忽略；仓库只提交不含真实密钥的 `.env.example`。

## 认证和会话

`POST /api/v1/auth/login` 接收演示访问密码。后端使用
`secrets.compare_digest` 做恒定时间比较。

认证成功后签发短期签名会话，写入 Cookie：

- `HttpOnly`
- 生产环境 `Secure`
- `SameSite=Strict`
- 仅限 `/api`
- 默认有效期 8 小时

提供 `POST /api/v1/auth/logout` 清除会话。认证失败只返回统一错误，不暴露
密码长度、匹配位置或服务端配置状态。

前端新增轻量访问密码页面。密码只用于当前登录请求，不写入 localStorage、
sessionStorage 或日志。

## 安全边界

### 上游和提示词

- 上游域名和模型只能来自环境变量。
- 启动时只接受 `https://` 上游；开发环境可显式允许本地地址。
- 后端只暴露三个固定业务接口，不提供通用 `/chat/completions` 代理。
- 用户备注作为业务字段进入受控模板，不能覆盖 system prompt 或响应格式。
- 模型响应必须通过对应业务 schema 校验后才返回客户端。

### 请求限制

- 登录：每 IP 每 5 分钟最多 5 次失败尝试。
- AI：每 IP 和每会话每分钟最多 10 次请求。
- 每会话最多 2 个并发模型请求。
- 普通 JSON 请求最大 64 KiB。
- 图片 Data URL 解码后最大 5 MiB，只接受允许的图片 MIME 类型。
- 上游连接与响应总超时 45 秒。
- 上游响应读取上限 2 MiB。

单机演示使用进程内限流器。多实例部署前必须将限流和会话撤销状态迁移到
Redis，不能把单机额度当作全局额度。

### 浏览器和网络

- 只允许 `ALLOWED_ORIGIN`，不使用通配 CORS。
- 所有改变状态或消耗额度的请求校验 `Origin`。
- 生产反向代理启用 HTTPS。
- API 响应包含 CSP、HSTS、`X-Content-Type-Options: nosniff`、
  `Referrer-Policy` 和禁止嵌入页面的策略。

### 日志和错误

- 日志只记录 request ID、接口、状态、耗时和限流结果。
- 不记录密码、API Key、Authorization、Cookie、完整 Prompt、图片或模型
  原始响应。
- 上游错误转换为稳定的内部错误码；客户端不接收上游响应头、完整响应体或
  堆栈。

## 前端改造

- 删除设置页中的文本和视觉模型配置表单。
- 删除浏览器持久化的模型 API Key、Base URL 和模型名称。
- 设置页保留时，只展示“AI 服务由管理员在服务端配置”的只读状态；也可以从
  导航中移除。本次选择保留只读状态，避免现有导航和演示流程突变。
- `generateWorkoutPlan`、`generateDietPlan` 和 `recognizeFood` 改为调用同源
  `/api/v1/ai/*`。
- 用户资料与备注仍从现有前端状态传入，后端在固定模板中使用。
- 401 时回到访问密码页；429 显示稍后再试；上游不可用显示脱敏错误。

## 后端结构

```text
server/
  app/
    main.py
    core/
      settings.py
      errors.py
      security_headers.py
    auth/
      router.py
      session.py
      rate_limit.py
    ai/
      router.py
      schemas.py
      prompts.py
      client.py
  tests/
  pyproject.toml
  .env.example
```

各模块职责：

- `settings.py`：验证环境变量和允许的上游 URL。
- `session.py`：签发、验证演示会话，不接触模型逻辑。
- `rate_limit.py`：登录、请求和并发限制。
- `prompts.py`：唯一的提示词生成入口，保留用户备注安全约束。
- `client.py`：唯一可读取模型密钥并访问上游的模块。
- `router.py`：只做认证、校验、调用和错误映射。

## 测试策略

后端测试：

- 正确和错误密码、Cookie 安全属性、登出。
- 未认证、过期或篡改会话访问 AI 接口返回 401。
- 登录爆破、IP/会话请求限流和并发限制返回 429。
- 非允许 Origin、超大 JSON、超大图片和非法 MIME 被拒绝。
- 请求体无法覆盖上游 URL、模型或 system prompt。
- 用户备注进入训练和饮食提示词，但不能改变结构化输出要求。
- 上游超时、超大响应和恶意错误内容被安全映射。
- API Key、密码和完整提示词不会出现在响应或捕获日志中。

前端测试：

- 登录密码不写入 Web Storage。
- 设置页不出现 API Key、Base URL 和模型输入框。
- 三个 AI 功能调用对应同源业务接口。
- 401、429 和模型不可用错误显示正确。

验收命令：

```powershell
npm test
npm run lint
npm run build
python -m pytest
python -m ruff check .
python -m mypy .
```

## 非目标

- 本次不实现正式用户注册、手机号短信、计费或多租户配额。
- 本次不实现 Redis；多实例部署前再增加。
- 本次不把模型 API Key 保存到 PostgreSQL 或任何浏览器存储。
- 本次不提供客户端自定义模型、上游地址或任意 Prompt 的能力。
