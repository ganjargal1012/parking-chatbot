const express = require("express");

const webhookRouter = require("./routes/webhook");
const { getRuntimeStatus } = require("./services/monitoringService");

function captureRawBody(req, res, buffer) {
  if (!buffer || buffer.length === 0) {
    return;
  }

  req.rawBody = Buffer.from(buffer);
}

function createApp() {
  const app = express();

  app.use(express.json({ verify: captureRawBody }));
  app.use("/webhook", webhookRouter);

  app.get("/", (req, res) => {
    res.json({
      status: "ok",
      service: "parking-chatbot"
    });
  });

  app.get("/status", async (req, res) => {
    const status = await getRuntimeStatus();
    const statusCode = status.status === "ok" ? 200 : 503;

    res.status(statusCode).json(status);
  });

  return app;
}

module.exports = {
  createApp
};