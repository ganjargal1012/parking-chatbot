function buildHumanTakeoverNotification() {
  return "👨‍💼 Оператор холбогдлоо";
}

function buildBotReactivationNotification() {
  return "🤖 Автомат туслах дахин идэвхжлээ";
}

function normalizeInput(text) {
  return String(text || "").trim().toLowerCase();
}

function buildEventInput(event) {
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
  const rawCommand = typeof input === "string" ? input : input?.payload || text || "";

  return {
    input,
    rawCommand,
    normalizedText: normalizeInput(text)
  };
}

function shouldActivateHumanTakeover(rawCommand, normalizedText) {
  const normalizedCommand = normalizeInput(rawCommand);

  return ["menu_operator", "show_operator_number", "operator", "оператор"].includes(normalizedCommand)
    || ["operator", "оператор"].includes(normalizedText);
}

module.exports = {
  buildHumanTakeoverNotification,
  buildBotReactivationNotification,
  buildEventInput,
  shouldActivateHumanTakeover
};