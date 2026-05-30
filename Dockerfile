FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

RUN apk upgrade --no-cache

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/. ./
ENV VITE_API_URL=
RUN npm run build

FROM node:22-alpine AS backend-runtime
WORKDIR /app/backend

RUN apk upgrade --no-cache && apk add --no-cache openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend/. .
COPY --from=frontend-build /app/frontend/dist ./public

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
