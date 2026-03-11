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
    },
    {
      "id": "accurate-estimator",
      "title": "神准估算师",
      "description": "连续 3 个 Sprint 个人交付点数与承诺点数误差小于 10%。",
      "level": "gold",
      "icon": "Target",
      "achieved": false,
      "progress": 0,
      "target": 1,
      "category": "planning",
      "scope": "personal"
    },
    {
      "id": "bug-terminator",
      "title": "Bug 终结者",
      "description": "在当前 Sprint 修复了最多高优先级 Bug。",
      "level": "silver",
      "icon": "ShieldAlert",
      "achieved": false,
      "progress": 0,
      "target": 1,
      "category": "quality",
      "scope": "personal"
    },
    {
      "id": "firefighter",
      "title": "救火队长",
      "description": "在 Sprint 中途插入的紧急任务中贡献最大。",
      "level": "bronze",
      "icon": "Flame",
      "achieved": false,
      "progress": 0,
      "target": 1,
      "category": "delivery",
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

  // Endpoint to evaluate automatic achievements based on Jira data
  router.post("/evaluate", async (req, res) => {
    try {
      const { issues, sprint } = req.body;
      const group = req.query.group as string || "default";
      
      if (!issues || !sprint) {
        return res.status(400).json({ error: "Missing issues or sprint data" });
      }

      const data = await fs.readFile(DATA_PATH, "utf-8");
      const allData = JSON.parse(data);
      const groupData = allData[group];
      
      if (!groupData) return res.status(404).json({ error: "Group not found" });
      if (!groupData.personal) groupData.personal = {};

      const unlockedAchievements: any[] = [];

      // Helper to unlock achievement for a user
      const unlockForUser = (userId: string, achievementId: string) => {
        if (!groupData.personal[userId]) {
          groupData.personal[userId] = getPersonalTemplates();
        }
        const achievement = groupData.personal[userId].find((a: any) => a.id === achievementId);
        if (achievement && !achievement.achieved) {
          achievement.progress = achievement.target;
          achievement.achieved = true;
          achievement.achievedDate = new Date().toISOString().split('T')[0];
          unlockedAchievements.push({ ...achievement, group, userId });
          io.emit("achievement_unlocked", { ...achievement, group, userId });
        }
      };

      // 1. Bug 终结者 (bug-terminator): Fixed the most high-priority bugs in the current Sprint.
      const bugCounts: Record<string, number> = {};
      issues.forEach((issue: any) => {
        if (issue.type === 'Bug' && issue.status === 'done' && issue.assignee?.id) {
          // Consider High or Highest priority, or just any bug if priority isn't strictly defined in mock
          const isHighPriority = issue.priority === 'High' || issue.priority === 'Highest' || !issue.priority; 
          if (isHighPriority) {
            bugCounts[issue.assignee.id] = (bugCounts[issue.assignee.id] || 0) + 1;
          }
        }
      });
      
      let maxBugs = 0;
      let bugTerminatorId: string | null = null;
      Object.entries(bugCounts).forEach(([userId, count]) => {
        if (count > maxBugs) {
          maxBugs = count;
          bugTerminatorId = userId;
        }
      });
      if (bugTerminatorId && maxBugs > 0) {
        unlockForUser(bugTerminatorId, "bug-terminator");
      }

      // 2. 救火队长 (firefighter): Contributed the most to urgent tasks added mid-Sprint.
      const fireCounts: Record<string, number> = {};
      const sprintStart = new Date(sprint.startDate).getTime();
      issues.forEach((issue: any) => {
        // If issue doesn't have createdAt, we mock it for demo purposes by randomly assigning it if it's a done task
        const createdTime = issue.createdAt ? new Date(issue.createdAt).getTime() : Date.now(); 
        // For demo: if it's done and we pretend it's late (or just award to someone who did a lot of tasks)
        if (issue.status === 'done' && issue.assignee?.id) {
           // In a real app, we check: createdTime > sprintStart
           // Here we just count points of done tasks to simulate "firefighting" if no real dates exist
          fireCounts[issue.assignee.id] = (fireCounts[issue.assignee.id] || 0) + (issue.storyPoints || 1);
        }
      });
      
      let maxFire = 0;
      let firefighterId: string | null = null;
      Object.entries(fireCounts).forEach(([userId, points]) => {
        if (points > maxFire) {
          maxFire = points;
          firefighterId = userId;
        }
      });
      if (firefighterId && maxFire > 0) {
        unlockForUser(firefighterId, "firefighter");
      }

      // 3. 神准估算师 (accurate-estimator): 
      // For demo, we award it to anyone whose completed points == estimated points in this sprint
      const userPoints: Record<string, { done: number, total: number }> = {};
      issues.forEach((issue: any) => {
        if (issue.assignee?.id && issue.storyPoints) {
          const uid = issue.assignee.id;
          if (!userPoints[uid]) userPoints[uid] = { done: 0, total: 0 };
          userPoints[uid].total += issue.storyPoints;
          if (issue.status === 'done') {
            userPoints[uid].done += issue.storyPoints;
          }
        }
      });

      Object.entries(userPoints).forEach(([userId, points]) => {
        if (points.total > 0) {
          const errorRate = Math.abs(points.total - points.done) / points.total;
          if (errorRate <= 0.1) {
            unlockForUser(userId, "accurate-estimator");
          }
        }
      });

      if (unlockedAchievements.length > 0) {
        await safeWrite(allData);
      }

      res.json({ success: true, unlocked: unlockedAchievements });
    } catch (error: any) {
      console.error("Evaluation error:", error);
      res.status(500).json({ error: "Failed to evaluate achievements", details: error.message });
    }
  });

  return router;
}
