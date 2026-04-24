# GymFlow

Gym management platform — monorepo with admin dashboard, public website, and REST API.

## Architecture

```
gymflow/
├── apps/
│   ├── admin/          # Next.js 15 App Router — admin dashboard (port 3000)
│   ├── api/            # Python FastAPI — REST API (port 8000)
│   └── web/            # Next.js 15 SSG — public website (port 3002)
├── packages/
│   ├── config/         # Shared ESLint, TypeScript, Tailwind presets
│   ├── shared/         # Shared Zod schemas and types
│   └── ui/             # shadcn/ui component library
├── docker-compose.yml  # Dev environment (Postgres, MinIO, all apps)
└── turbo.json          # Turborepo pipeline config
```

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Python 3.12
- Docker & Docker Compose (for database)

### Development Setup

```bash
# 1. Install frontend dependencies
pnpm install

# 2. Set up API
cd apps/api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cd ../..

# 3. Copy environment variables
cp .env.example .env

# 4. Start infrastructure (Postgres + MinIO)
docker compose up db minio -d

# 5. Run database migrations and seed
cd apps/api
source .venv/bin/activate
alembic upgrade head
python seed.py
cd ../..

# 6. Start all apps
pnpm dev                                    # admin (3000) + web (3002)
cd apps/api && uvicorn app.main:app --reload # API (8000)
```

### Docker Compose (full stack)

```bash
cp .env.example .env
docker compose up
```

Services: admin (:3000), API (:8000), web (:3002), Postgres (:5432), MinIO (:9000).

### Seed User

- Email: `admin@gymflow.local`
- Password: `admin123`

## Stack

| Layer | Technology |
|-------|-----------|
| Admin | Next.js 15 (App Router) + shadcn/ui + Tailwind |
| Web | Next.js 15 (SSG) + Tailwind |
| API | Python 3.12 + FastAPI + SQLAlchemy 2.x + Alembic |
| Database | PostgreSQL 16 |
| Storage | MinIO (S3-compatible) |
| Auth | NextAuth v5 (admin) + JWT (API) |
| Monorepo | pnpm workspaces + Turborepo |
| CI | GitHub Actions |

## Scripts

```bash
pnpm dev          # Start admin + web in dev mode
pnpm build        # Build all frontend packages
pnpm lint         # Lint all frontend packages
pnpm typecheck    # TypeScript check all frontend packages
```

## Conventions

- Frontend packages use TypeScript strict mode
- API uses Pydantic v2 for request/response validation
- Database migrations managed with Alembic
- All tables include `id` (UUID), `created_at`, `updated_at`, `branch_id` (nullable)
