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
    const transitionBody = {
      transition: {
        id: transition.id
      }
    };

    const updateRes = await fetch(`${config.JIRA.BASE_URL}/rest/api/2/issue/${issueId}/transitions`, {
      method: 'POST',
      headers: getJiraHeaders(),
      body: JSON.stringify(transitionBody),
      signal: AbortSignal.timeout(5000)
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update status: ${updateRes.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Jira Update Status Error:", error);
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

export const getBoardData = async (boardId: string) => {
  if (!config.JIRA.BASE_URL) {
    return { ...getMockData(boardId), isMock: true };
  }

  try {
    // Fetch active sprint
    const sprintRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?state=active`, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    const sprintData = await sprintRes.json();
    const activeSprint = sprintData.values?.[0];

    // Fetch sprint issues
    let issuesData = { issues: [] };
    if (activeSprint) {
      const issuesRes = await fetch(`${config.JIRA.BASE_URL}/rest/agile/1.0/sprint/${activeSprint.id}/issue`, {
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
        rawUsersMap.set(user.key, {
          id: user.key,
          name: user.name,
          avatarUrl: user.avatarUrls?.['48x48']
        });
      }
    });

    // Fetch avatars and build resolved users
    const fetchAvatarAsBase64 = async (url: string) => {
      try {
        const res = await fetch(url, {
          headers: getJiraHeaders(),
          signal: AbortSignal.timeout(5000)
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

    const resolvedUsersMap = new Map();
    await Promise.all(Array.from(rawUsersMap.values()).map(async (user) => {
      let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
      if (user.avatarUrl) {
        const base64 = await fetchAvatarAsBase64(user.avatarUrl);
        if (base64) {
          avatar = base64;
        }
      }
      resolvedUsersMap.set(user.id, {
        id: user.id,
        name: user.name,
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
      };
    };

    const allIssues = (issuesData.issues || []).map((i: any) => {
      const statusCategory = i.fields.status?.statusCategory?.key;
      let mappedStatus = 'todo';
      
      let progress = 0;
      if (statusCategory === 'indeterminate') {
        mappedStatus = 'in-progress';
        // progress = 50;
      }
      if (statusCategory === 'done') {
        mappedStatus = 'done';
        progress = 100;
      }

      if (i.fields[config.JIRA.PROGRESS_FIELD_ID] !== undefined && i.fields[config.JIRA.PROGRESS_FIELD_ID] !== null) {
        progress = Number(i.fields[config.JIRA.PROGRESS_FIELD_ID]);
      }

      return { ...mapJiraIssue(i, mappedStatus), progress };
    });

    return {
      sprint: activeSprint ? {
        id: activeSprint.id.toString(),
        name: activeSprint.name,
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        isActive: true,
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
