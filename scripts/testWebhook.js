const axios = require("axios");

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:4000";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "ubparking_test";

const webhookPayload = {
  object: "page",
  entry: [
    {
      messaging: [
        {
          sender: { id: "local-test-user" },
          message: { text: "Сайн уу" }
        },
        {
          sender: { id: "local-test-user" },
          message: { text: "тийм" }
        },
        {
          sender: { id: "local-test-user" },
          message: { text: "Бат Эрдэнэ" }
        },
        {
          sender: { id: "local-test-user" },
          message: { text: "99112233" }
        },
        {
          sender: { id: "local-test-user" },
          message: { text: "1234УБА" }
        },
        {
          sender: { id: "local-test-user" },
          message: { text: "Зогсоол дээр машин хааж тавьсан байна" }
        },
        {
          sender: { id: "local-test-user" },
          message: { text: "батлах" }
        }
      ]
    }
  ]
};

async function run() {
  const verifyResponse = await axios.get(`${BASE_URL}/webhook`, {
    params: {
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "challenge-ok"
    }
  });

  console.log("verify-status", verifyResponse.status);
  console.log("verify-body", verifyResponse.data);

  const webhookResponse = await axios.post(`${BASE_URL}/webhook`, webhookPayload, {
    headers: {
      "x-skip-messenger-send": "true"
    }
  });
  console.log("webhook-status", webhookResponse.status);
  console.log("webhook-body", webhookResponse.data);
}

run().catch((error) => {
  console.error("webhook-test-failed", error.response?.status || error.message);
  process.exit(1);
});