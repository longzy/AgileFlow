import { config } from "../../core/config";
import { getJiraHeaders, fetchAvatarAsBase64 } from "./jira.api";

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
