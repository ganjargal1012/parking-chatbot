FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/ > /dev/null || exit 1

CMD ["npm", "start"]