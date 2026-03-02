import express from "express";
import { updateIssueProgress, getBoards, getBoardData } from "../services/jira";
import { config } from "../config";

const router = express.Router();

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
  
  try {
    const data = await getBoardData(boardId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board data" });
  }
});

export default router;
