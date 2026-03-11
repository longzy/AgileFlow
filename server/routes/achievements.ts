import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { Server } from "socket.io";

export default function achievementRoutes(io: Server) {
  const router = Router();
  const DATA_PATH = path.join(process.cwd(), "data", "achievements.json");

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
      
      const data = await fs.readFile(DATA_PATH, "utf-8");
      let allData = JSON.parse(data);
      
      // Migration: If it's an array or old group format (array per group)
      if (Array.isArray(allData)) {
        allData = { [group]: { team: allData.filter((a: any) => a.scope === 'team'), personal: {} } };
        await fs.writeFile(DATA_PATH, JSON.stringify(allData, null, 2));
      } else if (allData[group] && Array.isArray(allData[group])) {
        allData[group] = { 
          team: allData[group].filter((a: any) => a.scope === 'team'), 
          personal: {} 
        };
        await fs.writeFile(DATA_PATH, JSON.stringify(allData, null, 2));
      }

      if (!allData[group]) {
        allData[group] = { team: getTeamTemplates(), personal: {} };
        await fs.writeFile(DATA_PATH, JSON.stringify(allData, null, 2));
      }

      const groupData = allData[group];
      const teamAchievements = groupData.team || [];
      
      let userPersonal = [];
      if (userId) {
        if (!groupData.personal[userId]) {
          groupData.personal[userId] = getPersonalTemplates();
          await fs.writeFile(DATA_PATH, JSON.stringify(allData, null, 2));
        }
        userPersonal = groupData.personal[userId];
      }
      
      res.json([...teamAchievements, ...userPersonal]);
    } catch (error) {
      console.error("Error reading achievements:", error);
      res.status(500).json({ error: "Failed to load achievements" });
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
        
        await fs.writeFile(DATA_PATH, JSON.stringify(allData, null, 2));
        res.json(achievement);
      } else {
        res.status(404).json({ error: "Achievement not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update achievement" });
    }
  });

  return router;
}
