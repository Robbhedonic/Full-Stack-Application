# Full-Stack Application

Production-oriented full-stack starter project with:

- Frontend: React + Vite
- Backend: Node.js + Express
- Code quality: ESLint + Prettier

This repository is designed to be a clean base for development, testing, Dockerization, and cloud deployment.

## Project Architecture

The app is split into two independent services:

- frontend: Single Page Application (SPA) served by Vite during development.
- backend: REST API built with Express.

During local development, the frontend proxies /api requests to the backend running on port 4000.

## Project Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── health.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .eslintignore
├── .prettierignore
├── .prettierrc
└── README.md
```

## Prerequisites

- Node.js 20+
- npm 10+

## Local Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Install backend dependencies:

```bash
cd ../backend
npm install
```

3. Create backend environment file:

```bash
cp .env.example .env
```

## Run Locally

Start backend (Terminal 1):

```bash
cd backend
npm run dev
```

Start frontend (Terminal 2):

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## API

### Health Check

- Method: GET
- Path: /api/health
- Response example:

```json
{
  "status": "ok",
  "timestamp": "2026-05-20T23:59:59.000Z"
}
```

## Available Scripts

Frontend (inside frontend):

- npm run dev: start Vite dev server
- npm run build: production build
- npm run preview: preview production build
- npm run lint: run ESLint checks
- npm run lint:fix: auto-fix lint issues
- npm run format: format files with Prettier
- npm run format:check: verify formatting

Backend (inside backend):

- npm run dev: start API with nodemon
- npm run start: start API with node
- npm run lint: run ESLint checks
- npm run lint:fix: auto-fix lint issues
- npm run format: format files with Prettier
- npm run format:check: verify formatting

## Code Quality

- ESLint is configured separately for frontend (React) and backend (Node.js).
- Prettier formatting rules are centralized at the repository root.

## Deployment Scope

This project is prepared to continue with:

- Dockerfiles for frontend and backend
- docker-compose for local container orchestration
- Cloud deployment (for example: backend on Render/Railway and frontend on Vercel/Netlify)

## Current Status

- Base full-stack structure created
- Frontend-backend integration working through /api proxy
- ESLint and Prettier configured
- Ready for Docker and cloud deployment steps
