import { config } from "../config";
// Force UI sync
import { getMockData, getMockBoards } from "./jiraMock";

const getJiraHeaders = () => {
  if (!config.JIRA.EMAIL || !config.JIRA.API_TOKEN) {
    throw new Error("Missing Jira credentials");
  }
  return {
    'Authorization': `Basic ${Buffer.from(`${config.JIRA.EMAIL}:${config.JIRA.API_TOKEN}`).toString('base64')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

// Helper to fetch avatar as base64
const fetchAvatarAsBase64 = async (url: string) => {
  try {
    const res = await fetch(url, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(10000) // Increased timeout to 10s
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (e) {
    console.error("Failed to fetch avatar:", e);
    return null;
  }
};

export const updateIssueStatus = async (issueId: string, targetStatusCategory: string) => {
  if (!config.JIRA.BASE_URL) {
    console.log(`[Mock] Updating issue ${issueId} status category to ${targetStatusCategory}`);
    return { success: true };
  }

  try {
    // 1. Fetch available transitions for the issue
    const transitionsRes = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}/transitions`, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(5000)
    });

    if (!transitionsRes.ok) {
      throw new Error(`Failed to fetch transitions: ${transitionsRes.statusText}`);
    }

    const transitionsData = await transitionsRes.json();
    
    // 2. Find a transition that moves the issue to the target status category
    // targetStatusCategory is usually 'new', 'indeterminate' (in progress), or 'done'
    const transition = transitionsData.transitions.find((t: any) => 
      t.to?.statusCategory?.key === targetStatusCategory
    );

    if (!transition) {
      // It's possible the issue is already in the target status, or there's no valid transition.
      // We'll just log a warning and return success to not block the UI.
      console.warn(`No transition found for status category: ${targetStatusCategory}. It might already be in this state.`);
      return { success: true, warning: 'No valid transition found' };
    }

    // 3. Perform the transition
    const transitionBody: any = {
      transition: {
        id: transition.id
      }
    };

    // Add resolution if moving to done
    if (targetStatusCategory === 'done') {
      transitionBody.fields = {
        resolution: {
          id: "10000"
        }
      };
    }

    let updateRes = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}/transitions`, {
      method: 'POST',
      headers: getJiraHeaders(),
      body: JSON.stringify(transitionBody),
      signal: AbortSignal.timeout(5000)
    });

    // Fallback if transition fails due to resolution field not being on the screen
    if (!updateRes.ok && updateRes.status === 400 && targetStatusCategory === 'done') {
      console.warn(`[Jira] Transition with resolution failed for ${issueId}. Retrying without resolution field...`);
      delete transitionBody.fields;
      
      updateRes = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}/transitions`, {
        method: 'POST',
        headers: getJiraHeaders(),
        body: JSON.stringify(transitionBody),
        signal: AbortSignal.timeout(5000)
      });
    }

    if (!updateRes.ok) {
      throw new Error(`Failed to update status: ${updateRes.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Jira Update Status Error:", error);
    throw error;
  }
};

export const updateIssueResolution = async (issueId: string, resolutionId: string | null) => {
  if (!config.JIRA.BASE_URL) {
    console.log(`[Mock] Updating issue ${issueId} resolution to ${resolutionId}`);
    return { success: true };
  }

  try {
    const updateBody = {
      fields: {
        resolution: resolutionId ? { id: resolutionId } : null
      }
    };

    const updateRes = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}`, {
      method: 'PUT',
      headers: getJiraHeaders(),
      body: JSON.stringify(updateBody),
      signal: AbortSignal.timeout(5000)
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.warn(`[Jira] Failed to update resolution directly for ${issueId}: ${updateRes.status} - ${errorText}`);
      return { success: false, warning: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error("Jira Update Resolution Error:", error);
    throw error;
  }
};

export const updateIssuePendingStatus = async (issueId: string, isPending: boolean) => {
  if (!config.JIRA.BASE_URL) {
    console.log(`[Mock] Updating issue ${issueId} pending status (customfield_10208) to ${isPending ? 1 : 0}`);
    return { success: true };
  }

  try {
    const updateBody = {
      fields: {
        customfield_10208: isPending ? 1 : 0
      }
    };

    const updateRes = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}`, {
      method: 'PUT',
      headers: getJiraHeaders(),
      body: JSON.stringify(updateBody),
      signal: AbortSignal.timeout(5000)
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update pending status: ${updateRes.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Jira Update Pending Status Error:", error);
    throw error;
  }
};

export const updateIssueProgress = async (issueId: string, progress: number) => {
  if (!config.JIRA.BASE_URL) {
    console.log(`[Mock] Updating issue ${issueId} progress to ${progress}%`);
    return { success: true };
  }

  try {
    const updateBody = {
      fields: {
        [config.JIRA.PROGRESS_FIELD_ID]: progress
      }
    };

    const updateRes = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}`, {
      method: 'PUT',
      headers: getJiraHeaders(),
      body: JSON.stringify(updateBody),
      signal: AbortSignal.timeout(5000)
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update progress: ${updateRes.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Jira Update Error:", error);
    throw error;
  }
};

export const updateIssuePoints = async (issueId: string, points: number) => {
  if (!config.JIRA.BASE_URL) {
    console.log(`[Mock] Updating issue ${issueId} points to ${points}`);
    return { success: true };
  }

  try {
    const updateBody = {
      fields: {
        customfield_10106: points
      }
    };

    const response = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}`, {
      method: 'PUT',
      headers: getJiraHeaders(),
      body: JSON.stringify(updateBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to update points: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Jira Update Points Error:", error);
    throw error;
  }
};

export const assignIssue = async (issueId: string, userId: string) => {
  if (!config.JIRA.BASE_URL) {
    console.log(`[Mock] Assigning issue ${issueId} to user ${userId}`);
    return { success: true };
  }

  try {
    // Directly use 'name' strategy as requested for Jira Server compatibility
    const updateBody = {
      name: userId
    };

    console.log(`[Jira] Assigning issue ${issueId} to ${userId} (name strategy)`);
    const response = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}/assignee`, {
      method: 'PUT',
      headers: getJiraHeaders(),
      body: JSON.stringify(updateBody)
    });

    if (response.ok) {
      return { success: true };
    }

    const errorText = await response.text();
    throw new Error(`Failed to assign issue: ${response.status} ${response.statusText} - ${errorText}`);
  } catch (error) {
    console.error("Jira Assign Issue Error:", error);
    throw error;
  }
};

export const getGroups = async (query: string = '') => {
  if (!config.JIRA.BASE_URL) {
    return [
      { name: '软件部门', html: '软件部门' },
      { name: '测试部门', html: '测试部门' },
      { name: '产品部门', html: '产品部门' }
    ];
  }

  try {
    const url = new URL(`${config.JIRA.BASE_URL}/rest/api/2/groups/picker`);
    if (query) {
      url.searchParams.append('query', query);
    }
    
    const response = await fetch(url.toString(), {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.statusText}`);
    }

    const data = await response.json();
    return data.groups || [];
  } catch (error) {
    console.error("Jira Get Groups Error:", error);
    return [];
  }
};

export const getGroupMembers = async (groupName: string) => {
  if (!config.JIRA.BASE_URL) {
    // Return mock users for group
    return [
      { id: 'sw-1', name: 'Software Engineer 1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SE1' },
      { id: 'sw-2', name: 'Software Engineer 2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SE2' },
      { id: 'sw-3', name: 'Tech Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TL' },
      { id: 'sw-4', name: 'QA Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QA' },
    ];
  }

  try {
    const response = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/group/member?groupname=${encodeURIComponent(groupName)}`, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(15000) // Increased timeout to 15s
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group members: ${response.statusText}`);
    }

    const data = await response.json();
    const members = data.values || [];

    // Process members in batches to avoid overwhelming the server with avatar requests
    const resolvedMembers = [];
    const batchSize = 10;
    
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(async (u: any) => {
        let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.displayName || u.name)}`;
        const avatarUrl = u.avatarUrls?.['48x48'];
        
        if (avatarUrl) {
          const base64 = await fetchAvatarAsBase64(avatarUrl);
          if (base64) {
            avatar = base64;
          }
        }

        return {
          // Prefer accountId (Cloud), then name (Server), then key
          id: u.accountId || u.name || u.key,
          name: u.displayName || u.name,
          avatar
        };
      }));
      resolvedMembers.push(...batchResults);
    }

    return resolvedMembers;

  } catch (error) {
    console.error("Jira Get Group Members Error:", error);
    return [];
  }
};

export const getBoards = async () => {
  if (!config.JIRA.BASE_URL) {
    return getMockBoards();
  }

  try {
    const response = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/board`, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    
    const boards = (data.values || []).map((b: any) => ({
      id: b.id.toString(),
      name: b.name,
      type: b.type
    }));

    return { boards };
  } catch (error) {
    console.error("Jira Boards Error:", error);
    return {
      boards: [
        { id: '1', name: 'Agile Board (Fallback)', type: 'scrum' },
        { id: '2', name: 'Design Board (Fallback)', type: 'kanban' },
      ],
      isMock: true,
      warning: "Failed to connect to Jira. Using mock data."
    };
  }
};

export const getMetricsData = async (boardId: string) => {
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

  if (!config.JIRA.BASE_URL) {
    return mockMetrics;
  }

  try {
    let velocity = mockMetrics.velocity;
    let cycleTime = mockMetrics.cycleTime;
    let burndown = mockMetrics.burndown;

    // --- 1. Velocity Data Aggregation ---
    try {
      let allSprints: any[] = [];
      let isLast = false;
      let startAt = 0;
      
      // Fetch all closed sprints to get the most recent ones (cap at 500 to prevent infinite loops)
      while (!isLast && startAt < 500) {
        const sprintsRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?state=closed&maxResults=50&startAt=${startAt}`, {
          headers: getJiraHeaders(),
          signal: AbortSignal.timeout(10000)
        });
        
        if (!sprintsRes.ok) break;
        
        const sprintsData = await sprintsRes.json();
        allSprints = allSprints.concat(sprintsData.values || []);
        isLast = sprintsData.isLast === true || (sprintsData.values || []).length === 0;
        startAt += 50;
      }
      
      // Get the last 10 sprints
      const sprints = allSprints.slice(-10);
      
      if (sprints.length > 0) {
        const velocityData = await Promise.all(sprints.map(async (sprint: any) => {
          const issuesRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/sprint/${sprint.id}/issue`, { 
            headers: getJiraHeaders(),
            signal: AbortSignal.timeout(10000)
          });
          
          if (!issuesRes.ok) return { sprint: sprint.name, committed: 0, completed: 0 };
          
          const issuesData = await issuesRes.json();
          let committed = 0;
          let completed = 0;
          
          (issuesData.issues || []).forEach((issue: any) => {
            const points = issue.fields.customfield_10106 || 0;
            committed += points;
            if (issue.fields.status?.statusCategory?.key === 'done') {
              completed += points;
            }
          });
          
          return {
            sprint: sprint.name,
            committed,
            completed
          };
        }));
        velocity = velocityData; // Already oldest to newest from slice(-10)
      }
    } catch (e) {
      console.error("Jira Velocity Aggregation Error:", e);
    }

    // --- 2. Cycle Time Aggregation ---
    try {
      // Fetch recently resolved issues for this board
      const jql = `statusCategory = Done AND resolved >= -30d ORDER BY resolved ASC`;
      const cycleTimeRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/board/${boardId}/issue?jql=${encodeURIComponent(jql)}&expand=changelog&maxResults=50`, {
        headers: getJiraHeaders(),
        signal: AbortSignal.timeout(15000)
      });

      if (cycleTimeRes.ok) {
        const cycleTimeData = await cycleTimeRes.json();
        const issues = cycleTimeData.issues || [];
        
        if (issues.length > 0) {
          cycleTime = issues.map((issue: any) => {
            const histories = issue.changelog?.histories || [];
            let inProgressDate = null;
            let doneDate = new Date(issue.fields.resolutiondate || issue.fields.updated);

            // Parse changelog to find when the issue moved to "In Progress"
            for (const history of histories) {
              const statusItem = history.items.find((item: any) => item.field === 'status');
              if (statusItem && ['In Progress', '开发中', '处理中', '进行中'].includes(statusItem.toString)) {
                inProgressDate = new Date(history.created);
                break;
              }
            }

            // Fallback to creation date if no "In Progress" transition found
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
    } catch (e) {
      console.error("Jira Cycle Time Aggregation Error:", e);
    }

    // --- 3. Burndown Data Aggregation ---
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
            
            burndown = Array.from({ length: totalDays }).map((_, i) => {
              const currentDate = new Date(startDate.getTime() + i * 24 * 3600 * 1000);
              const ideal = Math.max(0, totalPoints - (totalPoints / totalDays) * i);
              
              let resolvedPoints = 0;
              issues.forEach((issue: any) => {
                const points = issue.fields.customfield_10106 || 0;
                if (issue.fields.status?.statusCategory?.key === 'done') {
                  const resolutionDate = new Date(issue.fields.resolutiondate || issue.fields.updated);
                  // If resolved on or before this day of the sprint
                  if (resolutionDate <= new Date(currentDate.getTime() + 24 * 3600 * 1000 - 1)) {
                    resolvedPoints += points;
                  }
                }
              });

              let remaining = totalPoints - resolvedPoints;

              // Do not show remaining line for future days
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
    } catch (e) {
      console.error("Jira Burndown Aggregation Error:", e);
    }

    return {
      burndown,
      velocity,
      cycleTime
    };

  } catch (error) {
    console.error("Jira Metrics Aggregation Error:", error);
    return mockMetrics; // Fallback gracefully
  }
};

export const getBoardData = async (boardId: string, sprintState: string = 'active') => {
  if (!config.JIRA.BASE_URL) {
    const mockData = getMockData(boardId);
    if (mockData.sprint) {
      mockData.sprint.isActive = sprintState === 'active';
      if (sprintState === 'future') {
        mockData.sprint.name = 'Sprint 25 (Future)';
      }
    }
    return { ...mockData, isMock: true };
  }

  try {
    // Fetch sprint
    const sprintRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?state=${sprintState}`, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    const sprintData = await sprintRes.json();
    const targetSprint = sprintData.values?.[0];

    // Fetch sprint issues
    let issuesData = { issues: [] };
    if (targetSprint) {
      const issuesRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/sprint/${targetSprint.id}/issue`, {
        headers: getJiraHeaders(),
        signal: AbortSignal.timeout(5000)
      });
      issuesData = await issuesRes.json();
    }

    // Extract unique users
    const rawUsersMap = new Map();
    (issuesData.issues || []).forEach((i: any) => {
      const user = i.fields.assignee;
      if (user && !rawUsersMap.has(user.key)) {
        rawUsersMap.set(user.key, user);
      }
    });

    // Fetch avatars and build resolved users
    const resolvedUsersMap = new Map();
    await Promise.all(Array.from(rawUsersMap.entries()).map(async ([jiraKey, user]: [string, any]) => {
      let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.displayName || user.name)}`;
      if (user.avatarUrls?.['48x48']) {
        const base64 = await fetchAvatarAsBase64(user.avatarUrls['48x48']);
        if (base64) {
          avatar = base64;
        }
      }

      // Fix: Use accountId (Cloud) or name (Server) as ID, fallback to key.
      // User feedback confirms 'name' field contains the correct login username (e.g. "huixin.a")
      // while 'key' might be an internal ID (e.g. "JIRAUSER10107").
      let userId = user.name || user.accountId || user.key;

      // Fallback: If userId looks like an internal key (starts with JIRAUSER), 
      // try to extract the real username from the 'self' URL.
      // Example self: "http://.../rest/api/2/user?username=huixin.a"
      if (typeof userId === 'string' && userId.startsWith('JIRAUSER') && user.self) {
        try {
          const selfUrl = new URL(user.self);
          const usernameParam = selfUrl.searchParams.get('username');
          if (usernameParam) {
            console.log(`[Jira] Extracted username '${usernameParam}' from self URL for key '${user.key}'`);
            userId = usernameParam;
          }
        } catch (e) {
          // Ignore URL parsing errors
        }
      }
      
      // Log for debugging purposes to verify we are selecting the correct ID
      if (userId !== user.key) {
        console.log(`[Jira] Mapped user key '${user.key}' to ID '${userId}'`);
      }

      resolvedUsersMap.set(jiraKey, {
        id: userId,
        name: user.displayName || user.name,
        avatar
      });
    }));

    // Map Jira issues to our format
    const mapJiraIssue = (issue: any, status: string) => {
      const assignee = issue.fields.assignee;
      let priority = 'Medium';
      if (issue.fields.priority?.name) {
        const pName = issue.fields.priority.name.toLowerCase();
        if (pName.includes('high') || pName.includes('highest') || pName.includes('critical') || pName.includes('major')) {
          priority = 'High';
        } else if (pName.includes('low') || pName.includes('lowest') || pName.includes('minor') || pName.includes('trivial')) {
          priority = 'Low';
        }
      }

      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: status,
        estimated: !!issue.fields.customfield_10106,
        storyPoints: issue.fields.customfield_10106,
        priority,
        assignee: assignee ? resolvedUsersMap.get(assignee.key) : undefined,
        type: issue.fields.issuetype?.name || 'Task',
      };
    };

    const allIssues = (issuesData.issues || []).map((i: any) => {
      const statusCategory = i.fields.status?.statusCategory?.key;
      const isPending = i.fields.customfield_10208 === 1 || i.fields.customfield_10208 === "1";
      let mappedStatus = 'todo';
      
      let progress = 0;
      if (statusCategory === 'indeterminate') {
        mappedStatus = isPending ? 'pending' : 'in-progress';
        // progress = 50;
      }

      if (i.fields[config.JIRA.PROGRESS_FIELD_ID] !== undefined && i.fields[config.JIRA.PROGRESS_FIELD_ID] !== null) {
        progress = Number(i.fields[config.JIRA.PROGRESS_FIELD_ID]);
      }

      if (statusCategory === 'done') {
        mappedStatus = 'done';
        progress = 100;
      }

      return { ...mapJiraIssue(i, mappedStatus), progress };
    });

    return {
      sprint: targetSprint ? {
        id: targetSprint.id.toString(),
        name: targetSprint.name,
        startDate: targetSprint.startDate,
        endDate: targetSprint.endDate,
        isActive: sprintState === 'active',
      } : null,
      issues: allIssues,
      users: Array.from(resolvedUsersMap.values())
    };

  } catch (error) {
    console.error("Jira API Error:", error);
    return { 
      ...getMockData(boardId), 
      isMock: true,
      warning: "Failed to connect to Jira. Using mock data."
    };
  }
};
