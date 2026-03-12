import { config } from "../../core/config";
import { getJiraHeaders, fetchAvatarAsBase64 } from "./jira.api";
import { getMockData, getMockBoards } from "./jira.mock";

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
