# PetCare

PetCare is a production-ready full-stack booking platform for pet and plant care services.

This repository demonstrates a modern web application with:

- Frontend: React + Vite
- Backend: Node.js + Express
- Dockerization for local and cloud deployment
- Tests for production-like behavior

## Project Overview

PetCare lets owners book care services from registered sitters.
The platform is designed to support:

- pet sitters and plant sitters
- availability and booking requests
- owner reservation management
- authenticated access for users and providers

## Architecture

The app is split into two services:

- `frontend`: React SPA built with Vite
- `backend`: Express REST API

During local development, the frontend fetches data from the backend API on port 4000.

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
│   ├── test/
│   │   └── health.test.js
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (for container testing)

## Local Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

Copy the backend environment file:

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

## API Endpoints

### Health Check

- Method: GET
- Path: `/api/health`
- Response example:

```json
{
  "status": "ok",
  "timestamp": "2026-05-20T23:59:59.000Z"
}
```

### Sitters

- Method: GET
- Path: `/api/sitters`
- Returns a list of available sitters, including pet and plant care providers.

### Bookings

- Method: GET
- Path: `/api/bookings`
- Returns current bookings.

- Method: POST
- Path: `/api/bookings`
- Body: `{ sitterId, ownerName, serviceType, startDate, durationHours }`
- Creates a new reservation request.

## Available Scripts

### Frontend (inside frontend)

- `npm run dev`: start Vite dev server
- `npm run build`: create production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint checks
- `npm run lint:fix`: fix lint issues
- `npm run format`: format files with Prettier
- `npm run format:check`: verify formatting

### Backend (inside backend)

- `npm run dev`: start API with nodemon
- `npm run start`: start API with node
- `npm run test`: run backend tests
- `npm run lint`: run ESLint checks
- `npm run lint:fix`: fix lint issues
- `npm run format`: format files with Prettier
- `npm run format:check`: verify formatting

## Code Quality

- ESLint is configured for frontend and backend code.
- Prettier formatting is used across the repository.

## Docker

Start both services locally with Docker Compose:

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker compose ps
```

Stop and remove containers:

```bash
docker compose down
```

Docker URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Current Status

- Core full-stack structure in place
- PetCare backend supports sitter listing and booking creation
- Frontend UI updated to browse sitters and submit booking requests
- Dockerfiles and Docker Compose configured
- Tests added for production-like backend behavior
- Prepared for cloud deployment and authentication setup

## Next Steps

- Add authentication for owners and sitters
- Implement sitter profiles and availability
- Add booking endpoints and reservation flows
- Deploy backend and frontend to cloud services
- Configure production authentication and CORS
- Add CI workflow to run tests on push to `main`

## Future Product Vision

PetCare can evolve into a full service marketplace for pet and plant caregivers:

- Owners book sitters by type, availability, and price
- Sitters manage bookings, schedules, and ratings
- The app can support multiple service categories and secure sessions

Run an automated smoke test against your public URL:

```bash
node scripts/postdeploy-check.mjs https://your-app.up.railway.app
```

This validates:

- `GET /` returns HTML
- `GET /api/health` returns `{ "status": "ok" }`

## GitHub Actions

This project includes two workflows:

- `CI`: runs on push to `main` and pull requests, validates backend and frontend (`lint` + frontend `build`).
- `Post-Deploy Check`: manual workflow (`workflow_dispatch`) to run smoke tests against your public deployed URL.

To run the post-deploy workflow:

1. Open your repository on GitHub.
2. Go to **Actions**.
3. Select **Post-Deploy Check**.
4. Click **Run workflow** and provide `app_url` (for example: `https://your-app.up.railway.app`).
