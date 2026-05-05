# Parking Chatbot

Facebook Messenger webhook chatbot. Node.js + Express дээр ажиллана, Jira issue үүсгэнэ, Jira status update-ийг Messenger рүү буцааж мэдэгдэнэ.

## Handoff Summary

Одоогийн production stack:

1. App hosting: Render web service
2. Runtime: Docker + Node.js 20
3. Database: Supabase Postgres
4. Inbound channel: Facebook Messenger webhook
5. Ticketing: Jira Cloud

Одоогийн persistent data:

1. `conversation_states`: user conversation state
2. `issue_sender_map`: Jira issue key -> Messenger sender mapping

Health endpoint:

```text
GET /
```

Expected response:

```json
{"status":"ok","service":"parking-chatbot"}
```

## Architecture

Request flow:

1. Messenger event -> `/webhook`
2. Conversation logic -> reply generation
3. Complaint or feedback -> Jira issue/comment
4. Issue key mapping -> Supabase Postgres
5. Jira webhook -> `/webhook/jira`
6. Status change notification -> Messenger reply

Key runtime files:

1. [index.js](c:/Users/User/Desktop/parking-chatbot/index.js): app startup
2. [src/app.js](c:/Users/User/Desktop/parking-chatbot/src/app.js): Express app and health endpoint
3. [src/routes/webhook.js](c:/Users/User/Desktop/parking-chatbot/src/routes/webhook.js): Messenger and Jira webhooks
4. [src/services/conversationService.js](c:/Users/User/Desktop/parking-chatbot/src/services/conversationService.js): chatbot flow
5. [src/services/jiraService.js](c:/Users/User/Desktop/parking-chatbot/src/services/jiraService.js): Jira integration
6. [src/store/userStore.js](c:/Users/User/Desktop/parking-chatbot/src/store/userStore.js): state persistence
7. [src/db/postgres.js](c:/Users/User/Desktop/parking-chatbot/src/db/postgres.js): Postgres connection
8. [render.yaml](c:/Users/User/Desktop/parking-chatbot/render.yaml): Render service definition

## Production Config

Required environment variables:

```env
PORT=8080
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres
DATABASE_SSL=true
VERIFY_TOKEN=your_facebook_verify_token
PAGE_ACCESS_TOKEN=your_page_access_token
APP_SECRET=your_facebook_app_secret
SKIP_MESSENGER_SEND=false
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-jira-email
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=UBPARKING
JIRA_COMPLAINT_ISSUE_TYPE=[System] Incident
JIRA_FEEDBACK_ISSUE_TYPE=Task
JIRA_COMPLAINT_PRIORITY=
JIRA_FEEDBACK_PRIORITY=
JIRA_COMPLAINT_LABELS=chatbot,complaint
JIRA_FEEDBACK_LABELS=chatbot,feedback
JIRA_DUPLICATE_WINDOW_MINUTES=10
JIRA_WEBHOOK_SECRET=strong-random-secret
```

Runtime validation rules:

1. `PAGE_ACCESS_TOKEN` байвал `APP_SECRET` заавал байна.
2. Jira credentials бүрэн байвал `JIRA_WEBHOOK_SECRET` заавал байна.
3. `DATABASE_URL` байхгүй бол app memory fallback-оор асна.

Render blueprint дээр secret байдлаар оруулах key-үүд:

```text
DATABASE_URL
VERIFY_TOKEN
PAGE_ACCESS_TOKEN
APP_SECRET
JIRA_BASE_URL
JIRA_EMAIL
JIRA_API_TOKEN
JIRA_PROJECT_KEY
JIRA_COMPLAINT_PRIORITY
JIRA_FEEDBACK_PRIORITY
JIRA_WEBHOOK_SECRET
```

Default config нь [render.yaml](c:/Users/User/Desktop/parking-chatbot/render.yaml) дээр байна.

## Deployment

Render deploy flow:

1. GitHub руу push хийнэ.
2. Render `autoDeploy: true` тул шинэ commit орвол deploy автоматаар эхэлнэ.
3. Хэрэв auto deploy эхлэхгүй бол `Manual Deploy` -> `Deploy latest commit` хийнэ.
4. Deploy дууссаны дараа root health endpoint-ийг шалгана.

Local Docker run:

```powershell
docker build -t parking-chatbot .
docker run --env-file .env -p 8080:8080 parking-chatbot
```

Local app run:

```powershell
npm start
```

## Webhook Setup

Messenger webhook:

1. Callback URL: `https://parking-chatbot.onrender.com/webhook`
2. Verify token: `VERIFY_TOKEN`
3. Subscribe хийх event-үүд: `messages`, `messaging_postbacks`

Jira webhook:

1. URL: `https://parking-chatbot.onrender.com/webhook/jira`
2. Required header: `x-jira-webhook-secret`
3. Header value: `JIRA_WEBHOOK_SECRET`

## Supabase Postgres

Recommended connection type:

1. Supabase `Connect` -> `Direct` -> `Transaction pooler`
2. `Type = URI`
3. Pooler connection string-ийг `DATABASE_URL` дээр тавина

Expected behavior:

1. App startup үед `conversation_states` table автоматаар үүснэ
2. App startup үед `issue_sender_map` table автоматаар үүснэ
3. Render restart хийсэн ч conversation state болон issue mapping хадгалагдана

Хэрэв `DATABASE_URL` байхгүй бол:

1. app асна
2. table үүсэхгүй
3. бүх state RAM дээр хадгалагдана
4. restart дээр state алдагдана

## Verification Checklist

Deploy дараах үндсэн шалгалт:

1. `https://parking-chatbot.onrender.com/` -> `status: ok`
2. Messenger webhook verify success
3. Bot reply Messenger дээр ирж байна
4. Complaint үүсэхэд Jira issue үүсч байна
5. Supabase дээр `conversation_states` table байна
6. Supabase дээр `issue_sender_map` table байна
7. Jira status change дээр Messenger notification ирж байна

DB persistence шалгах:

1. Chatbot руу шинэ message явуулна
2. Supabase `conversation_states` дээр row/update орж байна уу шалгана
3. Complaint үүсгээд `issue_sender_map` дээр issue key хадгалагдсан эсэхийг шалгана

## Local Testing

Webhook flow-ийг local дээр Messenger send хийхгүй тестлэх:

```powershell
npm run test:webhook
```

Public tunnel:

```powershell
npm run tunnel
```

Үүссэн `https://...ngrok-free.app/webhook` URL-ийг Messenger webhook callback URL болгож local test хийж болно.

## Operations

Өдөр тутмын өөрчлөлтийн дараалал:

```powershell
git add .
git commit -m "your message"
git push
```

Push хийсний дараа:

1. Render deploy state-ийг шалгана
2. Root health endpoint-ийг шалгана
3. Нэг end-to-end test flow ажиллуулна

Secrets management:

1. `.env` болон production secret-үүдийг Git repo руу commit хийхгүй
2. Token эсвэл API key repo руу орсон бол тухайн secret-ийг rotate хийнэ
3. Render болон Supabase credential-үүдийг owner түвшинд хадгална

## Troubleshooting

`/webhook` дээр 403:

1. Browser-оор шууд нээсэн бол хэвийн
2. Meta verify request дээр `VERIFY_TOKEN` mismatch байж болно

Bot message авч байгаа ч reply өгөхгүй:

1. `PAGE_ACCESS_TOKEN` буруу эсвэл expired
2. `APP_SECRET` буруу
3. Messenger signature verify fail болж байгаа

Supabase table үүсэхгүй:

1. `DATABASE_URL` Render дээр уншигдаагүй
2. Placeholder password үлдсэн
3. `Save changes` хийсэн ч redeploy хийгээгүй

Jira webhook ажиллахгүй:

1. `x-jira-webhook-secret` header байхгүй
2. `JIRA_WEBHOOK_SECRET` mismatch
3. Jira status change payload дээр `status` field өөрчлөгдөөгүй

## Handoff Notes

Production handoff хийхэд заавал мэдэх зүйлс:

1. Render service URL: `https://parking-chatbot.onrender.com`
2. Render config source: [render.yaml](c:/Users/User/Desktop/parking-chatbot/render.yaml)
3. State persistence source: [src/store/userStore.js](c:/Users/User/Desktop/parking-chatbot/src/store/userStore.js)
4. Runtime config source: [src/config/env.js](c:/Users/User/Desktop/parking-chatbot/src/config/env.js)
5. Messenger webhook route: [src/routes/webhook.js](c:/Users/User/Desktop/parking-chatbot/src/routes/webhook.js)

Project-ийг дараагийн хүн аваад үргэлжлүүлэхэд хамгийн түрүүнд шалгах зүйл:

1. Render env secrets бүрэн эсэх
2. Supabase table-ууд харагдаж байгаа эсэх
3. Messenger webhook verify хэвийн эсэх
4. Jira webhook secret header тохирсон эсэх