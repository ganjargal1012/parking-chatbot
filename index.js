const { createApp } = require("./src/app");
const { env, validateRuntimeConfig } = require("./src/config/env");

validateRuntimeConfig();

const app = createApp();

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});