# AgileFlow

[English](README.md) | [简体中文](README.zh-CN.md)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)
![License](https://img.shields.io/badge/License-Apache--2.0-blue)

AgileFlow is a Jira-connected, real-time collaboration workspace for Agile software teams. It brings sprint planning, Planning Poker, daily standups, retrospectives, action tracking, delivery metrics, and team recognition into one self-hostable application.

## Why AgileFlow

- **Keep the ceremony, skip the tab switching.** Work with Jira boards and sprint issues directly inside planning and standup views.
- **Collaborate in real time.** Live voting, progress updates, retrospective rooms, emojis, and presence are powered by Socket.IO.
- **Close the feedback loop.** Turn retrospective outcomes into Action Items and track delivery with burndown, velocity, and cycle-time charts.
- **Run it yourself.** The application ships as one Node.js service with a React frontend and local JSON persistence.
- **Try it without Jira.** When Jira credentials are absent, AgileFlow automatically uses built-in mock data.

## Features

### Sprint planning and Planning Poker

- Browse issues from an upcoming Jira sprint.
- Estimate issues together with the Fibonacci deck `1, 2, 3, 5, 8, 13, 21`.
- Hide votes until the host reveals them, then reset the round or save the consensus estimate.
- Write the agreed Story Points back to Jira.
- Add a playful card-table experience with host controls, sounds, and celebrations.

### Daily standup

- View the active sprint as swimlanes grouped by assignee.
- Drag issues from the backlog, reorder swimlanes, and update progress from `0` to `100`.
- Sync status transitions and progress back to Jira.
- Run a timed standup with pause, skip, mute, and voice announcements.
- Scope the board data by Jira group.

### Retrospectives

- Create or join a live retrospective room.
- Choose from Start / Stop / Continue, Went Well / To Improve / Action, Mad / Sad / Glad, and Timeline templates.
- Move through writing, review, voting, action, and completion stages.
- Support anonymous cards, voting, timers, emoji reactions, and action ownership.

### Action Items and team insights

- Carry retrospective actions into a dedicated drag-and-drop board.
- Track owners, due dates, descriptions, and completion status.
- Review sprint burndown, velocity, and cycle time.
- Unlock team and personal achievements from Jira and retrospective activity.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, XState |
| Real-time UI | Socket.IO, `@dnd-kit` |
| Backend | Node.js, Express, TypeScript |
| Integration | Jira REST API and Jira Agile REST API |
| Persistence | Local JSON files in `data/` |

## Quick start

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Run locally with mock data

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No `.env` file is required for a first run. AgileFlow uses built-in mock boards and issues when `JIRA_BASE_URL` is not configured.

### Connect a real Jira instance

1. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

2. Replace the placeholder values with your Jira details:

   ```dotenv
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-jira-api-token
   JIRA_BOARD_ID=1
   JIRA_PROGRESS_FIELD_ID=customfield_10207
   ```

3. Restart the development server.

Jira Cloud users can create an API token from [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens). The token is used only by the server and should never be exposed to the browser.

#### Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port. Defaults to `3000`. |
| `JIRA_BASE_URL` | For live Jira | Jira instance URL. Leave empty for mock mode. |
| `JIRA_EMAIL` | For live Jira | Email or username used for Jira basic authentication. |
| `JIRA_API_TOKEN` | For live Jira | Jira API token or password, depending on your Jira edition. |
| `JIRA_BOARD_ID` | No | Fallback board ID when a request does not specify one. |
| `JIRA_PROGRESS_FIELD_ID` | No | Numeric custom field used for `0` to `100` progress. Defaults to `customfield_10207`. |

The current implementation also assumes:

- Story Points are stored in `customfield_10106`.
- The pending flag is stored in `customfield_10208`.
- Jira workflow transitions are available in the `new`, `indeterminate`, and `done` status categories.

Verify these field IDs and transitions against your Jira project before production use.

## Production build

```bash
npm install
npm run build
npm start
```

The Express server serves both the API and the compiled frontend from `dist/`. Set `PORT` to choose a different listening port.

### Deployment notes

- Use HTTPS and place AgileFlow behind a reverse proxy when it is reachable outside a trusted network.
- The current sign-in flow creates a display-name identity in the browser. It is **not** an authentication system; use an auth proxy or add authentication before exposing the app publicly.
- Retrospectives, Action Items, and achievements are stored in JSON files under `data/`.
- Mount `data/` on persistent storage and back it up. The local file store is best suited to a single instance.
- Do not commit `.env` or runtime data files. Both are ignored by Git.

## Project structure

```text
src/                   React application and Zustand stores
server/                Express API, Jira integration, Socket.IO, and file storage
shared/                Shared TypeScript contracts
data/                  Runtime JSON data (ignored by Git)
server.ts              Application entry point
.env.example           Environment variable template
```

## Development

```bash
npm run lint
npm run build
```

For frontend and backend development together, use:

```bash
npm run dev
```

## Contributing

Contributions are welcome. For non-trivial changes, open an issue first so the approach can be discussed. Please keep pull requests focused, run `npm run lint` and `npm run build`, and avoid committing credentials or runtime data.

## License

AgileFlow is available under the [Apache License 2.0](LICENSE).
