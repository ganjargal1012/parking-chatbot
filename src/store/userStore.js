const { env } = require("../config/env");
const { applyDefaultConversationState } = require("../services/conversationModeService");
const { isDatabaseConfigured, query } = require("../db/postgres");

const users = {};
const issueToSenderMap = {};

function getDefaultState() {
  return applyDefaultConversationState();
}

async function initializeStore() {
  if (!isDatabaseConfigured()) {
    return;
  }

  await query(`
    create table if not exists conversation_states (
      sender_id text primary key,
      state_json jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  await query(`
    create table if not exists issue_sender_map (
      issue_key text primary key,
      sender_id text not null,
      created_at timestamptz not null default now()
    )
  `);

  await query(
    `
      delete from conversation_states
      where updated_at < now() - ($1 * interval '1 hour')
    `,
    [env.conversationStateTtlHours]
  );
}

async function getUserState(senderId) {
  if (!senderId) {
    return getDefaultState();
  }

  if (!isDatabaseConfigured()) {
    if (!users[senderId]) {
      users[senderId] = getDefaultState();
    }

    return applyDefaultConversationState(users[senderId]);
  }

  const result = await query(
    `select state_json from conversation_states where sender_id = $1`,
    [senderId]
  );

  if (result.rowCount === 0) {
    return getDefaultState();
  }

  return applyDefaultConversationState(result.rows[0].state_json || getDefaultState());
}

async function saveUserState(senderId, nextState) {
  if (!senderId) {
    return getDefaultState();
  }

  if (!isDatabaseConfigured()) {
    users[senderId] = nextState;
    return users[senderId];
  }

  const result = await query(
    `
      insert into conversation_states (sender_id, state_json, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (sender_id)
      do update set
        state_json = excluded.state_json,
        updated_at = now()
      returning state_json
    `,
    [senderId, JSON.stringify(nextState)]
  );

  return result.rows[0].state_json || getDefaultState();
}

async function resetUserState(senderId) {
  return saveUserState(senderId, getDefaultState());
}

async function linkIssueToSender(issueKey, senderId) {
  if (!issueKey || !senderId) {
    return "";
  }

  const normalizedIssueKey = String(issueKey).toUpperCase();

  if (!isDatabaseConfigured()) {
    issueToSenderMap[normalizedIssueKey] = senderId;
    return senderId;
  }

  const result = await query(
    `
      insert into issue_sender_map (issue_key, sender_id, created_at)
      values ($1, $2, now())
      on conflict (issue_key)
      do update set sender_id = excluded.sender_id
      returning sender_id
    `,
    [normalizedIssueKey, senderId]
  );

  return result.rows[0]?.sender_id || "";
}

async function getSenderIdByIssue(issueKey) {
  if (!issueKey) {
    return "";
  }

  const normalizedIssueKey = String(issueKey).toUpperCase();

  if (!isDatabaseConfigured()) {
    return issueToSenderMap[normalizedIssueKey] || "";
  }

  const result = await query(
    `select sender_id from issue_sender_map where issue_key = $1`,
    [normalizedIssueKey]
  );

  return result.rows[0]?.sender_id || "";
}

module.exports = {
  initializeStore,
  getUserState,
  saveUserState,
  resetUserState,
  linkIssueToSender,
  getSenderIdByIssue
};