FROM node:22-alpine AS build
WORKDIR /app

RUN apk upgrade --no-cache

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app

RUN apk upgrade --no-cache

ENV NODE_ENV=production
ENV PORT=80

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY --from=build /app/dist ./dist

EXPOSE 80

CMD ["node", "server.js"]
