const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BOT_MODE,
  HUMAN_MODE,
  applyDefaultConversationState,
  isEchoMessageEvent,
  isHumanTakeoverEvent,
  getConversationParticipantId,
  buildHumanModeState,
  buildBotModeState,
  isHumanModeExpired
} = require("../src/services/conversationModeService");
const {
  buildHumanTakeoverNotification,
  buildBotReactivationNotification
} = require("../src/routes/webhook");

test("defaults to BOT mode for legacy state", () => {
  assert.deepEqual(applyDefaultConversationState({ step: "menu" }), {
    step: "menu",
    mode: BOT_MODE
  });
});

test("manual operator echo activates HUMAN mode on the customer conversation", () => {
  const event = {
    sender: { id: "page-1" },
    recipient: { id: "customer-1" },
    message: {
      is_echo: true,
      text: "Сайн байна уу"
    }
  };

  assert.equal(isEchoMessageEvent(event), true);
  assert.equal(isHumanTakeoverEvent(event), true);
  assert.equal(getConversationParticipantId(event), "customer-1");

  const nextState = buildHumanModeState({ step: "complaint" }, 1000);
  assert.equal(nextState.mode, HUMAN_MODE);
  assert.equal(nextState.step, "complaint");
  assert.equal(nextState.humanModeActivatedAt, new Date(1000).toISOString());
  assert.equal(buildHumanTakeoverNotification(), "👨‍💼 Оператор холбогдлоо");
});

test("app echo does not trigger human takeover", () => {
  const event = {
    sender: { id: "page-1" },
    recipient: { id: "customer-1" },
    message: {
      is_echo: true,
      app_id: 123456,
      text: "Bot reply"
    }
  };

  assert.equal(isEchoMessageEvent(event), true);
  assert.equal(isHumanTakeoverEvent(event), false);
});

test("expired HUMAN mode auto-returns conversation to BOT menu", () => {
  const humanState = buildHumanModeState({ step: "complaint" }, 0);

  assert.equal(isHumanModeExpired(humanState, 30, 31 * 60 * 1000), true);
  assert.deepEqual(buildBotModeState(), {
    step: "menu",
    mode: BOT_MODE
  });
  assert.equal(buildBotReactivationNotification(), "🤖 Автомат туслах дахин идэвхжлээ");
});