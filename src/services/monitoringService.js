const axios = require("axios");

const { env } = require("../config/env");
const { pingDatabase } = require("../db/postgres");

const startedAtMs = Date.now();

function getUptimeSeconds() {
  return Math.floor((Date.now() - startedAtMs) / 1000);
}

async function getRuntimeStatus() {
  const database = await pingDatabase();

  return {
    status: database.configured && !database.connected ? "degraded" : "ok",
    service: "parking-chatbot",
    uptimeSeconds: getUptimeSeconds(),
    database,
    timestamp: new Date().toISOString()
  };
}

function buildAlertText(eventType, details) {
  return [
    `[parking-chatbot] ${eventType}`,
    details.message ? `message: ${details.message}` : "",
    details.context ? `context: ${details.context}` : "",
    details.stack ? `stack: ${details.stack}` : "",
    `timestamp: ${new Date().toISOString()}`
  ].filter(Boolean).join("\n");
}

async function sendAlert(eventType, details = {}) {
  if (!env.alertWebhookUrl) {
    return false;
  }

  try {
    await axios.post(env.alertWebhookUrl, {
      text: buildAlertText(eventType, details),
      service: "parking-chatbot",
      eventType,
      details,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Failed to send alert:", error.message);
    return false;
  }
}

module.exports = {
  getRuntimeStatus,
  sendAlert
};