import express from "express";
import { updateIssueProgress, updateIssuePoints, getBoards, getBoardData, updateIssueStatus, updateIssuePendingStatus, getGroupMembers, assignIssue, updateIssueResolution, getGroups, getMetricsData } from "./index";
import { config } from "../../core/config";

const router = express.Router();

// Get Groups
router.get("/groups", async (req, res) => {
  try {
    const query = req.query.query as string || '';
    const groups = await getGroups(query);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Get Project Users (Fetches from specified group, defaults to '软件部门')
router.get("/board/:boardId/users", async (req, res) => {
  // const { boardId } = req.params; // We ignore boardId as per requirement
  try {
    const group = req.query.group as string || '软件部门';
    const users = await getGroupMembers(group);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch group members" });
  }
});

// Assign Issue
router.post("/issue/:issueId/assignee", async (req, res) => {
  const { issueId } = req.params;
  const { userId } = req.body;

  try {
    await assignIssue(issueId, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign issue" });
  }
});

// Update Issue Resolution
router.post("/issue/:issueId/resolution", async (req, res) => {
  const { issueId } = req.params;
  const { resolutionId } = req.body;

  try {
    await updateIssueResolution(issueId, resolutionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Jira issue resolution" });
  }
});

// Update Issue Pending Status
router.post("/issue/:issueId/pending", async (req, res) => {
  const { issueId } = req.params;
  const { isPending } = req.body;

  try {
    await updateIssuePendingStatus(issueId, isPending);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Jira issue pending status" });
  }
});

// Update Issue Status
router.post("/issue/:issueId/status", async (req, res) => {
  const { issueId } = req.params;
  const { statusCategory } = req.body;

  try {
    const result = await updateIssueStatus(issueId, statusCategory);
    if (!result.success) {
      return res.status(400).json({ error: (result as any).error || (result as any).warning || "Failed to update status" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Jira issue status" });
  }
});

// Update Issue Points
router.post("/issue/:issueId/points", async (req, res) => {
  const { issueId } = req.params;
  const { points } = req.body;

  try {
    await updateIssuePoints(issueId, points);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Jira issue points" });
  }
});

// Update Issue Progress
router.post("/issue/:issueId/progress", async (req, res) => {
  const { issueId } = req.params;
  const { progress } = req.body;

  try {
    await updateIssueProgress(issueId, progress);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Jira issue" });
  }
});

// Get Boards
router.get("/boards", async (req, res) => {
  try {
    const data = await getBoards();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// Get Board Data
router.get("/board-data", async (req, res) => {
  const boardId = req.query.boardId as string || config.JIRA.BOARD_ID;
  const state = req.query.state as string || 'active';
  
  try {
    const data = await getBoardData(boardId, state);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board data" });
  }
});

// Get Metrics Data
router.get("/board/:boardId/metrics", async (req, res) => {
  const { boardId } = req.params;
  try {
    const data = await getMetricsData(boardId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch metrics data" });
  }
});

export default router;
