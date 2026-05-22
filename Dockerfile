FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/. ./
RUN npm run build

FROM node:22-alpine AS backend-runtime
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/. ./
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 4000
CMD ["npm", "start"]