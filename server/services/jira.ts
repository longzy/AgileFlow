import { config } from "../config";
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
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.JIRA.EMAIL}:${config.JIRA.API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
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

    // Map Jira issues to our format
    const mapJiraIssue = (issue: any, status: string) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: status,
      estimated: !!issue.fields.customfield_10106,
      storyPoints: issue.fields.customfield_10106,
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

    const allIssues = (issuesData.issues || []).map((i: any) => {
      processUser(i.fields.assignee);
      const statusCategory = i.fields.status?.statusCategory?.key;
      let mappedStatus = 'todo';
      
      let progress = 0;
      if (statusCategory === 'indeterminate') {
        mappedStatus = 'in-progress';
        progress = 50;
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
      users: Array.from(usersMap.values())
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
