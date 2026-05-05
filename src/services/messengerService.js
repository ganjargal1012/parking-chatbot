const axios = require("axios");

const { env } = require("../config/env");

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

  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${env.pageAccessToken}`,
    {
      recipient: { id: recipientId },
      message: normalizedMessage
    }
  );
}

module.exports = {
  sendTextMessage
};