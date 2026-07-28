# Milestone 1 — Foundation Setup

> Completed as part of project bootstrap. Authentication is intentionally deferred.

---

## What was set up

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS v4
- ESLint + Prettier
- Prisma 6 + PostgreSQL schema
- Supabase client configuration (no auth flows yet)
- Urdu-first UI shell (`dir="rtl"`, font hooks)
- Vitest foundation test
- Health API: `GET /api/v1/health`

---

## Local setup

1. Copy environment template:

```bash
cp .env.example .env.local
cp .env.local .env
```

2. Fill Supabase values in `.env` / `.env.local`:

- `DATABASE_URL` (pooler)
- `DIRECT_URL` (optional, for migrations)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Install and generate:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
```

4. Run:

```bash
pnpm dev
```

---

## Fonts

Place licensed files in `public/fonts/`:

- `JameelNooriNastaleeqRegular.ttf`
- `IndoPakQuran.ttf`

Until then, system Nastaliq / Arabic fallbacks are used.

---

## Not in this milestone

- Authentication / login UI
- Quran reader
- Curriculum content import
- AI teacher
