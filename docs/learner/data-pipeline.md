# Data pipeline (public demo)

## Decision: **static JSON baked into the repo** (not live Google Sheets)

### Why
- This codebase already serves learner content from `data/**/*.json` at runtime.
- There is **no Google Sheets integration** in the current source (no Sheets scripts, no service-account JSON).
- Curriculum is distilled from Muallim TXT + curated JSON; mushaf/WBW/search indexes are build-time artifacts.
- Static JSON is more reliable for a public portfolio demo: no quota, no broken Sheets links, no secrets for data access.

### Runtime
| Surface | Data source |
|---------|-------------|
| Web (Next.js) | Reads `data/` on the server (API routes + pages) |
| Iqra APK | Copies `data/` via `offline-apk/scripts/sync-data.sh` into the install bundle |

### Optional rebuild scripts (dev only, not needed for deploy)
- `scripts/build-quran-search-data.sh`
- `scripts/fetch-quran-wbw-urdu.ts` / rebuild helpers
- `scripts/export-curriculum-from-txt.ts`, rule distill/enrich scripts

Never commit `.env.local` or API keys. Use `.env.example` / `.env.production.example`.
