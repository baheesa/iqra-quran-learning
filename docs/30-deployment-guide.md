# 30 - Deployment Guide

> Deploy the Quran Learning App for daily production use.

---

## Prerequisites

- Node.js 22+
- pnpm 9.15.x
- PostgreSQL (Supabase recommended)
- Supabase Auth project
- Optional: OpenAI API key (OCR / Teacher)

---

## Environment

Copy `.env.example` → `.env.local` (or platform secrets).

**Required for production**

| Variable | Notes |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Pooled Postgres URL |
| `DIRECT_URL` | Direct URL for migrations |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser |
| `AUTH_PROVIDER` | `supabase` |

**Must NOT set in production**

| Variable | Rule |
|----------|------|
| `ADMIN_OPEN_LOCAL` | Forbidden (`1`/`true` will fail policy checks) |
| `ADMIN_PROVIDER=memory` | Do not use for real staff auth |
| Test headers `x-admin-role` | Ignored unless memory/test |

**Optional**

| Variable | Default |
|----------|---------|
| `OPENAI_API_KEY` | stubs if absent |
| `API_RATE_LIMIT` | `60` |
| `API_RATE_WINDOW_MS` | `60000` |
| `ADMIN_BOOTSTRAP_EMAIL` | unused when open-local off |

---

## Database

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

Backup: use Supabase automated backups or `pg_dump` on `DIRECT_URL`.  
Restore: restore dump, re-run migrate if schema lagging.

Volumes to persist in Docker:

- `data/` (learner, admin, sync, personalization, teacher)
- `knowledge/books/` (never overwrite `original/`)

---

## Build & run (Node)

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
pnpm start
```

### Low-memory hosts (~1GB RAM)

Next.js 15 + Node can run on **1GB** if the host is a real Node/VPS process (not PHP-only shared), and you:

1. **Build elsewhere** (CI / laptop). Never run `pnpm build` on the 1GB box — builds peak far above 1GB.
2. Run the standalone server with a capped heap:

```bash
pnpm start:low-mem
# or after `pnpm build` with output standalone:
pnpm start:standalone
```

`NODE_OPTIONS` defaults in Docker to `--max-old-space-size=512` so V8 leaves room for the OS.

3. Keep Postgres pool small, e.g. append to `DATABASE_URL`:

`?connection_limit=1&pool_timeout=10`

4. App-side memory habits already in place:

- Curriculum JSON is cached in-process (parsed once per file mtime)
- Mushaf pages use a **12-page LRU** (never load all 604 into RAM)
- Home RSC no longer ships duplicate word lists + full ayah Arabic for progress
- `openai` / Prisma stay `serverExternalPackages`

**Still not enough for many “shared Node” plans:** entry process caps, nightly killers, or no long-running Node. Prefer a **1GB VPS**, Railway, Render, or Vercel over Hostinger/Hostoy shared Pro.

Health:

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/ready` (503 if Quran data missing)

---

## Docker

```bash
docker build -t quran-learning-app .
docker run --env-file .env.production -p 3000:3000 \
  -v qls-data:/app/data \
  -v qls-knowledge:/app/knowledge/books \
  quran-learning-app
```

Or: `docker compose up --build` (uses `.env.local`).

Image uses Next **standalone** output.

---

## CI/CD

GitHub Actions: `.github/workflows/ci.yml`

Runs: install → prisma generate → lint → typecheck → test → build.

Deploy after green CI. Prefer:

1. Migrate DB
2. Roll out new containers / platform release
3. Verify `/api/v1/ready`
4. Smoke-read `/quran?page=1`

---

## Rollback

1. Redeploy previous image / commit
2. If migration was additive-only, old app usually still runs
3. Destructive migrations are avoided — if one appears, restore DB backup first
4. Knowledge originals are immutable — restore processed/exports from backup if needed

---

## Staff access checklist

1. Create Supabase user for maintainer
2. Assign `StaffMembership` via `/admin/roles` (with temporary open-local **only** on a staging box) or seed SQL
3. Confirm `ADMIN_OPEN_LOCAL` unset in production
4. Sign in → call admin APIs with Bearer token
