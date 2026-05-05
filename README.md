# Parking Chatbot

Node.js + Express дээр суурилсан Facebook Messenger webhook chatbot.

## Production Deploy

Local `ngrok`-оос production руу гаргахын тулд энэ repo одоо Docker-оор deploy хийхэд бэлэн.

### Required secrets

Production environment дээр дараах secret-үүдийг platform-ийнхаа secret manager дээр тохируулна:

```env
PORT=8080
VERIFY_TOKEN=your_facebook_verify_token
PAGE_ACCESS_TOKEN=your_facebook_page_access_token
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

### Docker build

```powershell
docker build -t parking-chatbot .
```

### Docker run

```powershell
docker run --env-file .env -p 8080:8080 parking-chatbot
```

### Permanent server options

1. VPS or VM
Use Docker дээр deploy хийгээд domain-оо reverse proxy-оор `/webhook` болон `/webhook/jira` руу заана.

2. Render, Railway, Fly.io
Dockerfile-аа шууд ашиглаад environment secret-үүдээ platform дээрээ оруулна.

3. Azure App Service or Container Apps
Docker image push хийгээд custom domain + HTTPS холбож өгнө.

## Render Deploy

Render дээр deploy хийх бол энэ repo доторх [render.yaml](render.yaml)-ийг ашиглана.

### Render steps

1. Repo-гаа GitHub руу push хийнэ.
2. Render дээр `Blueprint` эсвэл `New Web Service` үүсгэнэ.
3. Repo connect хийхэд Render `render.yaml`-ийг уншаад Docker service үүсгэнэ.
4. `sync: false` гэж тэмдэглэсэн env var бүрийг Render dashboard дээр secret хэлбэрээр оруулна.
5. Deploy дууссаны дараа Render domain дээр `GET /` нь `status: ok` буцааж байгааг шалгана.
6. Facebook callback URL-г `https://your-render-domain/webhook` болгоно.
7. Jira webhook URL-г `https://your-render-domain/webhook/jira` болгоно.
8. Jira webhook header дээр `x-jira-webhook-secret` нэмээд `JIRA_WEBHOOK_SECRET`-тэй ижил утга өгнө.

### Render secrets to set

```text
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

### After deploy

1. Facebook webhook callback URL-г `https://your-domain/webhook` болгоно.
2. Jira webhook URL-г `https://your-domain/webhook/jira` болгоно.
3. Jira webhook request header дээр `x-jira-webhook-secret`-ийг `JIRA_WEBHOOK_SECRET`-тэй ижил утгаар явуулна.
4. `GET /` endpoint-оор health check хийнэ.

## Run

```powershell
npm start
```

## Local webhook test

Messenger API руу бодит мессеж илгээхгүйгээр webhook flow шалгахын тулд:

```powershell
npm run test:webhook
```

## Public webhook with ngrok

Local серверээ асаасны дараа:

```powershell
npm run tunnel
```

Үүссэн `https://...ngrok-free.app/webhook` URL-ийг Facebook app/webhook тохиргоонд ашиглана.

## Environment

`.env` файл:

```env
PORT=4000
VERIFY_TOKEN=ubparking_test
PAGE_ACCESS_TOKEN=your_page_access_token
SKIP_MESSENGER_SEND=false
```