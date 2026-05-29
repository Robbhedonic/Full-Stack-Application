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

## Deployed URLs

_Add after deployment:_

- Frontend:
- Backend:
