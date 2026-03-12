import { config } from "../../core/config";
import { getJiraHeaders } from "./jira.api";

// Mock data fallback if Jira is not configured
const mockMetrics = {
  burndown: [
    { day: 'Day 1', ideal: 50, remaining: 50 },
    { day: 'Day 2', ideal: 45, remaining: 48 },
    { day: 'Day 3', ideal: 40, remaining: 42 },
    { day: 'Day 4', ideal: 35, remaining: 35 },
    { day: 'Day 5', ideal: 30, remaining: 32 },
    { day: 'Day 6', ideal: 25, remaining: 20 },
    { day: 'Day 7', ideal: 20, remaining: 18 },
    { day: 'Day 8', ideal: 15, remaining: 15 },
    { day: 'Day 9', ideal: 10, remaining: 12 },
    { day: 'Day 10', ideal: 5, remaining: 5 },
    { day: 'Day 11', ideal: 0, remaining: 0 }
  ],
  velocity: [
    { sprint: 'Sprint 1', committed: 40, completed: 35 },
    { sprint: 'Sprint 2', committed: 45, completed: 45 },
    { sprint: 'Sprint 3', committed: 50, completed: 42 },
    { sprint: 'Sprint 4', committed: 45, completed: 48 },
    { sprint: 'Sprint 5', committed: 50, completed: 50 },
    { sprint: 'Sprint 6', committed: 55, completed: 52 }
  ],
  cycleTime: [
    { date: '03-01', cycleTime: 2, issue: 'PROJ-101' },
    { date: '03-02', cycleTime: 5, issue: 'PROJ-102' },
    { date: '03-03', cycleTime: 3, issue: 'PROJ-103' },
    { date: '03-04', cycleTime: 8, issue: 'PROJ-104' },
    { date: '03-05', cycleTime: 4, issue: 'PROJ-105' },
    { date: '03-06', cycleTime: 12, issue: 'PROJ-106' },
    { date: '03-07', cycleTime: 2, issue: 'PROJ-107' },
    { date: '03-08', cycleTime: 6, issue: 'PROJ-108' },
    { date: '03-09', cycleTime: 4, issue: 'PROJ-109' },
    { date: '03-10', cycleTime: 3, issue: 'PROJ-110' },
  ]
};

export const getVelocityData = async (boardId: string, months: number = 6) => {
  if (!config.JIRA.BASE_URL) return mockMetrics.velocity;

  try {
    const now = new Date();
    const beforeDate = now.toISOString();
    const afterDateObj = new Date();
    afterDateObj.setMonth(now.getMonth() - months);
    const afterDate = afterDateObj.toISOString();

    const velocityUrl = `${config.JIRA.BASE_URL}/rest/greenhopper/1.0/rapid/charts/velocity.json?rapidViewId=${boardId}&sprintsFinishedBefore=${encodeURIComponent(beforeDate)}&sprintsFinishedAfter=${encodeURIComponent(afterDate)}&_=${Date.now()}`;

    const velocityRes = await fetch(velocityUrl, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(10000)
    });

    if (velocityRes.ok) {
      const velocityData = await velocityRes.json();
      const sprints = velocityData.sprints || [];
      const entries = velocityData.velocityStatEntries || {};

      return sprints.map((sprint: any) => {
        const entry = entries[sprint.id] || {};
        return {
          sprint: sprint.name,
          committed: entry.estimated?.value || 0,
          completed: entry.completed?.value || 0
        };
      });
    }
    return mockMetrics.velocity;
  } catch (e) {
    console.error("Jira Velocity Aggregation Error:", e);
    return mockMetrics.velocity;
  }
};

export const getCycleTimeData = async (boardId: string) => {
  if (!config.JIRA.BASE_URL) return mockMetrics.cycleTime;

  try {
    const jql = `statusCategory = Done AND resolved >= -30d ORDER BY resolved ASC`;
    const cycleTimeRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/board/${boardId}/issue?jql=${encodeURIComponent(jql)}&expand=changelog&maxResults=50`, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(15000)
    });

    if (cycleTimeRes.ok) {
      const cycleTimeData = await cycleTimeRes.json();
      const issues = cycleTimeData.issues || [];
      
      if (issues.length > 0) {
        return issues.map((issue: any) => {
          const histories = issue.changelog?.histories || [];
          let inProgressDate = null;
          let doneDate = new Date(issue.fields.resolutiondate || issue.fields.updated);

          for (const history of histories) {
            const statusItem = history.items.find((item: any) => item.field === 'status');
            if (statusItem && ['In Progress', '开发中', '处理中', '进行中'].includes(statusItem.toString)) {
              inProgressDate = new Date(history.created);
              break;
            }
          }

          if (!inProgressDate) {
            inProgressDate = new Date(issue.fields.created);
          }

          const cycleTimeDays = Math.max(1, Math.ceil((doneDate.getTime() - inProgressDate.getTime()) / (1000 * 3600 * 24)));
          
          return {
            date: `${doneDate.getMonth() + 1}-${doneDate.getDate().toString().padStart(2, '0')}`,
            cycleTime: cycleTimeDays,
            issue: issue.key
          };
        });
      }
    }
    return mockMetrics.cycleTime;
  } catch (e) {
    console.error("Jira Cycle Time Aggregation Error:", e);
    return mockMetrics.cycleTime;
  }
};

export const getBurndownData = async (boardId: string) => {
  if (!config.JIRA.BASE_URL) return mockMetrics.burndown;

  try {
    const activeSprintRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?state=active`, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    
    if (activeSprintRes.ok) {
      const activeSprintData = await activeSprintRes.json();
      const activeSprint = activeSprintData.values?.[0];
      
      if (activeSprint) {
        const issuesRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/sprint/${activeSprint.id}/issue?expand=changelog`, {
          headers: getJiraHeaders(),
          signal: AbortSignal.timeout(15000)
        });

        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          const issues = issuesData.issues || [];

          const startDate = new Date(activeSprint.startDate);
          const endDate = new Date(activeSprint.endDate);
          const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
          
          let totalPoints = 0;
          issues.forEach((issue: any) => {
            totalPoints += (issue.fields.customfield_10106 || 0);
          });

          const now = new Date();
          
          return Array.from({ length: totalDays }).map((_, i) => {
            const currentDate = new Date(startDate.getTime() + i * 24 * 3600 * 1000);
            const ideal = Math.max(0, totalPoints - (totalPoints / totalDays) * i);
            
            let resolvedPoints = 0;
            issues.forEach((issue: any) => {
              const points = issue.fields.customfield_10106 || 0;
              if (issue.fields.status?.statusCategory?.key === 'done') {
                const resolutionDate = new Date(issue.fields.resolutiondate || issue.fields.updated);
                if (resolutionDate <= new Date(currentDate.getTime() + 24 * 3600 * 1000 - 1)) {
                  resolvedPoints += points;
                }
              }
            });

            let remaining = totalPoints - resolvedPoints;

            if (currentDate > now && i > 0) {
              return {
                day: `Day ${i + 1}`,
                ideal: Math.round(ideal * 10) / 10,
                remaining: null
              };
            }

            return {
              day: `Day ${i + 1}`,
              ideal: Math.round(ideal * 10) / 10,
              remaining: Math.round(remaining * 10) / 10
            };
          });
        }
      }
    }
    return mockMetrics.burndown;
  } catch (e) {
    console.error("Jira Burndown Aggregation Error:", e);
    return mockMetrics.burndown;
  }
};

export const getMetricsData = async (boardId: string, months: number = 6) => {
  try {
    const [velocity, cycleTime, burndown] = await Promise.all([
      getVelocityData(boardId, months),
      getCycleTimeData(boardId),
      getBurndownData(boardId)
    ]);

    return {
      burndown,
      velocity,
      cycleTime
    };
  } catch (error) {
    console.error("Jira Metrics Aggregation Error:", error);
    return mockMetrics;
  }
};
