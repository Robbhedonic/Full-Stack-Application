# PetCare

PetCare is a full-stack booking platform for pet and plant care services.

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Docker:** separate frontend and backend images + `docker-compose.yml`

## Project structure

```text
.
├── frontend/          # React SPA (PetCare UI)
├── backend/           # Express REST API
├── docker-compose.yml
├── Dockerfile         # optional single-service image (e.g. Railway)
└── README.md
```

## Local development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional, for container testing)

### Install

```bash
cd frontend && npm install
cd ../backend && npm install
cp backend/.env.example backend/.env
```

### Run

Terminal 1 — API:

```bash
cd backend
npm run dev
```

Terminal 2 — UI:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173/home** (`/` redirects to `/home`).

- API: http://localhost:4000

## Docker

Build and run both services:

```bash
docker compose up -d --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| Backend  | http://localhost:4000 |

Stop:

```bash
docker compose down
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/sitters` | List sitters |
| GET | `/api/bookings` | List bookings |
| POST | `/api/bookings` | Create booking |

## Tests

```bash
cd backend
npm test
```

## GitHub Actions

- **CI** (`.github/workflows/ci.yml`): lint + frontend build on push/PR.
- **Post-Deploy Check** (manual): smoke test against your deployed URL.

```bash
node scripts/postdeploy-check.mjs https://your-deployed-url.example
```

## Assignment checklist (final module)

| Requirement | Status |
|-------------|--------|
| `/backend` + `/frontend` structure | Done |
| Dockerfiles + docker-compose | Done |
| Deploy to cloud (URL in README) | TODO — add your live URLs |
| Auth in production (login/logout) | TODO — mock UI exists; wire real auth + cookies for submission |
| Tests + 2 production-like tests | Partial — health + booking tests exist |
| `deploy.yml` CI with tests on `main` | TODO |
| README: URLs, Docker, reflections | TODO |

## Reflection questions (add before presentation)

1. Why did you choose your deployment platform? What alternatives did you consider?
2. What challenges did you face with Docker? How did you solve them?
3. How did you handle environment variables and secrets in production vs locally?
4. What would you do differently if you had one more week?
5. How did you ensure authentication works after deployment?

## Deployed URLs

_Add after deployment:_

- Frontend:
- Backend:
