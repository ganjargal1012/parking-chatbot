const { createApp } = require("./src/app");
const { env, validateRuntimeConfig } = require("./src/config/env");
const { initializeStore } = require("./src/store/userStore");
const { getDatabaseConfigSummary } = require("./src/db/postgres");

async function bootstrap() {
  validateRuntimeConfig();
  const databaseConfig = getDatabaseConfigSummary();

  if (databaseConfig.configured) {
    console.log(
      "Database persistence enabled:",
      JSON.stringify({
        host: databaseConfig.host,
        port: databaseConfig.port,
        database: databaseConfig.database,
        ssl: databaseConfig.ssl
      })
    );
  } else {
    console.log("Database persistence disabled: DATABASE_URL is not set.");
  }

  await initializeStore();
  console.log("Store initialization complete.");

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});