# AgileFlow - 敏捷开发实时协作平台

AgileFlow 是一个专为敏捷团队设计的实时协作工具，集成了 Planning Poker（估点）和 Daily Standup（每日站会）功能。它支持与 Jira 双向同步，让团队协作更加高效、透明。

## ✨ 主要特性

- **Planning Poker (估点)**
  - 实时多人在线估点
  - 经典的 Fibonacci 序列 (1, 2, 3, 5, 8, 13, 21)
  - 自动计算共识，支持一键回写 Story Points 到 Jira
  - 沉浸式的拟物化牌桌体验

- **Daily Standup (站会)**
  - 可视化的任务泳道图
  - 拖拽式进度更新 (To Do -> In Progress -> Done)
  - 实时同步团队成员的操作
  - 支持按 Board 隔离，多团队互不干扰

- **Jira 集成**
  - 自动拉取当前活跃 Sprint 的 Issue
  - 实时同步 Issue 状态和 Story Points
  - 支持自定义进度字段 (0-100%)

## 🛠 技术栈

- **前端**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **状态管理**: Zustand
- **拖拽交互**: @dnd-kit/core
- **后端**: Node.js, Express
- **实时通信**: Socket.IO
- **构建工具**: Vite

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 18
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

填入你的 Jira 配置信息（如果需要连接真实 Jira）：

```env
# Jira 配置 (可选，不填则使用 Mock 数据)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_BOARD_ID=1
JIRA_PROGRESS_FIELD_ID=customfield_10207
```

> **提示**: 如果不配置 Jira 环境变量，系统将自动使用内置的 Mock 数据模式，方便本地开发和演示。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可看到应用。

## 📦 部署说明

本项目支持标准的 Node.js 部署流程，也可以轻松部署到 Docker 容器中。

### 标准部署

1. **构建前端资源**:
   ```bash
   npm run build
   ```
   这将生成 `dist` 目录，包含所有静态资源。

2. **启动生产服务器**:
   ```bash
   npm start
   ```
   服务器将运行在 `3000` 端口。

### Docker 部署

```dockerfile
# 示例 Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔌 Jira 配置指南

要启用 Jira 集成，你需要：

1. **获取 API Token**:
   - 访问 [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - 创建一个新的 Token 并复制。

2. **获取 Board ID**:
   - 在 Jira 中打开你的 Board。
   - URL 中的 `rapidView=123` 或 `board/123` 中的数字即为 Board ID。

3. **配置进度字段 (可选)**:
   - 如果你想同步 0-100% 的精确进度，需要在 Jira 中创建一个 "Number" 类型的自定义字段。
   - 获取该字段的 ID (例如 `customfield_10017`) 并填入环境变量。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

Apache-2.0
