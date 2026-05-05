const { createApp } = require("./src/app");
const { env, validateRuntimeConfig } = require("./src/config/env");
const { initializeStore } = require("./src/store/userStore");

async function bootstrap() {
  validateRuntimeConfig();
  await initializeStore();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});