# 29 - Production Readiness

> Milestone 9 — performance, security, reliability, accessibility, and observability without new educational features.

---

## Assessment

| Area | Status |
|------|--------|
| Security (admin lock, rate limits, headers) | Ready |
| Error UX (boundaries, safe API errors) | Ready |
| Health / readiness | Ready |
| Quran API caching | Ready |
| CI + Docker | Ready |
| Accessibility baseline | Improved |
| Offline reading + sync queue | Verified |
| Multi-region rate limiting | Limitation (in-memory) |
| Full PWA / service worker | Not in scope |
| Knowledge source | **TXT primary**; Vision OCR optional (`OCR_ENABLED`) |

**Verdict:** Suitable for controlled production daily use with documented limitations.

---

## Performance improvements

| Change | Before | After |
|--------|--------|-------|
| Quran page API | No Cache-Control | `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` |
| Quran meta API | Uncached | `max-age=300 / s-maxage=3600` |
| Teacher panel | Eager client import in reader | `next/dynamic` + `ssr: false` (route-level split) |
| Next config | Default | `compress`, `standalone`, `optimizePackageImports`, image AVIF/WebP |
| Prisma | Single-column review indexes | Composite `[learnerId, nextReviewAt]` + audit composites |

Measure via `pnpm build` First Load JS and `/api/v1/quran/page/1` response headers.

---

## Security improvements

1. **`ADMIN_OPEN_LOCAL` locked**
   - Production: always off; boot/middleware asserts it is not set
   - Non-prod: **opt-in only** (`ADMIN_OPEN_LOCAL=1`)
2. Knowledge mutation routes require staff permissions (OCR, extraction, pages, verification, exports)
3. Middleware: security headers + mutating API rate limit (default 60/min/IP+path)
4. Safe API errors — no stack traces to clients in production
5. `poweredByHeader: false`

---

## Error handling

- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` (Urdu, no stack traces)
- `lib/api/errors.ts` shared envelope
- Structured logs via `lib/observability/logger.ts`

---

## Accessibility

- Skip link on admin layout
- Page navigation `aria-label` + live region
- Offline indicator `role="status"` / `aria-live`
- Teacher textarea labeled; errors `role="alert"`
- Merge dialog `role="dialog"` + Escape / aria-modal
- Root remains `lang="ur" dir="rtl"`

---

## Monitoring

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health` | Liveness |
| `GET /api/v1/ready` | Readiness (Quran data critical; DB soft) |

Structured JSON logs: `level`, `message`, `service`, `ts`, optional timing.

---

## Testing

Expanded suite in `features/production/production-readiness.test.ts`:

- ADMIN_OPEN_LOCAL policy
- Rate limiting
- Reading page load
- Auth offline queue flush
- AI Teacher stub ask
- Admin publish permission gate

Quality gate: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`

---

## Known limitations

1. Rate limiter is **in-memory** (per instance)
2. Admin UI still relies on client Bearer tokens (localStorage) — APIs are gated; server HTML is not cookie-gated
3. No full PWA / offline Quran CDN cache beyond browser + localStorage progress
4. OpenAI / Supabase outages degrade teacher/auth; reading continues
5. File-backed knowledge/admin stores need volume mounts in containers
