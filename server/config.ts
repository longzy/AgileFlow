import "dotenv/config";

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JIRA: {
    BASE_URL: process.env.JIRA_BASE_URL,
    EMAIL: process.env.JIRA_EMAIL,
    API_TOKEN: process.env.JIRA_API_TOKEN,
    BOARD_ID: process.env.JIRA_BOARD_ID || '1',
    PROGRESS_FIELD_ID: process.env.JIRA_PROGRESS_FIELD_ID || 'customfield_10017',
  },
  PROXY: process.env.HTTPS_PROXY || process.env.HTTP_PROXY,
};
