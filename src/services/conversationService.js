const { randomUUID } = require("crypto");
const { getUserState, saveUserState, resetUserState, linkIssueToSender } = require("../store/userStore");
const { createComplaintIssue, createFeedbackIssue, isJiraConfigured } = require("./jiraService");
const {
  createQuickReply,
  createQuickReplyMessage,
  createPostbackButton,
  createButtonTemplate,
  createGenericElement,
  createGenericTemplate
} = require("./messageBuilder");

const POSITIVE_ANSWERS = new Set(["тийм", "tiim", "yes", "y", "ok", "za"]);
const NEGATIVE_ANSWERS = new Set(["үгүй", "ugui", "no", "n", "bolno", "pain"]);
const HELP_COMMANDS = new Set(["тусламж", "help", "menu", "цэс"]);
const RESET_COMMANDS = new Set(["эхлэх", "ehleh", "restart", "start", "цуцлах", "tsutslah", "cancel"]);
const SUBMIT_COMMANDS = new Set(["батлах", "batlah", "илгээх", "ilgeeh", "confirm", "send"]);
const EDIT_COMMANDS = new Set(["засах", "zasah", "edit"]);

const INTENT_COMPLAINT = "complaint";
const INTENT_FEEDBACK = "feedback";
const INTENT_OPERATOR = "operator";
const COMPLAINT_TYPES = [
  { title: "Хаалт", payload: "COMPLAINT_TYPE_BLOCKING" },
  { title: "Төлбөр", payload: "COMPLAINT_TYPE_PAYMENT" },
  { title: "Ажилтан", payload: "COMPLAINT_TYPE_STAFF" },
  { title: "Бусад", payload: "COMPLAINT_TYPE_OTHER" }
];

function getComplaintTypeLabel(payload) {
  const mapping = {
    COMPLAINT_TYPE_BLOCKING: "Зам хаасан / буруу байрласан",
    COMPLAINT_TYPE_PAYMENT: "Төлбөртэй холбоотой",
    COMPLAINT_TYPE_STAFF: "Ажилтан, үйлчилгээ",
    COMPLAINT_TYPE_OTHER: "Бусад"
  };

  return mapping[payload] || null;
}

function createMenuMessage() {
  return createGenericTemplate([
    createGenericElement(
      "UB Parking Туслах 👋",
      "Гомдол бүртгүүлэх, санал үлдээх, оператортой холбогдох боломжтой.",
      [
        createPostbackButton("Гомдол гаргах", "MENU_COMPLAINT"),
        createPostbackButton("Санал үлдээх", "MENU_FEEDBACK"),
        createPostbackButton("Оператортай холбогдох", "MENU_OPERATOR")
      ]
    )
  ]);
}

function buildWelcomeMessage() {
  return createMenuMessage();
}

function buildHelpMessage() {
  return createQuickReplyMessage(
    [
      "Ашиглах заавар 📌",
      "1. Доорх цэснээс хэрэгцээгээ сонгоно.",
      "2. Гомдол, санал, оператор гэсэн урсгалуудаас сонгож болно.",
      "3. Гомдол дээр машиныхаа дугаар, байршил, утас, тайлбараа хамт бичнэ.",
      "4. Хэзээ ч `эхлэх` гэж бичээд үндсэн цэс рүү буцаж орж болно."
    ].join("\n"),
    [
      createQuickReply("Үндсэн цэс", "SHOW_MENU"),
      createQuickReply("Гомдол", "MENU_COMPLAINT")
    ]
  );
}

function buildComplaintSummary(state) {
  return createQuickReplyMessage(
    [
      "Таны оруулсан мэдээлэл 🧾",
      `Тайлбар: ${state.complaint} 📝`,
      `Утас: ${state.phone} 📞`,
      "Доорх сонголтоор үргэлжлүүлнэ үү."
    ].join("\n"),
    [
      createQuickReply("Батлах", "SUBMIT_COMPLAINT"),
      createQuickReply("Засах", "EDIT_COMPLAINT"),
      createQuickReply("Цуцлах", "CANCEL_COMPLAINT")
    ]
  );
}

function buildFeedbackIntro() {
  return createQuickReplyMessage(
    [
      "Таны санал бидэнд чухал. 💡",
      "Санал, хүсэлтээ шууд бичээд илгээнэ үү."
    ].join("\n"),
    [
      createQuickReply("Үндсэн цэс", "SHOW_MENU")
    ]
  );
}

function buildFeedbackSummary(state) {
  return createQuickReplyMessage(
    [
      "Таны саналын хураангуй 💡",
      `Санал: ${state.feedback}`,
      "Илгээх эсвэл засах сонголтоо хийнэ үү."
    ].join("\n"),
    [
      createQuickReply("Илгээх", "SUBMIT_FEEDBACK"),
      createQuickReply("Засах", "EDIT_FEEDBACK"),
      createQuickReply("Цэс", "SHOW_MENU")
    ]
  );
}

function buildOperatorMessage() {
  return createButtonTemplate("Оператортой холбогдох бол доорх дугаараар холбогдоно уу. 🤝", [
    createPostbackButton("77144411", "SHOW_OPERATOR_NUMBER"),
    createPostbackButton("Цэс", "SHOW_MENU")
  ]);
}

function normalizeInput(text) {
  return text.trim().toLowerCase();
}

function getIntentFromInput(text) {
  const mapping = {
    MENU_COMPLAINT: INTENT_COMPLAINT,
    START_COMPLAINT: INTENT_COMPLAINT,
    MENU_FEEDBACK: INTENT_FEEDBACK,
    MENU_OPERATOR: INTENT_OPERATOR
  };

  return mapping[text] || null;
}

function isPositiveAnswer(text) {
  return POSITIVE_ANSWERS.has(text);
}

function isNegativeAnswer(text) {
  return NEGATIVE_ANSWERS.has(text);
}

function isHelpCommand(text) {
  return HELP_COMMANDS.has(text);
}

function isResetCommand(text) {
  return RESET_COMMANDS.has(text);
}

function isSubmitCommand(text) {
  return SUBMIT_COMMANDS.has(text);
}

function isEditCommand(text) {
  return EDIT_COMMANDS.has(text);
}

function validateName(text) {
  const value = text.trim();

  if (value.length < 2) {
    return "Нэрээ арай дэлгэрэнгүй бичнэ үү.";
  }

  return null;
}

function validatePhone(text) {
  const digits = text.replace(/\D/g, "");

  if (digits.length < 8) {
    return "Утасны дугаараа 8 ба түүнээс дээш оронтой оруулна уу.";
  }

  return null;
}

function normalizePlate(text) {
  return text.trim().toUpperCase().replace(/\s+/g, "");
}

function validatePlate(text) {
  const plate = normalizePlate(text);
  const platePattern = /^\d{4}[A-ZА-ЯӨҮ]{3}$/u;

  if (!platePattern.test(plate)) {
    return "Машины дугаараа зөв форматаар оруулна уу. Жишээ: 1234УБА";
  }

  return null;
}

function extractPlateFromText(text) {
  const match = text.match(/(\d{4}\s?[A-Za-zА-Яа-яӨөҮү]{3})/u);

  if (!match) {
    return "";
  }

  const plate = normalizePlate(match[1]);
  return validatePlate(plate) ? "" : plate;
}

function validateComplaint(text) {
  const value = text.trim();

  if (value.length < 10) {
    return "Гомдлоо арай дэлгэрэнгүй бичнэ үү.";
  }

  return null;
}

function validateLocation(text) {
  const value = text.trim();

  if (value.length < 3) {
    return "Байршил эсвэл зогсоолын нэрийг тодорхой бичнэ үү.";
  }

  return null;
}

function isSkipImage(text) {
  return ["алга", "alga", "байхгүй", "baihgui", "skip"].includes(normalizeInput(text));
}

function getAttachmentUrl(rawInput) {
  if (typeof rawInput === "string") {
    return "";
  }

  return rawInput?.attachmentUrl || "";
}

function validateFeedback(text) {
  const value = text.trim();

  if (value.length < 5) {
    return "Саналаа арай дэлгэрэнгүй бичнэ үү.";
  }

  return null;
}

function validateDetails(text) {
  const value = text.trim();

  if (value.length < 5) {
    return "Тайлбараа арай дэлгэрэнгүй бичнэ үү.";
  }

  return null;
}

function buildTicket(prefix, details) {
  const now = new Date();
  const createdAt = now.toISOString();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
  const uniquePart = randomUUID().split("-")[0].toUpperCase();
  const requestId = `${prefix}-${datePart}-${timePart}-${uniquePart}`;

  return {
    requestId,
    createdAt,
    ...details
  };
}

async function submitComplaint(senderId, userState) {
  const ticket = buildTicket("CMP", {
    complaint: userState.complaint,
    plate: userState.plate,
    imageUrl: userState.imageUrl || "",
    phone: userState.phone
  });

  console.log("NEW COMPLAINT:", ticket);
  let jiraIssueKey = "";
  let deduplicated = false;

  if (isJiraConfigured()) {
    const jiraIssue = await createComplaintIssue(ticket);
    jiraIssueKey = jiraIssue.key;
    deduplicated = Boolean(jiraIssue.deduplicated);
    await linkIssueToSender(jiraIssueKey, senderId);
  }

  await resetUserState(senderId);

  return createQuickReplyMessage(
    [
      deduplicated
        ? "Ижил гомдлыг өмнөх бүртгэл дээр нэмлээ ✅"
        : "Таны гомдлыг амжилттай бүртгэлээ ✅",
      jiraIssueKey ? `Бүртгэлийн дугаар: ${jiraIssueKey}` : null,
      "Манай баг шалгаж, шаардлагатай бол тантай холбогдох болно.",
      "Баярлалаа 🙏"
    ].filter(Boolean).join("\n"),
    [
      createQuickReply("Үндсэн цэс", "SHOW_MENU")
    ]
  );
}

async function moveToMenu(senderId) {
  await resetUserState(senderId);
  await saveUserState(senderId, { step: "menu" });
  return buildWelcomeMessage();
}

async function startIntent(senderId, intent) {
  if (intent === INTENT_COMPLAINT) {
    await saveUserState(senderId, { step: "complaint", intent: INTENT_COMPLAINT });
    return [
      "Гомдлоо дэлгэрэнгүй бичнэ үү. 📝",
      "Заавал оруулах мэдээлэл:",
      "Машины дугаар",
      "Байршил",
      "Утас",
      "Зураг байвал хамт илгээж болно 🖼️"
    ].join("\n");
  }

  if (intent === INTENT_FEEDBACK) {
    await saveUserState(senderId, { step: "feedback", intent: INTENT_FEEDBACK });
    return buildFeedbackIntro();
  }

  if (intent === INTENT_OPERATOR) {
    await saveUserState(senderId, { step: "menu", intent: INTENT_OPERATOR });
    return buildOperatorMessage();
  }

  return buildWelcomeMessage();
}

async function getReplyForMessage(senderId, rawInput) {
  const text = typeof rawInput === "string" ? rawInput : rawInput?.text || "";
  const attachmentUrl = getAttachmentUrl(rawInput);
  const userState = await getUserState(senderId);
  const normalizedText = normalizeInput(text);
  const rawCommand = typeof rawInput === "string" ? rawInput : rawInput?.payload || normalizedText;
  const normalizedCommand = normalizeInput(rawCommand);
  const intent = getIntentFromInput(rawCommand);

  if (normalizedCommand === "show_menu") {
    return moveToMenu(senderId);
  }

  if (normalizedCommand === "show_help") {
    return buildHelpMessage();
  }

  if (normalizedCommand === "show_operator_number") {
    return createQuickReplyMessage(
      [
        "Операторын утас ☎️",
        "77144411",
        "Ажлын цагаар энэ дугаараар холбогдоно уу."
      ].join("\n"),
      [createQuickReply("Үндсэн цэс", "SHOW_MENU")]
    );
  }

  if (intent) {
    return startIntent(senderId, intent);
  }

  if (normalizedCommand === "decline_complaint") {
    return createQuickReplyMessage("Ойлголоо. Өөр зүйл хэрэгтэй бол үндсэн цэсийг нээгээрэй.", [
      createQuickReply("Үндсэн цэс", "SHOW_MENU")
    ]);
  }

  if (isHelpCommand(normalizedText)) {
    return buildHelpMessage();
  }

  if (isResetCommand(normalizedText)) {
    return moveToMenu(senderId);
  }

  switch (userState.step) {
    case "start":
      await saveUserState(senderId, { step: "menu" });
      return buildWelcomeMessage();

    case "menu":
      if (isPositiveAnswer(normalizedText)) {
        return startIntent(senderId, INTENT_COMPLAINT);
      }

      if (isNegativeAnswer(normalizedText)) {
        return createQuickReplyMessage(
          "Ямар нэг тусламж хэрэгтэй бол үндсэн цэснээс сонгоно уу.",
          [
            createQuickReply("Үндсэн цэс", "SHOW_MENU"),
            createQuickReply("Тусламж", "SHOW_HELP")
          ]
        );
      }

      return buildWelcomeMessage();

    case "name": {
      const nameError = validateName(text);

      if (nameError) {
        return nameError;
      }

      if (userState.intent === INTENT_FEEDBACK) {
        await saveUserState(senderId, { ...userState, step: "feedback" });
        return "Санал, хүсэлтээ бичнэ үү. 💬";
      }

      await saveUserState(senderId, { ...userState, name: text.trim(), step: "phone" });
      return "Холбоо барих утасны дугаараа оруулна уу.";
    }

    case "phone": {
      if (attachmentUrl && (!text || normalizedText === "image")) {
        await saveUserState(senderId, {
          ...userState,
          imageUrl: attachmentUrl,
          step: "phone"
        });

        return "Зураг хүлээж авлаа. 🖼️";
      }

      const phoneError = validatePhone(text);

      if (phoneError) {
        return phoneError;
      }

      if (userState.intent === INTENT_COMPLAINT) {
        const nextState = {
          ...userState,
          imageUrl: attachmentUrl || userState.imageUrl || "",
          phone: text.trim(),
          step: "submitted"
        };

        await saveUserState(senderId, nextState);
        return submitComplaint(senderId, nextState);
      }

      if (userState.intent === INTENT_FEEDBACK) {
        await saveUserState(senderId, { ...userState, phone: text.trim(), step: "feedback" });
        return "Санал, хүсэлтээ бичнэ үү.";
      }

      if (userState.intent === INTENT_OPERATOR) {
        await saveUserState(senderId, { ...userState, phone: text.trim(), step: "operator_details" });
        return "Операторт дамжуулах тайлбараа бичнэ үү.";
      }

      return moveToMenu(senderId);
    }

    case "complaint": {
      if (attachmentUrl && (!text || normalizedText === "image")) {
        await saveUserState(senderId, {
          ...userState,
          imageUrl: attachmentUrl,
          step: "complaint"
        });

        return [
          "Зураг хүлээж авлаа. 🖼️",
          "Одоо гомдлоо дэлгэрэнгүй бичнэ үү.",
          "Заавал оруулах мэдээлэл:",
          "Машины дугаар",
          "Байршил",
          "Утас"
        ].join("\n");
      }

      const complaintError = validateComplaint(text);

      if (complaintError) {
        return complaintError;
      }

      const detectedPlate = extractPlateFromText(text);

      if (!detectedPlate) {
        await saveUserState(senderId, {
          ...userState,
          complaint: text.trim(),
          imageUrl: attachmentUrl || userState.imageUrl || "",
          step: "complaint_plate"
        });

        return "Машины дугаар заавал хэрэгтэй. Машины дугаараа оруулна уу. Жишээ: 1234УБА 🚗";
      }

      const nextState = {
        ...userState,
        complaint: text.trim(),
        imageUrl: attachmentUrl || userState.imageUrl || "",
        plate: detectedPlate,
        step: "phone"
      };

      await saveUserState(senderId, nextState);
      return "Холбогдох утасны дугаараа оруулна уу. 📞";
    }

    case "complaint_plate": {
      if (attachmentUrl && (!text || normalizedText === "image")) {
        await saveUserState(senderId, {
          ...userState,
          imageUrl: attachmentUrl,
          step: "complaint_plate"
        });

        return "Зураг хүлээж авлаа. Одоо машины дугаараа оруулна уу. Жишээ: 1234УБА 🚗";
      }

      const plateError = validatePlate(text);

      if (plateError) {
        return plateError;
      }

      const nextState = {
        ...userState,
        imageUrl: attachmentUrl || userState.imageUrl || "",
        plate: normalizePlate(text),
        step: "phone"
      };

      await saveUserState(senderId, nextState);
      return "Холбогдох утасны дугаараа оруулна уу. 📞";
    }

    case "feedback": {
      const feedbackError = validateFeedback(text);

      if (feedbackError) {
        return feedbackError;
      }

      const nextState = {
        ...userState,
        feedback: text.trim(),
        step: "feedback_review"
      };

      await saveUserState(senderId, nextState);
      return buildFeedbackSummary(nextState);
    }

    case "operator_intro":
      return buildOperatorMessage();

    case "operator_details":
      return buildOperatorMessage();

    case "review": {
      if (normalizedCommand === "cancel_complaint") {
        return moveToMenu(senderId);
      }

      if (normalizedCommand === "edit_complaint") {
        await saveUserState(senderId, { step: "complaint", intent: INTENT_COMPLAINT });
        return "Гомдлоо дахин дэлгэрэнгүй бичнэ үү. 📝";
      }

      if (normalizedCommand === "submit_complaint" || isSubmitCommand(normalizedText)) {
        return submitComplaint(senderId, userState);
      }

      if (isNegativeAnswer(normalizedText) || isEditCommand(normalizedText)) {
        await saveUserState(senderId, { step: "complaint", intent: INTENT_COMPLAINT });
        return "Гомдлоо дахин дэлгэрэнгүй бичнэ үү. 📝";
      }

      return createQuickReplyMessage("Сонголтоо доороос хийнэ үү.", [
        createQuickReply("Батлах", "SUBMIT_COMPLAINT"),
        createQuickReply("Засах", "EDIT_COMPLAINT"),
        createQuickReply("Цуцлах", "CANCEL_COMPLAINT")
      ]);
    }

    case "feedback_review": {
      if (["submit_feedback", "илгээх", "ilgeeh"].includes(normalizedCommand) || isSubmitCommand(normalizedText)) {
        const ticket = buildTicket("FDB", {
          feedback: userState.feedback
        });
        console.log("NEW FEEDBACK:", ticket);
        let jiraIssueKey = "";
        let deduplicated = false;

        if (isJiraConfigured()) {
          const jiraIssue = await createFeedbackIssue(ticket);
          jiraIssueKey = jiraIssue.key;
          deduplicated = Boolean(jiraIssue.deduplicated);
        }

        await resetUserState(senderId);

        return createQuickReplyMessage(
          [
            deduplicated
              ? "Ижил санал саяхан ирсэн тул өмнөх Jira бүртгэл дээр нэмэгдлээ. ✅"
              : "Таны санал амжилттай хүлээн авлаа. ✅",
            jiraIssueKey ? `Issue key: ${jiraIssueKey}` : null,
            `Дотоод дугаар: ${ticket.requestId}`
          ].filter(Boolean).join("\n"),
          [createQuickReply("Үндсэн цэс", "SHOW_MENU")]
        );
      }

      if (["edit_feedback", "засах", "zasah"].includes(normalizedCommand) || isEditCommand(normalizedText)) {
        await saveUserState(senderId, { step: "feedback", intent: INTENT_FEEDBACK });
        return "Саналаа дахин бичнэ үү. 💬";
      }

      if (normalizedCommand === "show_menu") {
        return moveToMenu(senderId);
      }

      return buildFeedbackSummary(userState);
    }

    case "operator_review":
      return buildOperatorMessage();

    default:
      return moveToMenu(senderId);
  }
}

module.exports = {
  getReplyForMessage
};