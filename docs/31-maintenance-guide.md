# 31 - Maintenance Guide

> Day-to-day operations for maintainers.

---

## Daily / weekly

| Task | How |
|------|-----|
| Health | Monitor `/api/v1/health` and `/api/v1/ready` |
| Error logs | JSON lines from app stdout (`level=error`) |
| Pending knowledge reviews | `/admin` dashboard |
| Publish only after validation | `/admin/knowledge/[slug]` → Validate → Publish |

---

## Knowledge maintenance

1. Place new PDFs under `knowledge/books/original/` (**never overwrite** existing names)
2. Import via admin books API / UI
3. OCR → extraction → human review
4. Approve pages
5. Validate → Publish (learners see APPROVED exports only)
6. Audit trail: `/admin/audit`

Rollback extraction: `/api/v1/admin/versions` with `applyToPage: true`

---

## Learner sync issues

- Guest reading always works offline (localStorage)
- Queued sync: `qls.offline.queue` in browser
- Merge conflicts: profile migration dialog — never auto-discard without confirmation
- Cloud snapshots: `data/sync/cloud/` or Prisma `LearnerCloudState`

---

## Secrets rotation

1. Rotate Supabase service role / anon keys in dashboard
2. Update platform env
3. Redeploy (no DB migrate needed)
4. Rotate `OPENAI_API_KEY` similarly
5. Never commit `.env*` with secrets

---

## Database

```bash
pnpm db:migrate:deploy   # production
pnpm db:studio           # local inspection only
```

Indexes added in Milestone 9 for review + audit hot paths.  
Avoid ad-hoc schema edits — use Prisma migrations.

Backup cadence: at least daily for Postgres; weekly volume snapshot for `data/` + `knowledge/`.

---

## Performance

- Quran pages are CDN/browser cacheable — purge CDN if page JSON files are replaced
- If API 429s spike, raise `API_RATE_LIMIT` or move limiter to Redis
- Inspect First Load JS via `pnpm build` output after large UI changes

---

## Incident playbook

| Symptom | Action |
|---------|--------|
| `/ready` 503 | Check `data/quran/pages/1.json` volume mount |
| Admin locked out | Confirm staff membership; never enable `ADMIN_OPEN_LOCAL` in prod |
| Teacher failing | Check `OPENAI_API_KEY`; stub path still returns calm Urdu guidance |
| Sync stuck | Flush offline queue after reconnect; inspect conflict log |
| High latency | Check DB pool + Quran cache headers |

---

## Do not

- Modify files in `knowledge/books/original/`
- Publish unverified extraction
- Expose stack traces or secrets in client responses
- Turn the app into a chatbot / quiz / social product (see `AGENTS.md`)
