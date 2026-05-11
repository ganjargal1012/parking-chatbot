const { createApp } = require("./src/app");
const { env, validateRuntimeConfig } = require("./src/config/env");
const { sendAlert } = require("./src/services/monitoringService");
const { initializeStore } = require("./src/store/userStore");

process.on("uncaughtException", async (error) => {
  console.error("Uncaught exception:", error);
  await sendAlert("uncaught_exception", {
    message: error.message,
    context: "process",
    stack: error.stack
  });
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  console.error("Unhandled rejection:", error);
  await sendAlert("unhandled_rejection", {
    message: error.message,
    context: "process",
    stack: error.stack
  });
});

async function bootstrap() {
  validateRuntimeConfig();
  await initializeStore();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error.message);
  sendAlert("startup_failure", {
    message: error.message,
    context: "bootstrap",
    stack: error.stack
  }).finally(() => {
    process.exit(1);
  });
});