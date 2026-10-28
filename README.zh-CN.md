# AgileFlow

[English](README.md) | 简体中文

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)
![License](https://img.shields.io/badge/License-Apache--2.0-blue)

AgileFlow 是一个连接 Jira、面向敏捷研发团队的实时协作平台。它把冲刺计划、Planning Poker、每日站会、回顾会议、Action Items、交付指标和团队激励整合到一个可自托管的 Web 应用中。

## 为什么选择 AgileFlow

- **减少工具切换。** 在计划和站会视图中直接使用 Jira Board 与 Sprint Issue。
- **实时协作。** 投票、进度更新、回顾房间、Emoji 互动和在线状态均通过 Socket.IO 实时同步。
- **形成改进闭环。** 将回顾结论转成 Action Items，并通过燃尽图、速率和交付周期观察执行效果。
- **支持自托管。** 一个 Node.js 服务同时提供 React 前端、API 和实时通信能力。
- **没有 Jira 也能体验。** 未配置 Jira 凭证时，系统会自动进入内置 Mock 数据模式。

## 功能

### 冲刺计划与 Planning Poker

- 查看即将开始的 Jira Sprint Issue。
- 使用 Fibonacci 牌面 `1, 2, 3, 5, 8, 13, 21` 共同估点。
- 投票阶段隐藏牌面，主持人揭晓后可以选择重新投票或保存共识点数。
- 将最终 Story Points 写回 Jira。
- 提供主持人控制、音效和揭晓动画等沉浸式牌桌体验。

### 每日站会

- 按负责人将当前 Sprint 展示为任务泳道。
- 从 Backlog 拖入任务、调整泳道顺序，并更新 `0` 到 `100` 的进度。
- 将状态流转和进度同步回 Jira。
- 支持计时、暂停、跳过、静音和语音播报。
- 按 Jira 用户组隔离 Board 数据。

### 回顾会议

- 创建或加入实时回顾房间。
- 支持 Start / Stop / Continue、Went Well / To Improve / Action、Mad / Sad / Glad 和 Timeline 模板。
- 按书写、审阅、投票、行动项和完成阶段推进会议。
- 支持匿名卡片、投票、计时、Emoji 互动和行动项负责人。

### Action Items 与团队洞察

- 将回顾会议中的改进项带入独立的拖拽式看板。
- 记录负责人、截止日期、描述和完成状态。
- 查看 Sprint 燃尽图、团队速率和交付周期。
- 根据 Jira 数据和回顾活动解锁团队及个人成就。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite、Tailwind CSS、Zustand、XState |
| 实时交互 | Socket.IO、`@dnd-kit` |
| 后端 | Node.js、Express、TypeScript |
| 集成 | Jira REST API、Jira Agile REST API |
| 持久化 | `data/` 目录下的本地 JSON 文件 |

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本

### 使用 Mock 数据运行

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

首次运行不需要创建 `.env`。未配置 `JIRA_BASE_URL` 时，AgileFlow 会自动使用内置的 Mock Board 和 Issue 数据。

### 连接真实 Jira

1. 创建本地环境变量文件：

   ```bash
   cp .env.example .env
   ```

2. 将占位值替换为你的 Jira 配置：

   ```dotenv
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-jira-api-token
   JIRA_BOARD_ID=1
   JIRA_PROGRESS_FIELD_ID=customfield_10207
   ```

3. 重启开发服务器。

Jira Cloud 用户可以在 [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens) 创建 API Token。Token 只在服务端使用，不应暴露给浏览器。

#### 环境变量

| 变量 | 是否必填 | 说明 |
| --- | --- | --- |
| `PORT` | 否 | HTTP 端口，默认 `3000`。 |
| `JIRA_BASE_URL` | 连接真实 Jira 时必填 | Jira 实例地址。留空时使用 Mock 模式。 |
| `JIRA_EMAIL` | 连接真实 Jira 时必填 | Jira Basic Authentication 使用的邮箱或用户名。 |
| `JIRA_API_TOKEN` | 连接真实 Jira 时必填 | Jira API Token；不同 Jira 版本也可使用密码。 |
| `JIRA_BOARD_ID` | 否 | 请求未指定 Board 时使用的默认 Board ID。 |
| `JIRA_PROGRESS_FIELD_ID` | 否 | 保存 `0` 到 `100` 进度的数值型自定义字段，默认 `customfield_10207`。 |

当前实现还假定：

- Story Points 保存在 `customfield_10106`。
- Pending 状态保存在 `customfield_10208`。
- Jira 工作流转换可映射到 `new`、`indeterminate` 和 `done` 状态分类。

生产使用前，请确认这些字段 ID 和状态转换与你的 Jira 项目配置一致。

## 生产构建

```bash
npm install
npm run build
npm start
```

Express 服务会同时提供 API 和 `dist/` 中的前端静态资源。可通过 `PORT` 修改监听端口。

### 部署注意事项

- 如果应用需要从可信网络之外访问，请使用 HTTPS，并放在反向代理之后。
- 当前登录流程只在浏览器中创建用户名身份，**不是完整的认证系统**。公开部署前应增加认证或使用认证代理。
- 回顾会议、Action Items 和成就数据保存在 `data/` 下的 JSON 文件中。
- 请为 `data/` 挂载持久化存储并定期备份。本地文件存储更适合单实例部署。
- 不要提交 `.env` 或运行时数据文件，它们已被 Git 忽略。

## 项目结构

```text
src/                   React 应用与 Zustand Store
server/                Express API、Jira 集成、Socket.IO 和文件存储
shared/                前后端共享 TypeScript 类型
data/                  运行时 JSON 数据（已被 Git 忽略）
server.ts              应用入口
.env.example           环境变量模板
```

## 开发

```bash
npm run lint
npm run build
```

同时启动前后端开发服务：

```bash
npm run dev
```

## 参与贡献

欢迎参与贡献。对于较大的改动，建议先创建 Issue 讨论方案。提交 Pull Request 前请运行 `npm run lint` 和 `npm run build`，并确保没有提交凭证或运行时数据。

## 许可证

AgileFlow 使用 [Apache License 2.0](LICENSE) 许可证。
