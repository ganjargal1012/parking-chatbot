const users = {};
const issueToSenderMap = {};

function getUserState(senderId) {
  if (!users[senderId]) {
    users[senderId] = { step: "start" };
  }

  return users[senderId];
}

function saveUserState(senderId, nextState) {
  users[senderId] = nextState;
  return users[senderId];
}

function resetUserState(senderId) {
  users[senderId] = { step: "start" };
  return users[senderId];
}

function linkIssueToSender(issueKey, senderId) {
  if (!issueKey || !senderId) {
    return "";
  }

  issueToSenderMap[String(issueKey).toUpperCase()] = senderId;
  return senderId;
}

function getSenderIdByIssue(issueKey) {
  if (!issueKey) {
    return "";
  }

  return issueToSenderMap[String(issueKey).toUpperCase()] || "";
}

module.exports = {
  getUserState,
  saveUserState,
  resetUserState,
  linkIssueToSender,
  getSenderIdByIssue
};