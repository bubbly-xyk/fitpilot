# FitPilot AI 中文约束与微信兼容设计

日期：2026-07-25

## 目标

让食物识别结果稳定使用简体中文，让饮食计划把备注中的忌口和其他要求作为硬约束，并让较旧的微信内置浏览器可以启动应用而不是白屏。

## AI 输出约束

- 食物识别的 `food` 与 `portion` 必须使用简体中文；营养数字字段保持数值。
- 饮食计划中的餐次名、食物名和份量必须使用简体中文。
- 用户备注中的忌口、过敏、宗教限制和其他明确饮食要求是硬约束。
- 饮食计划的食材、配料和调味品都不得包含被限制内容；无法确认安全时必须替换。
- 备注仍作为不可信用户数据隔离，不能覆盖系统指令或 JSON 结构。

## 微信兼容

- 使用 Vite 官方 `@vitejs/plugin-legacy` 生成旧版语法、SystemJS 回退和按需 polyfill。
- 兼容目标使用插件默认的广泛浏览器范围并排除 IE 11；重点覆盖旧版 Android 微信 WebView 和 iOS WKWebView。
- 在 `index.html` 的根节点内提供无需 JavaScript 的启动提示。JavaScript 正常运行时 React 会替换该内容；启动失败时用户仍能看到操作建议，不再只有白屏。
- 如果手机网络本身无法连接 `vercel.app`，前端兼容构建无法解决，需要绑定可访问的自有域名；当前“HTML 白屏且没有会话请求”的证据优先指向 JavaScript 兼容问题。

## 验收

- 提示词测试证明中文输出要求和饮食硬约束存在。
- 前端测试、lint 与带 legacy chunk 的生产构建通过。
- 构建后的 `dist/index.html` 同时包含 module 与 nomodule/legacy 启动入口。
- 后端 pytest、Ruff 和 MyPy 通过。
- GitHub 功能分支和现有 Draft PR 更新。
- Vercel Production 状态为 Ready，真实登录接口返回 204。
