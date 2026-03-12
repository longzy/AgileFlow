import "dotenv/config";

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  PROXY: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || "",
  JIRA: {
    BASE_URL: process.env.JIRA_BASE_URL || "",
    EMAIL: process.env.JIRA_EMAIL || "",
    API_TOKEN: process.env.JIRA_API_TOKEN || "",
    BOARD_ID: process.env.JIRA_BOARD_ID || "",
    PROGRESS_FIELD_ID: process.env.JIRA_PROGRESS_FIELD_ID || "customfield_10207",
  }
};
