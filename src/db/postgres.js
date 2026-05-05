const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || "";
const shouldUseSsl = connectionString && process.env.DATABASE_SSL !== "false";

let pool;

function isDatabaseConfigured() {
  return Boolean(connectionString);
}

function getDatabaseConfigSummary() {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      ssl: false,
      host: ""
    };
  }

  try {
    const parsed = new URL(connectionString);

    return {
      configured: true,
      ssl: Boolean(shouldUseSsl),
      host: parsed.hostname || "",
      port: parsed.port || "",
      database: parsed.pathname.replace(/^\//, "")
    };
  } catch {
    return {
      configured: true,
      ssl: Boolean(shouldUseSsl),
      host: "unparsed"
    };
  }
}

function getPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

async function query(text, params) {
  const activePool = getPool();

  if (!activePool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return activePool.query(text, params);
}

module.exports = {
  getDatabaseConfigSummary,
  isDatabaseConfigured,
  query
};