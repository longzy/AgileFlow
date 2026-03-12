import { config } from "../../core/config";

export const getJiraHeaders = () => {
  if (!config.JIRA.EMAIL || !config.JIRA.API_TOKEN) {
    throw new Error("Missing Jira credentials");
  }
  return {
    'Authorization': `Basic ${Buffer.from(`${config.JIRA.EMAIL}:${config.JIRA.API_TOKEN}`).toString('base64')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

export const fetchAvatarAsBase64 = async (url: string) => {
  try {
    const res = await fetch(url, {
      headers: getJiraHeaders(),
      signal: AbortSignal.timeout(10000)
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
