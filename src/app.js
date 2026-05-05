const express = require("express");

const webhookRouter = require("./routes/webhook");

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

  return app;
}

module.exports = {
  createApp
};