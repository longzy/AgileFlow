import { Router } from "express";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { Server } from "socket.io";

export default function achievementRoutes(io: Server) {
  const router = Router();
  const DATA_DIR = path.join(process.cwd(), "data");
  const DATA_PATH = path.join(DATA_DIR, "achievements.json");
  
  console.log(`[Achievements] Data directory is set to: ${DATA_DIR}`);
  console.log(`[Achievements] Data file path is set to: ${DATA_PATH}`);
  
  // Ensure data directory exists
  if (!fsSync.existsSync(DATA_DIR)) {
    console.log(`[Achievements] Creating data directory: ${DATA_DIR}`);
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Simple lock to prevent concurrent writes
  let writeQueue = Promise.resolve();
  const safeWrite = async (data: any) => {
    writeQueue = writeQueue
      .then(async () => {
        try {
          // Ensure directory exists right before writing, just in case
          if (!fsSync.existsSync(DATA_DIR)) {
            fsSync.mkdirSync(DATA_DIR, { recursive: true });
          }
          await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
          console.log(`Successfully wrote to ${DATA_PATH}`);
        } catch (err) {
          console.error(`Failed to write to ${DATA_PATH}:`, err);
        }
      })
      .catch((err) => {
        console.error("Write queue error:", err);
      });
    return writeQueue;
  };

  const getPersonalTemplates = () => [
    {
      "id": "bug-hunter-1",
      "title": "金牌灭虫师 I",
      "description": "个人累计修复 Bug 数量达到 50 个。",
      "level": "bronze",
      "icon": "Bug",
      "achieved": false,
      "progress": 0,
      "target": 50,
      "category": "quality",
      "scope": "personal"
    },
    {
      "id": "bug-hunter-3",
      "title": "代码质检大师",
      "description": "个人累计修复 Bug 数量达到 500 个。",
      "level": "gold",
      "icon": "Bug",
      "achieved": false,
      "progress": 0,
      "target": 500,
      "category": "quality",
      "scope": "personal"
    },
    {
      "id": "vibe-master",
      "title": "团队活力先锋",
      "description": "在回顾环节中个人累计发送超过 1000 个互动表情。",
      "level": "bronze",
      "icon": "Smile",
      "achieved": false,
      "progress": 0,
      "target": 1000,
      "category": "culture",
      "scope": "personal"
    }
  ];

  const getTeamTemplates = () => [
    {
      "id": "on-time-streak-1",
      "title": "准时交付方阵 I",
      "description": "全队连续 3 个冲刺达成 100% 交付。",
      "level": "bronze",
      "icon": "Zap",
      "achieved": false,
      "progress": 0,
      "target": 3,
      "category": "delivery",
      "scope": "team"
    },
    {
      "id": "zero-bug-week",
      "title": "无暇代码堡垒",
      "description": "全队整整一周没有产生任何新的 Bug 报告。",
      "level": "gold",
      "icon": "ShieldCheck",
      "achieved": false,
      "progress": 0,
      "target": 7,
      "category": "quality",
      "scope": "team"
    },
    {
      "id": "velocity-boost-1",
      "title": "极速冲刺军团 I",
      "description": "全队当前冲刺总估点数比上个冲刺提升 10% 以上。",
      "level": "bronze",
      "icon": "TrendingUp",
      "achieved": false,
      "progress": 0,
      "target": 10,
      "category": "delivery",
      "scope": "team"
    }
  ];

  router.get("/", async (req, res) => {
    try {
      const group = req.query.group as string || "default";
      const userId = req.query.userId as string;
      
      console.log(`Fetching achievements for group: ${group}, userId: ${userId}`);
      let data = "{}";
      try {
        data = await fs.readFile(DATA_PATH, "utf-8");
      } catch (e) {
        console.log("Achievements file missing, initializing...");
        await safeWrite({});
      }
      
      if (!data || data.trim() === "") data = "{}";
      let allData = JSON.parse(data);
      let changed = false;
      
      // Migration: If it's an array or old group format (array per group)
      if (Array.isArray(allData)) {
        console.log("Migrating old array format...");
        allData = { [group]: { team: allData.filter((a: any) => a.scope === 'team'), personal: {} } };
        changed = true;
      } else if (allData[group] && Array.isArray(allData[group])) {
        console.log(`Migrating old group format for ${group}...`);
        allData[group] = { 
          team: allData[group].filter((a: any) => a.scope === 'team'), 
          personal: {} 
        };
        changed = true;
      }

      if (!allData[group]) {
        console.log(`Initializing new group: ${group}`);
        allData[group] = { team: getTeamTemplates(), personal: {} };
        changed = true;
      }

      const groupData = allData[group];
      if (!groupData.personal) {
        groupData.personal = {};
        changed = true;
      }

      const teamAchievements = groupData.team || [];
      
      let userPersonal = [];
      if (userId) {
        if (!groupData.personal[userId]) {
          console.log(`Initializing personal achievements for user: ${userId}`);
          groupData.personal[userId] = getPersonalTemplates();
          changed = true;
        }
        userPersonal = groupData.personal[userId];
      }
      
      if (changed) {
        await safeWrite(allData);
      }
      
      console.log(`Returning ${teamAchievements.length} team and ${userPersonal.length} personal achievements`);
      res.json([...teamAchievements, ...userPersonal]);
    } catch (error: any) {
      console.error("Error reading achievements:", error);
      res.status(500).json({ 
        error: "Failed to load achievements", 
        details: error.message
      });
    }
  });

  // Endpoint to update progress
  router.post("/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const group = req.query.group as string || "default";
      const userId = req.query.userId as string;
      
      const data = await fs.readFile(DATA_PATH, "utf-8");
      const allData = JSON.parse(data);
      const groupData = allData[group];
      
      if (!groupData) return res.status(404).json({ error: "Group not found" });
      if (!groupData.personal) groupData.personal = {};

      // Search in team first
      let achievement = groupData.team.find((a: any) => a.id === id);
      let isPersonal = false;

      // If not in team and userId provided, search in user's personal
      if (!achievement && userId && groupData.personal[userId]) {
        achievement = groupData.personal[userId].find((a: any) => a.id === id);
        isPersonal = true;
      }

      if (achievement) {
        const wasAchieved = achievement.achieved;
        achievement.progress = progress;
        
        if (progress >= achievement.target && !wasAchieved) {
          achievement.achieved = true;
          achievement.achievedDate = new Date().toISOString().split('T')[0];
          
          // Emit socket event for real-time celebration
          io.emit("achievement_unlocked", { ...achievement, group, userId: isPersonal ? userId : undefined });
        }
        
        await safeWrite(allData);
        res.json(achievement);
      } else {
        res.status(404).json({ error: "Achievement not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update achievement", details: error.message });
    }
  });

  return router;
}
