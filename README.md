# PetCare

Full-stack booking platform for pet and plant care services.

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Prisma
- **Database:** PostgreSQL

## Live demo

| | URL |
|---|-----|
| **App (try it)** | https://full-stack-application-production-665e.up.railway.app/home |
| **API health** | https://full-stack-application-production-665e.up.railway.app/api/health |
| **Admin dashboard** | https://full-stack-application-production-665e.up.railway.app/admin |
| **Railway project** | https://railway.com/project/44bcd441-924e-4195-835a-b144cba0efc1?environmentId=94cb3579-55fc-456f-9e7b-91a816ec32e1 |

**Demo login** (password for all: `password123`):

| Role | Email |
|------|-------|
| Pet owner | `jane@petcare.test` |
| Caregiver | `luna@petcare.test` |
| Admin | `admin@petcare.test` |

## Project structure

```text
.
├── frontend/                 # React UI (Vite)
├── backend/                  # Express API + Prisma (main focus)
│   ├── src/
│   │   ├── server.js         # Express app, CORS, routes
│   │   ├── middleware/       # auth.js, admin.js
│   │   ├── routes/           # health, auth, sitters, bookings, messages, admin
│   │   └── lib/              # sessions, validation, permissions
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── test/                 # API integration tests (14)
├── docker-compose.yml
├── Dockerfile                # Railway deploy
└── README.md
```

### Backend (course essentials)

| Folder / file | Role |
|---------------|------|
| `server.js` | Entry point: CORS, cookies, JSON, mount `/api/*` routers |
| `middleware/auth.js` | Session cookie → `req.user` (401 if missing) |
| `middleware/admin.js` | Admin-only routes |
| `routes/` | REST handlers (login, bookings, messages, …) |
| `lib/sessions.js` | Sessions stored in PostgreSQL |
| `lib/` (other) | Validation, booking/message access, serializers |
| `prisma/schema.prisma` | Models: User, Session, SitterProfile, Booking, Message |
| `test/` | Automated API tests (`npm test`) |

**Local API:** http://localhost:4000 · **DB:** PostgreSQL on port 5432

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (PostgreSQL + optional full stack)

## Local setup (without Docker)

### 1. Database

Start PostgreSQL (example with Docker):

```bash
docker run --name petcare-db -e POSTGRES_USER=petcare -e POSTGRES_PASSWORD=petcare -e POSTGRES_DB=petcare -p 5432:5432 -d postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173/home** (admin dashboard: **http://localhost:5173/admin**)

## Seed users (password for all: `password123`)

| Role | Count | Example login |
|------|-------|----------------|
| Admin | 1 | `admin@petcare.test` → `/admin` dashboard |
| Pet owners | 5 | `jane@petcare.test`, `mike@petcare.test`, `sara@petcare.test`, `tom@petcare.test`, `emma@petcare.test` |
| Plant owners | 5 | `carlos@petcare.test`, `nina@petcare.test`, `oliver@petcare.test`, `rosa@petcare.test`, `ivy@petcare.test` |
| Mixed owners | 5 | `alex@petcare.test`, `taylor@petcare.test`, `jordan@petcare.test`, `casey@petcare.test`, `riley@petcare.test` |
| Caregivers | 5 | `luna@petcare.test`, `diego@petcare.test`, `mia@petcare.test`, `noah@petcare.test`, `zoe@petcare.test` |

**Total: 21 users** (plus sample bookings). All use password `password123`.

## Prisma commands

```bash
cd backend

npm run db:generate    # prisma generate
npm run db:migrate     # prisma migrate dev
npm run db:migrate:deploy
npm run db:seed        # prisma db seed
npm run db:studio      # Prisma Studio GUI
```

## Docker (full stack)

```bash
docker compose down
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

Migrations and seed run automatically when the backend container starts.

## API endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | No |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | Session cookie |
| GET | `/api/auth/me` | Session |
| PUT | `/api/auth/profile` | Session (mode + owner + caregiver in one body) |
| PUT | `/api/auth/account-mode` | Session |
| PUT | `/api/auth/owner-care` | Session |
| POST / PUT / DELETE | `/api/auth/caregiver-profile` | Session |
| GET | `/api/sitters` | Session (owners / both only) |
| GET | `/api/bookings` | Session |
| POST | `/api/bookings` | Session (owners) |
| GET | `/api/messages/threads` | Session |
| GET | `/api/messages?sitterId=&ownerId=` | Session |
| POST | `/api/messages` | Session |
| GET | `/api/admin/stats` | Admin only |

## CI

| Workflow | Trigger | What it runs |
|----------|---------|--------------|
| `deploy.yml` | Push to `main`, pull requests | PostgreSQL, migrate + seed, backend lint + **14 tests**, frontend lint + **4 tests** + build |
| `ci.yml` | Pull requests only | Fast lint (backend + frontend) without database |

## Tests

Requires PostgreSQL with migrations and seed applied:

```bash
cd backend
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm test
```

## Deploy on Railway

PetCare deploys as a **single service** (frontend + API on one URL). Railway uses the root `Dockerfile` and `railway.toml`.

### 1. Create the project

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project → Deploy from GitHub repo** → select this repository.
3. Railway detects `railway.toml` and builds with the root `Dockerfile`.

### 2. Add PostgreSQL (required)

The app **will not start** without a database. If deploy fails at **Healthcheck**, you likely skipped this step.

1. In the Railway project, click **+ New → Database → Add PostgreSQL**.
2. Wait until the Postgres service shows **Active**.
3. Open your **web service** (PetCare app, not Postgres).
4. Go to **Variables → + New variable → Add variable reference**.
5. Select the **PostgreSQL** service and choose **`DATABASE_URL`**.
6. Confirm the web service now shows `DATABASE_URL` (value hidden, linked to Postgres).

### 3. Set environment variables

On the **web service** (not the database), add:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Reference from Postgres plugin |
| `FRONTEND_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

Railway injects `PORT` and `RAILWAY_PUBLIC_DOMAIN` for you.

### 4. Public URL

1. Open the web service → **Settings → Networking**.
2. Click **Generate Domain** (e.g. `petcare-production.up.railway.app`).
3. Redeploy if needed after changing `FRONTEND_URL`.

### 5. Verify deployment

```bash
# Health check
curl https://YOUR-APP.up.railway.app/api/health

# Smoke test (from repo root)
node scripts/postdeploy-check.mjs https://YOUR-APP.up.railway.app
```

Open the app:

- Home: `https://YOUR-APP.up.railway.app/home`
- Admin: `https://YOUR-APP.up.railway.app/admin` (`admin@petcare.test` / `password123`)

Migrations and seed run when the container starts (`railway.toml` `startCommand`).

### Troubleshooting

**"DATABASE_URL is not set" / Prisma P1012 / Healthcheck failure:**

You deployed **without PostgreSQL**. Fix in this order:

1. **Stop redeploying** until Postgres exists — redeploy alone will not fix it.
2. Project → **+ New → Database → Add PostgreSQL**.
3. Open your **web app service** (not Postgres) → **Variables**.
4. **+ New Variable → Add variable reference** → pick PostgreSQL → `DATABASE_URL`.
5. Add `NODE_ENV=production` and `FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`.
6. **Settings → Networking → Generate Domain**.
7. **Deploy → Redeploy**.

Your project should show **two services**: the app + PostgreSQL. If you only see one, Postgres is missing.

**"Application failed to respond" (502) after successful deploy:**

The public **target port** must match the port in deploy logs (`API listening on 0.0.0.0:XXXX`).

1. **Deploy Logs** → find `API listening on 0.0.0.0:8080` (or another port)
2. **Settings → Networking** → edit your domain → set **Target port** to that same number (usually **8080**)
3. **Redeploy**

**Check deploy logs for:**
- OK: `All migrations have been successfully applied`
- OK: `Seed complete`
- OK: `API listening on 0.0.0.0:...`
- Error: `P1012` - `DATABASE_URL` not linked
- Error: `Can't reach database server` - Postgres not running or not linked

### 6. GitHub Actions smoke test (optional)

After deploy, run **Actions → Post-Deploy Check → Run workflow** and paste your Railway URL.

## Deployed URLs

See **[Live demo](#live-demo)** above. Quick links:

- **App:** https://full-stack-application-production-665e.up.railway.app/home
- **Health:** https://full-stack-application-production-665e.up.railway.app/api/health
- **Railway dashboard:** https://railway.com/project/44bcd441-924e-4195-835a-b144cba0efc1?environmentId=94cb3579-55fc-456f-9e7b-91a816ec32e1

Deployed on **Railway** (monolith: React build served by Express + PostgreSQL plugin).

## Reflection questions

### 1. Why did you choose this deployment platform? What were the alternatives you considered?

I chose **Railway** because the project already had a root `Dockerfile` and `railway.toml`, and a single public URL simplifies cookies, CORS, and the demo. Alternatives considered were **Render + Vercel** (split frontend/backend), **Azure App Service** (better for enterprise portfolios), and **Fly.io**. Railway was the fastest path to a working production deploy with built-in PostgreSQL.

### 2. What challenges did you face with Docker? How did you solve them?

Main challenges: (1) the app needed PostgreSQL before Prisma migrations could run — fixed by adding a Postgres service and linking `DATABASE_URL`; (2) healthcheck failures when the public port did not match the app port — fixed by setting Railway target port to **8080**; (3) nginx base image vulnerability warnings in local docker-compose — replaced nginx with a small **Node + Express** static server in `frontend/Dockerfile`. We also run `apk upgrade` in Alpine stages to patch OS packages.

### 3. How did you handle environment variables and secrets in production vs locally?

Locally, secrets live in `backend/.env` (from `.env.example`) and are gitignored. In production, Railway injects `DATABASE_URL`, `PORT`, and `RAILWAY_PUBLIC_DOMAIN`; i set `NODE_ENV=production` and `FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`. No secrets are baked into Docker images or committed to GitHub.

### 4. What would you do differently if you had one more week?

Split frontend and backend into separate Railway/Vercel services with stricter CI smoke tests after every deploy, add E2E tests (Playwright), and automate the post-deploy GitHub Action on every release. Sessions already persist in PostgreSQL (`Session` model).

### 5. How did you ensure that authentication still works after deployment?

Auth uses **httpOnly cookies** (`petcare_session`) with `credentials: 'include'` on all API calls. CORS allows only `FRONTEND_URL`. On Railway, frontend and API share the same origin (monolith), so cookies work without cross-site complexity. Login, logout, protected bookings, and admin routes were tested on the live URL.

## Security checklist (production)

| # | Requirement | Status | How we verified |
|---|-------------|--------|-----------------|
| 1 | No secrets committed | Yes | `.env` gitignored; Railway variables for `DATABASE_URL` |
| 2 | CORS restricted to frontend URL | Yes | `FRONTEND_URL` in `backend/src/server.js` — not `*` |
| 3 | No tokens in localStorage | Yes | Session cookie only via `petcare_session` |
| 4 | `credentials: 'include'` on auth requests | Yes | `frontend/src/api.js` |
| 5 | Docker image has no `.env` or host `node_modules` | Yes | `.dockerignore` excludes both |
| 6 | HTTPS on deployed backend | Yes | Railway provides HTTPS on `*.up.railway.app` |
| 7 | Auth uses deployed URL, not localhost | Yes | `FRONTEND_URL` set to Railway public domain |

## Demo accounts (production seed)

All passwords: `password123`

| Role | Email |
|------|-------|
| Admin | `admin@petcare.test` |
| Pet owner | `jane@petcare.test` |
| Caregiver | `luna@petcare.test` |
