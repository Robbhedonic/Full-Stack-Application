# PetCare

Full-stack booking platform for pet and plant care services.

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Prisma
- **Database:** PostgreSQL

## Project structure

### Repository tree

```text
.
├── frontend/                              # React 18 + Vite 5
│   ├── src/
│   │   ├── main.jsx                       # ReactDOM.createRoot → <App />
│   │   ├── App.jsx                        # SPA shell: pages, auth state, dashboard
│   │   ├── api.js                         # apiFetch(), API paths, credentials: include
│   │   ├── routes.js                      # pageToPath() / pathToPage() for browser URLs
│   │   ├── careOptions.js                 # PET/PLANT options, labels, booking summaries
│   │   ├── styles.css                     # Global layout, cards, messages, profile UI
│   │   ├── pages/
│   │   │   ├── ProfilePage.jsx            # Save profile (PUT /api/auth/profile)
│   │   │   └── AboutPage.jsx              # Static marketing copy
│   │   ├── images/                        # Hero / auth / home photos (webp, jpeg)
│   │   ├── routes.test.js                 # Vitest (2 tests)
│   │   └── careOptions.test.js            # Vitest (2 tests)
│   ├── index.html                         # Vite HTML shell
│   ├── vite.config.js                     # Port 5173, proxy /api → localhost:4000
│   ├── server.js                          # Docker: static dist + proxy /api → backend
│   ├── package.json                       # dev, build, test (vitest), lint
│   ├── package-lock.json
│   ├── .env.example                       # VITE_API_URL (optional in dev)
│   ├── .eslintrc.cjs
│   ├── .dockerignore
│   └── Dockerfile                         # Node image for frontend-only container
│
├── backend/                               # Node.js ESM + Express 4
│   ├── src/
│   │   ├── server.js                      # App entry: CORS, cookieParser, json, routers
│   │   ├── middleware/
│   │   │   ├── auth.js                    # SESSION_COOKIE, requireAuth → req.user
│   │   │   └── admin.js                   # requireAdmin (UserRole.ADMIN)
│   │   ├── routes/
│   │   │   ├── health.js                  # Public liveness probe
│   │   │   ├── auth.js                    # Register, login, profile, owner/caregiver CRUD
│   │   │   ├── sitters.js                 # GET list (owners / both only)
│   │   │   ├── bookings.js                # GET mine, POST create (owners)
│   │   │   ├── messages.js                # Threads, conversation, POST message
│   │   │   └── admin.js                   # GET /stats
│   │   └── lib/
│   │       ├── prisma.js                  # Shared PrismaClient
│   │       ├── sessions.js                # createSession / getSessionUserId / deleteSession
│   │       ├── serializers.js             # serializeUser, Sitter, Booking, Message, Thread
│   │       ├── accountMode.js             # owner | caregiver | both → UserRole
│   │       ├── careDetails.js             # Owner + booking pet/plant validation
│   │       ├── caregiverProfile.js        # Sitter profile parse + validate
│   │       ├── bookingAccess.js           # canCreateBookings, role checks
│   │       ├── bookingQueries.js          # listBookingsForUser (owner vs caregiver view)
│   │       ├── messageAccess.js           # canAccessThread, canSendMessage
│   │       └── userPrivacy.js             # serializePublicSitter, owner-only sitter list
│   ├── test/                              # 14 integration tests (node:test)
│   │   ├── helpers.js                     # resetTestState, loginAs, fetchSitters
│   │   ├── auth.test.js                   # Login, 401 without session
│   │   ├── health.test.js                 # Health + CORS headers
│   │   ├── petcare.test.js                # Sitters, bookings, isolation
│   │   ├── messages.test.js               # Owner ↔ caregiver thread
│   │   └── caregiver-register.test.js     # Register → both → caregiver listing
│   ├── prisma/
│   │   ├── schema.prisma                  # Models + enums (see table below)
│   │   ├── seed.js                        # 21 users, sitters, bookings, messages
│   │   └── migrations/
│   │       ├── 20260528220000_init/
│   │       ├── 20260528230000_add_admin_role/
│   │       ├── 20260529210000_add_pet_type/
│   │       ├── 20260601180000_sitter_profile_details/
│   │       ├── 20260602120000_user_profile_mode/
│   │       ├── 20260603140000_sitter_availability_dates/
│   │       ├── 20260628120000_owner_and_booking_care_details/
│   │       ├── 20260629100000_db_sessions/
│   │       └── 20260630120000_messages/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example                       # PORT, DATABASE_URL, FRONTEND_URL
│   ├── .eslintrc.cjs
│   ├── .dockerignore
│   └── Dockerfile                         # API container for docker-compose
│
├── .github/workflows/
│   ├── deploy.yml                         # Full CI on push/PR to main
│   ├── ci.yml                             # Lint + frontend tests on PRs
│   └── postdeploy-check.yml               # Manual smoke against live URL
│
├── .vscode/                               # launch.json, settings (optional)
├── scripts/
│   └── postdeploy-check.mjs               # curl /api/health + login smoke
├── Dockerfile                             # Production monolith (build frontend + API)
├── docker-compose.yml                     # db:5432, backend:4000, frontend:8080
├── railway.toml                           # migrate deploy on start (no repeat seed)
├── .gitignore                             # .env, node_modules, dist
├── .dockerignore
├── .prettierrc / .prettierignore
├── .eslintignore
└── README.md
```

### Local ports and services

| Service | Port | URL |
|---------|------|-----|
| Vite dev (frontend) | 5173 | http://localhost:5173/home |
| Express API (backend) | 4000 | http://localhost:4000/api/health |
| PostgreSQL (Docker) | 5432 | `postgresql://petcare:petcare@localhost:5432/petcare` |
| docker-compose UI | 8080 | http://localhost:8080 |
| Railway production | 8080 (in container) | `https://*.up.railway.app` |

### Database models (`backend/prisma/schema.prisma`)

| Model | Purpose |
|-------|---------|
| **User** | Account: email, bcrypt `passwordHash`, role, profile mode, owner care fields |
| **Session** | Server-side session id → `userId`, `expiresAt` (cookie `petcare_session`) |
| **SitterProfile** | Caregiver listing: type, pet types, availability, price, location |
| **Booking** | Owner books sitter: pet/plant care details, start time, duration, status |
| **Message** | Chat between one owner and one sitter (`sitterId` + `ownerId` + `senderId`) |

**Roles (`UserRole`):** `OWNER_PET`, `OWNER_PLANT`, `OWNER_MIXED`, `CAREGIVER`, `ADMIN`  
**Account modes (UI):** `owner`, `caregiver`, `both` (stored in `User.profileMode`)

### Frontend pages (browser URLs)

| Path | Component | Who uses it |
|------|-----------|-------------|
| `/home` | `App.jsx` (home) | Everyone |
| `/about` | `AboutPage.jsx` | Everyone |
| `/login`, `/register` | `App.jsx` (auth) | Guests |
| `/dashboard` | `App.jsx` | Logged-in owners / caregivers |
| `/profile` | `ProfilePage.jsx` | Logged-in users (edit mode & care details) |
| `/admin` | `App.jsx` (admin stats) | `admin@petcare.test` only |

### Backend API map (by file)

| File | Endpoints (prefix `/api`) | Auth |
|------|---------------------------|------|
| `health.js` | `GET /health` | No |
| `auth.js` | `POST /auth/register`, `login`, `logout` | No / session |
| `auth.js` | `GET /auth/me`, `GET /auth/protected` | Session |
| `auth.js` | `PUT /auth/profile`, `account-mode`, `owner-care` | Session |
| `auth.js` | `POST|PUT|DELETE /auth/caregiver-profile` | Session |
| `sitters.js` | `GET /sitters` | Session (owners / both) |
| `bookings.js` | `GET /bookings`, `POST /bookings` | Session |
| `messages.js` | `GET /messages/threads`, `GET /messages`, `POST /messages` | Session |
| `admin.js` | `GET /admin/stats` | Admin session |

### Security-related files

| File | Responsibility |
|------|----------------|
| `backend/src/server.js` | CORS whitelist (`FRONTEND_URL`), `credentials: true` |
| `backend/src/middleware/auth.js` | httpOnly cookie, `requireAuth`, 401 |
| `backend/src/middleware/admin.js` | Admin-only routes, 403 |
| `backend/src/lib/sessions.js` | Sessions in PostgreSQL (not in-memory) |
| `backend/src/routes/auth.js` | bcrypt hash/compare, never store plain passwords |
| `backend/src/lib/userPrivacy.js` | Owners cannot list other owners’ private data |
| `frontend/src/api.js` | `credentials: 'include'` on every request |
| `backend/.env.example` | Template only — real secrets in `.env` / Railway |

### Request flow (example: create booking)

```text
Browser (React)
  → api.js: POST /api/bookings + cookie
  → server.js: cors → cookieParser → json
  → bookings.js: requireAuth → req.user
  → bookingAccess.js: canCreateBookings?
  → careDetails.js: validate pet/plant fields
  → prisma: Booking.create
  → JSON { booking }
```

### npm scripts

**Backend (`cd backend`):**

| Script | Command |
|--------|---------|
| `npm run dev` | Nodemon API on port 4000 |
| `npm test` | 14 integration tests |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Demo users + data |

**Frontend (`cd frontend`):**

| Script | Command |
|--------|---------|
| `npm run dev` | Vite on port 5173 |
| `npm test` | 4 Vitest unit tests |
| `npm run build` | Production bundle → `dist/` |
| `npm run lint` | ESLint |

### What each layer does

| Layer | Role |
|-------|------|
| **frontend/src/App.jsx** | Auth state, dashboard, sitter list, booking form, messaging UI |
| **frontend/src/pages/ProfilePage.jsx** | Single `PUT /api/auth/profile` save |
| **frontend/src/api.js** | Central HTTP client for all API calls |
| **backend/src/server.js** | Wires middleware + routers; serves `public/` on Railway |
| **backend/src/routes/** | HTTP handlers per feature |
| **backend/src/lib/** | Validation, permissions, DB helpers (keeps routes thin) |
| **backend/prisma/** | Schema, migrations, reproducible seed |
| **backend/test/** | CI guarantees API + CORS + auth rules |
| **Dockerfile** (root) | One deployable image for Railway monolith |
| **docker-compose.yml** | Full local stack without Railway |

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

- **App (frontend + API):** https://full-stack-application-production-665e.up.railway.app
- **Health check:** https://full-stack-application-production-665e.up.railway.app/api/health
- **Home:** https://full-stack-application-production-665e.up.railway.app/home
- **Admin:** https://full-stack-application-production-665e.up.railway.app/admin

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
