function createQuickReply(title, payload) {
  return {
    content_type: "text",
    title,
    payload
  };
}

function createQuickReplyMessage(text, quickReplies) {
  return {
    text,
    quick_replies: quickReplies
  };
}

function createPostbackButton(title, payload) {
  return {
    type: "postback",
    title,
    payload
  };
}

function createButtonTemplate(text, buttons) {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text,
        buttons
      }
    }
  };
}

function createGenericElement(title, subtitle, buttons) {
  return {
    title,
    subtitle,
    buttons
  };
}

function createGenericTemplate(elements) {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements
      }
    }
  };
}

module.exports = {
  createQuickReply,
  createQuickReplyMessage,
  createPostbackButton,
  createButtonTemplate,
  createGenericElement,
  createGenericTemplate
};