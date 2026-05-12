const axios = require("axios");

const { env } = require("../config/env");

const MESSENGER_API_BASE_URL = "https://graph.facebook.com/v19.0/me";
const PAGE_INBOX_APP_ID = 263902037430900;

function normalizeMessage(message) {
  if (typeof message === "string") {
    return { text: message };
  }

  return message;
}

async function sendTextMessage(recipientId, message, options = {}) {
  const normalizedMessage = normalizeMessage(message);

  if (env.skipMessengerSend || options.skipSend) {
    console.log("MOCK SEND:", { recipientId, message: normalizedMessage });
    return;
  }

  if (!env.pageAccessToken) {
    console.warn("PAGE_ACCESS_TOKEN is missing. Message delivery skipped.");
    return;
  }

  try {
    await axios.post(
      `${MESSENGER_API_BASE_URL}/messages?access_token=${env.pageAccessToken}`,
      {
        recipient: { id: recipientId },
        message: normalizedMessage
      }
    );
  } catch (error) {
    console.error("Messenger send failed:", error.response?.data || error.message);
    throw error;
  }
}

async function postMessengerControl(path, payload, options = {}) {
  if (env.skipMessengerSend || options.skipSend) {
    console.log("MOCK MESSENGER CONTROL:", { path, payload });
    return;
  }

  if (!env.pageAccessToken) {
    console.warn(`PAGE_ACCESS_TOKEN is missing. Messenger control call skipped: ${path}`);
    return;
  }

  try {
    await axios.post(`${MESSENGER_API_BASE_URL}/${path}?access_token=${env.pageAccessToken}`, payload);
  } catch (error) {
    console.error("Messenger control failed:", error.response?.data || error.message);
    throw error;
  }
}

async function passThreadControlToPageInbox(recipientId, metadata = "operator_requested", options = {}) {
  if (!recipientId) {
    return;
  }

  await postMessengerControl(
    "pass_thread_control",
    {
      recipient: { id: recipientId },
      target_app_id: PAGE_INBOX_APP_ID,
      metadata
    },
    options
  );
}

async function takeThreadControl(recipientId, metadata = "bot_reactivated", options = {}) {
  if (!recipientId) {
    return;
  }

  await postMessengerControl(
    "take_thread_control",
    {
      recipient: { id: recipientId },
      metadata
    },
    options
  );
}

module.exports = {
  sendTextMessage,
  passThreadControlToPageInbox,
  takeThreadControl,
  PAGE_INBOX_APP_ID
};