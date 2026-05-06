const crypto = require("crypto");
const express = require("express");

const { env } = require("../config/env");
const { getReplyForMessage } = require("../services/conversationService");
const { sendAlert } = require("../services/monitoringService");
const { sendTextMessage } = require("../services/messengerService");
const { getSenderIdByIssue } = require("../store/userStore");

const router = express.Router();

function isAuthorizedJiraWebhook(req) {
  if (!env.jiraWebhookSecret) {
    return true;
  }

  return req.get("x-jira-webhook-secret") === env.jiraWebhookSecret;
}

function verifyMessengerSignature(req) {
  if (!env.appSecret) {
    return false;
  }

  const signatureHeader = req.get("x-hub-signature-256");

  if (!signatureHeader || !req.rawBody) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", env.appSecret)
    .update(req.rawBody)
    .digest("hex")}`;

  const providedSignature = Buffer.from(signatureHeader, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedSignature.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedSignature, expectedBuffer);
}

function hasStatusChange(changelogItems) {
  return (changelogItems || []).some((item) => item.field === "status");
}

function getJiraStatusMessage(statusName) {
  const statusMap = {
    "In Progress": "Таны гомдлыг шалгаж байна",
    Done: "Асуудлыг шийдвэрлэлээ"
  };

  return statusMap[statusName] || "";
}

function buildJiraStatusNotification(issueKey, statusName) {
  const message = getJiraStatusMessage(statusName);

  if (!message) {
    return "";
  }

  return [message, `Бүртгэлийн дугаар: ${issueKey}`].join("\n");
}

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/jira", async (req, res) => {
  if (!isAuthorizedJiraWebhook(req)) {
    return res.sendStatus(403);
  }

  const issueKey = req.body?.issue?.key;
  const statusName = req.body?.issue?.fields?.status?.name;
  const skipSend = req.get("x-skip-messenger-send") === "true";

  if (!issueKey || !statusName || !hasStatusChange(req.body?.changelog?.items)) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const senderId = await getSenderIdByIssue(issueKey);
  const notification = buildJiraStatusNotification(issueKey, statusName);

  if (!senderId || !notification) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    await sendTextMessage(senderId, notification, { skipSend });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to process Jira webhook:", error.message);
    await sendAlert("jira_webhook_error", {
      message: error.message,
      context: issueKey,
      stack: error.stack
    });
    return res.status(500).json({ ok: false });
  }
});

router.post("/", async (req, res) => {
  const body = req.body;
  const skipSend = req.get("x-skip-messenger-send") === "true";

  if (!verifyMessengerSignature(req)) {
    return res.sendStatus(403);
  }

  if (body.object !== "page") {
    return res.sendStatus(404);
  }

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      try {
        const senderId = event.sender?.id;
        const text = event.message?.text;
        const imageAttachment = event.message?.attachments?.find((attachment) => attachment.type === "image");
        const attachmentUrl = imageAttachment?.payload?.url;
        const quickReplyPayload = event.message?.quick_reply?.payload;
        const postbackPayload = event.postback?.payload;
        const input = postbackPayload
          ? { payload: postbackPayload, text: postbackPayload }
          : quickReplyPayload
            ? { payload: quickReplyPayload, text: text || quickReplyPayload }
            : attachmentUrl
              ? { text: text || "image", attachmentUrl }
              : text;

        if (!senderId || !input) {
          continue;
        }

        const reply = await getReplyForMessage(senderId, input);
        await sendTextMessage(senderId, reply, { skipSend });
      } catch (error) {
        console.error("Failed to process messaging event:", error.message);
        await sendAlert("messaging_event_error", {
          message: error.message,
          context: event.sender?.id || "unknown-sender",
          stack: error.stack
        });
      }
    }
  }

  return res.sendStatus(200);
});

module.exports = router;
module.exports.getJiraStatusMessage = getJiraStatusMessage;
module.exports.buildJiraStatusNotification = buildJiraStatusNotification;
module.exports.verifyMessengerSignature = verifyMessengerSignature;