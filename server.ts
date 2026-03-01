import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // --- Socket.IO Logic ---
  const rooms = new Map(); // roomId -> { votes: [], revealed: false, consensus: null }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { votes: [], revealed: false, consensus: null });
      }
      // Send current state to user
      socket.emit("room_state", rooms.get(roomId));
    });

    socket.on("join_board", (boardId) => {
      const roomName = `board:${boardId}`;
      socket.join(roomName);
      console.log(`User ${socket.id} joined board ${boardId}`);
    });

    socket.on("leave_board", (boardId) => {
      const roomName = `board:${boardId}`;
      socket.leave(roomName);
      console.log(`User ${socket.id} left board ${boardId}`);
    });

    socket.on("update_issue", ({ boardId, issue }) => {
      const roomName = `board:${boardId}`;
      // Broadcast to everyone in the board room EXCEPT the sender
      socket.to(roomName).emit("issue_updated", issue);
    });

    socket.on("vote", ({ roomId, userId, points }) => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      
      // Update or add vote
      const existingVoteIndex = room.votes.findIndex((v: any) => v.userId === userId);
      if (existingVoteIndex >= 0) {
        room.votes[existingVoteIndex].points = points;
      } else {
        room.votes.push({ userId, points });
      }
      
      io.to(roomId).emit("room_state", room);
    });

    socket.on("reveal", (roomId) => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      room.revealed = true;
      
      // Calculate consensus
      const points = room.votes.map((v: any) => v.points);
      const uniquePoints = new Set(points);
      if (uniquePoints.size === 1 && points.length > 0) {
        room.consensus = points[0];
      } else {
        room.consensus = null;
      }

      io.to(roomId).emit("room_state", room);
    });

    socket.on("reset", (roomId) => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      room.votes = [];
      room.revealed = false;
      room.consensus = null;
      io.to(roomId).emit("room_state", room);
    });
    
    // Sync user presence (simple version)
    socket.on("user_joined", (user) => {
      socket.broadcast.emit("user_joined_broadcast", user);
    });
  });

  // Jira API Proxy
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_BOARD_ID = process.env.JIRA_BOARD_ID || '1';
  // Custom field ID for progress (0-100). User needs to create this in Jira.
  // Example: customfield_10017
  const JIRA_PROGRESS_FIELD_ID = process.env.JIRA_PROGRESS_FIELD_ID || 'customfield_10017';

  const getJiraHeaders = () => {
    if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
      throw new Error("Missing Jira credentials");
    }
    return {
      'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  };

  // Update Issue Progress
  app.post("/api/jira/issue/:issueId/progress", async (req, res) => {
    const { issueId } = req.params;
    const { progress } = req.body;

    if (!JIRA_BASE_URL) {
      console.log(`[Mock] Updating issue ${issueId} progress to ${progress}%`);
      return res.json({ success: true });
    }

    try {
      // 1. Update the custom field
      const updateBody = {
        fields: {
          [JIRA_PROGRESS_FIELD_ID]: progress
        }
      };

      const updateRes = await fetch(`${JIRA_BASE_URL}/rest/api/2/issue/${issueId}`, {
        method: 'PUT',
        headers: getJiraHeaders(),
        body: JSON.stringify(updateBody)
      });

      if (!updateRes.ok) {
        throw new Error(`Failed to update progress: ${updateRes.statusText}`);
      }

      // 2. (Optional) Auto-transition status based on progress
      // This requires knowing the transition IDs, which varies by workflow.
      // For simplicity, we'll skip auto-transitioning status in this demo,
      // but in a real app you'd fetch available transitions and POST to /transitions.

      res.json({ success: true });
    } catch (error) {
      console.error("Jira Update Error:", error);
      res.status(500).json({ error: "Failed to update Jira issue" });
    }
  });

  // Get Boards
  app.get("/api/jira/boards", async (req, res) => {
    if (!JIRA_BASE_URL) {
      return res.json({
        boards: [
          { id: '1', name: 'Agile Board', type: 'scrum' },
          { id: '2', name: 'Design Board', type: 'kanban' },
          { id: '3', name: 'Backend Board', type: 'scrum' },
        ]
      });
    }

    try {
      const response = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/board`, {
        headers: getJiraHeaders()
      });
      const data = await response.json();
      
      const boards = (data.values || []).map((b: any) => ({
        id: b.id.toString(),
        name: b.name,
        type: b.type
      }));

      res.json({ boards });
    } catch (error) {
      console.error("Jira Boards Error:", error);
      res.status(500).json({ error: "Failed to fetch boards" });
    }
  });

  app.get("/api/jira/board-data", async (req, res) => {
    const boardId = req.query.boardId as string || JIRA_BOARD_ID;
    
    if (!JIRA_BASE_URL) {
      // Return mock data in dev or if not configured
      return res.json({
        sprint: {
          id: 's1',
          name: 'Sprint 42',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        },
        issues: [
          { id: 'i1', key: 'PROJ-101', summary: 'Implement Login Page', status: 'todo', estimated: false, assigneeId: 'u1', progress: 0 },
          { id: 'i2', key: 'PROJ-102', summary: 'Database Schema Design', status: 'todo', estimated: false, assigneeId: 'u2', progress: 0 },
          { id: 'i3', key: 'PROJ-103', summary: 'User API Endpoint', status: 'in-progress', estimated: true, storyPoints: 5, assigneeId: 'u3', progress: 50 },
          { id: 'i4', key: 'PROJ-104', summary: 'Landing Page Design', status: 'in-progress', estimated: true, storyPoints: 3, assigneeId: 'u4', progress: 50 },
          { id: 'i5', key: 'PROJ-105', summary: 'Unit Tests for Auth', status: 'done', estimated: true, storyPoints: 2, assigneeId: 'u1', progress: 100 },
        ],
        users: [
          { id: 'u1', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
          { id: 'u2', name: 'Sarah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
          { id: 'u3', name: 'Mike', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
          { id: 'u4', name: 'Emma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
        ]
      });
    }

    try {
      // Fetch active sprint
      const sprintRes = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?state=active`, {
        headers: getJiraHeaders()
      });
      const sprintData = await sprintRes.json();
      const activeSprint = sprintData.values?.[0];

      // Fetch sprint issues
      let issuesData = { values: [] };
      if (activeSprint) {
        const issuesRes = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/sprint/${activeSprint.id}/issue`, {
          headers: getJiraHeaders()
        });
        issuesData = await issuesRes.json();
      }

      // Map Jira issues to our format
      const mapJiraIssue = (issue: any, status: string) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: status, // Map Jira status to our status
        estimated: !!issue.fields.customfield_10016, // Story points field (customfield_10016 is common, but varies)
        storyPoints: issue.fields.customfield_10016,
        assigneeId: issue.fields.assignee?.accountId,
      });

      // Extract unique users
      const usersMap = new Map();
      const processUser = (user: any) => {
        if (user && !usersMap.has(user.accountId)) {
          usersMap.set(user.accountId, {
            id: user.accountId,
            name: user.displayName,
            avatar: user.avatarUrls?.['48x48'] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.displayName)}`
          });
        }
      };

      const allIssues = (issuesData.values || []).map((i: any) => {
        processUser(i.fields.assignee);
        const statusCategory = i.fields.status?.statusCategory?.key;
        let mappedStatus = 'todo';
        
        // Default progress based on status
        let progress = 0;
        if (statusCategory === 'indeterminate') {
          mappedStatus = 'in-progress';
          progress = 50;
        }
        if (statusCategory === 'done') {
          mappedStatus = 'done';
          progress = 100;
        }

        // Override with custom field if available
        if (i.fields[JIRA_PROGRESS_FIELD_ID] !== undefined && i.fields[JIRA_PROGRESS_FIELD_ID] !== null) {
          progress = Number(i.fields[JIRA_PROGRESS_FIELD_ID]);
        }

        return { ...mapJiraIssue(i, mappedStatus), progress };
      });

      res.json({
        sprint: activeSprint ? {
          id: activeSprint.id.toString(),
          name: activeSprint.name,
          startDate: activeSprint.startDate,
          endDate: activeSprint.endDate,
          isActive: true,
        } : null,
        issues: allIssues,
        users: Array.from(usersMap.values())
      });

    } catch (error) {
      console.error("Jira API Error:", error);
      res.status(500).json({ error: "Failed to fetch from Jira" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
