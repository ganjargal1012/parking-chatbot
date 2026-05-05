const dotenv = require("dotenv");

dotenv.config();

function parseCsv(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: process.env.DATABASE_SSL !== "false",
  verifyToken: process.env.VERIFY_TOKEN || "ubparking_test",
  pageAccessToken: process.env.PAGE_ACCESS_TOKEN || "",
  appSecret: process.env.APP_SECRET || "",
  skipMessengerSend: process.env.SKIP_MESSENGER_SEND === "true",
  jiraBaseUrl: process.env.JIRA_BASE_URL || "",
  jiraEmail: process.env.JIRA_EMAIL || "",
  jiraApiToken: process.env.JIRA_API_TOKEN || "",
  jiraProjectKey: process.env.JIRA_PROJECT_KEY || "",
  jiraComplaintIssueType: process.env.JIRA_COMPLAINT_ISSUE_TYPE || "[System] Incident",
  jiraFeedbackIssueType: process.env.JIRA_FEEDBACK_ISSUE_TYPE || "Task",
  jiraComplaintPriority: process.env.JIRA_COMPLAINT_PRIORITY || "",
  jiraFeedbackPriority: process.env.JIRA_FEEDBACK_PRIORITY || "",
  jiraComplaintLabels: parseCsv(process.env.JIRA_COMPLAINT_LABELS || ""),
  jiraFeedbackLabels: parseCsv(process.env.JIRA_FEEDBACK_LABELS || ""),
  jiraDuplicateWindowMinutes: parseNumber(process.env.JIRA_DUPLICATE_WINDOW_MINUTES, 10),
  jiraWebhookSecret: process.env.JIRA_WEBHOOK_SECRET || ""
};

function validateRuntimeConfig() {
  const hasJiraConfig = Boolean(env.jiraBaseUrl && env.jiraEmail && env.jiraApiToken && env.jiraProjectKey);

  if (env.pageAccessToken && !env.appSecret) {
    throw new Error("APP_SECRET is required when PAGE_ACCESS_TOKEN is configured.");
  }

  if (hasJiraConfig && !env.jiraWebhookSecret) {
    throw new Error("JIRA_WEBHOOK_SECRET is required when Jira integration is configured.");
  }
}

module.exports = {
  env,
  validateRuntimeConfig
};