# PetCare

Full-stack booking platform for pet and plant care services.

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Prisma
- **Database:** PostgreSQL

## Project structure

```text
.
├── frontend/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── src/
├── docker-compose.yml
└── README.md
```

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
| GET | `/api/sitters` | No |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | Session |
| GET | `/api/auth/me` | Session |
| GET | `/api/admin/stats` | Admin only |
| GET | `/api/bookings` | Yes |
| POST | `/api/bookings` | Yes |

## CI

| Workflow | Trigger | What it runs |
|----------|---------|--------------|
| `deploy.yml` | Push to `main`, pull requests | PostgreSQL service, Prisma migrate + seed, backend lint + **6 tests**, frontend lint + build |
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

Migrations and seed run in Railway's **pre-deploy** step (`railway.toml`), then the server starts with `npm start`.

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
- ✅ `All migrations have been successfully applied`
- ✅ `Seed complete`
- ✅ `API listening on 0.0.0.0:...`
- ❌ `P1012` → `DATABASE_URL` not linked
- ❌ `Can't reach database server` → Postgres not running or not linked

### 6. GitHub Actions smoke test (optional)

After deploy, run **Actions → Post-Deploy Check → Run workflow** and paste your Railway URL.

## Deployed URLs

_Add after deployment:_

- App (frontend + API): https://YOUR-APP.up.railway.app
- Health: https://YOUR-APP.up.railway.app/api/health
