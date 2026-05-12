const BOT_MODE = "BOT";
const HUMAN_MODE = "HUMAN";

function applyDefaultConversationState(state) {
  return {
    step: "start",
    mode: BOT_MODE,
    ...state
  };
}

function isEchoMessageEvent(event) {
  return Boolean(event?.message?.is_echo);
}

function isHumanTakeoverEvent(event) {
  return isEchoMessageEvent(event) && !event?.message?.app_id;
}

function getConversationParticipantId(event) {
  if (isHumanTakeoverEvent(event)) {
    return event?.recipient?.id || "";
  }

  return event?.sender?.id || "";
}

function buildHumanModeState(currentState, timestamp) {
  const nextTimestamp = new Date(timestamp == null ? Date.now() : timestamp).toISOString();
  const hydratedState = applyDefaultConversationState(currentState);

  return {
    ...hydratedState,
    mode: HUMAN_MODE,
    humanModeActivatedAt: hydratedState.mode === HUMAN_MODE
      ? hydratedState.humanModeActivatedAt || nextTimestamp
      : nextTimestamp,
    humanModeUpdatedAt: nextTimestamp
  };
}

function buildBotModeState() {
  return applyDefaultConversationState({ step: "menu" });
}

function isHumanModeExpired(state, timeoutMinutes, now = Date.now()) {
  const hydratedState = applyDefaultConversationState(state);

  if (hydratedState.mode !== HUMAN_MODE) {
    return false;
  }

  const lastUpdatedAt = Date.parse(hydratedState.humanModeUpdatedAt || hydratedState.humanModeActivatedAt || "");

  if (!Number.isFinite(lastUpdatedAt)) {
    return true;
  }

  return now - lastUpdatedAt >= timeoutMinutes * 60 * 1000;
}

module.exports = {
  BOT_MODE,
  HUMAN_MODE,
  applyDefaultConversationState,
  isEchoMessageEvent,
  isHumanTakeoverEvent,
  getConversationParticipantId,
  buildHumanModeState,
  buildBotModeState,
  isHumanModeExpired
};