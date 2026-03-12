import { config } from "../../core/config";
import { getJiraHeaders } from "./jira.api";

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
