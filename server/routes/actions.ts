import { Router } from "express";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { Server } from "socket.io";

export default function actionRoutes(io: Server) {
  const router = Router();
  const DATA_DIR = path.join(process.cwd(), "data");
  const DATA_PATH = path.join(DATA_DIR, "action_items.json");
  
  // Ensure data directory exists
  if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
  }

  let writeQueue = Promise.resolve();
  const safeWrite = async (data: any) => {
    writeQueue = writeQueue
      .then(async () => {
        try {
          if (!fsSync.existsSync(DATA_DIR)) {
            fsSync.mkdirSync(DATA_DIR, { recursive: true });
          }
          await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
        } catch (err) {
          console.error(`Failed to write to ${DATA_PATH}:`, err);
        }
      })
      .catch((err) => console.error("Write queue error:", err));
    return writeQueue;
  };

  const readData = async () => {
    try {
      const data = await fs.readFile(DATA_PATH, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  };

  // Get action items for a group
  router.get("/", async (req, res) => {
    try {
      const group = req.query.group as string || "default";
      const allData = await readData();
      const groupActions = allData[group] || [];
      res.json(groupActions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load action items", details: error.message });
    }
  });

  // Save new action items (from Retro)
  router.post("/", async (req, res) => {
    try {
      const group = req.query.group as string || "default";
      const { actionItems } = req.body;
      
      if (!Array.isArray(actionItems)) {
        return res.status(400).json({ error: "actionItems must be an array" });
      }

      const allData = await readData();
      if (!allData[group]) {
        allData[group] = [];
      }

      // Add timestamp and group info to each action item if needed
      const newItems = actionItems.map(item => ({
        ...item,
        createdAt: Date.now(),
        groupId: group
      }));

      // Append new items
      allData[group] = [...allData[group], ...newItems];
      
      await safeWrite(allData);
      
      // Broadcast update
      io.emit("actions_updated", { group });
      
      res.json({ success: true, count: newItems.length });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to save action items", details: error.message });
    }
  });

  // Update a specific action item
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const group = req.query.group as string || "default";
      const updates = req.body;

      const allData = await readData();
      if (!allData[group]) {
        return res.status(404).json({ error: "Group not found" });
      }

      const itemIndex = allData[group].findIndex((item: any) => item.id === id);
      if (itemIndex === -1) {
        return res.status(404).json({ error: "Action item not found" });
      }

      allData[group][itemIndex] = { ...allData[group][itemIndex], ...updates };
      
      await safeWrite(allData);
      
      // Broadcast update
      io.emit("actions_updated", { group });
      
      res.json(allData[group][itemIndex]);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update action item", details: error.message });
    }
  });

  return router;
}
