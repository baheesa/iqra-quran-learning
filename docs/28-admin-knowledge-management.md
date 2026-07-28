# 28 - Admin & Knowledge Management

> Maintainer-only tools to import, review, verify, version, validate, and publish Muallim-ul-Quran knowledge. Learners never see draft or unverified content.

---

## Purpose

Protect the integrity of the knowledge base.

- Only verified / approved content may be published
- Original **TXT** (and PDFs, if present) are never overwritten
- Every important action is audited
- Roles separate Admin, Reviewer, and Viewer duties

---

## Primary import

1. Place `Unit N.txt` in `knowledge/books/original/`
2. Run `pnpm knowledge:import` (or Admin book import API)
3. Review source text → Extract → Approve → Validate → Publish

Admin book page shows: book name, import date, character count, section count, extraction / verification status.

**Run OCR** is under **Future OCR Import** and requires `OCR_ENABLED=1`.

---

## Roles

| Role | Capabilities |
|------|----------------|
| **Admin** | Import/delete/archive books, publish, manage roles, full review |
| **Reviewer** | OCR accept, approve/reject/edit extraction, validate, search |
| **Viewer** | Browse, search, inspect extraction / audit / versions |

Learners have **no** staff role.

---

## Architecture

```
createAdminEngine()
  ├─ RoleService
  ├─ AuditLogService
  ├─ VersionService
  ├─ KnowledgeValidationService
  ├─ PublicationService
  ├─ SearchService
  └─ AdminService
       └─ wraps KnowledgeEngine (import / OCR / extraction / export)
```

Storage:

- File: `data/admin/` (roles, audit, versions, publications, validation)
- Memory: tests (`ADMIN_PROVIDER=memory` or `NODE_ENV=test`)
- Prisma models: `StaffMembership`, `KnowledgeVersion`, `AuditLogEntry`, `PublicationRecord`

---

## Publication gate

```
Approve pages → Validate → Publish (export APPROVED only)
```

Validation checks:

- Missing references
- Duplicate vocabulary
- Duplicate rules
- Missing lessons (error if nothing approved)
- Invalid / broken page links

Publish **fails** if any validation **error** remains.

---

## APIs

| Route | Purpose |
|-------|---------|
| `/api/v1/admin/dashboard` | Stats |
| `/api/v1/admin/books` | List / import / archive / version |
| `/api/v1/admin/reprocess` | Re-run pipeline stages |
| `/api/v1/admin/ocr` | View / re-run / accept OCR |
| `/api/v1/admin/extraction` | View / edit / re-run |
| `/api/v1/admin/approval` | Approve / reject |
| `/api/v1/admin/publication` | Publish history + publish |
| `/api/v1/admin/validation` | Run / read validation |
| `/api/v1/admin/audit` | Audit log |
| `/api/v1/admin/roles` | Staff roles |
| `/api/v1/admin/search` | Knowledge search |
| `/api/v1/admin/versions` | Version list / rollback |

Existing `/api/v1/knowledge/approve|reject|reprocess|books` require staff permissions and write audit entries.

---

## UI

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard |
| `/admin/knowledge` | Books |
| `/admin/knowledge/[slug]` | Page review (image + OCR + JSON) |
| `/admin/search` | Search |
| `/admin/audit` | Audit log |
| `/admin/roles` | Role management |

---

## Auth notes

- Bearer session + `StaffMembership` role
- Non-production: set `ADMIN_OPEN_LOCAL=1` to opt in to local Admin (default **off**). Production always disables open-local.
- Tests may send `x-admin-role` + `x-admin-email` when `ADMIN_PROVIDER=memory`

---

## Invariants

1. Never modify files under `knowledge/books/original/`
2. Never export or publish non-APPROVED extraction
3. Every approve/edit creates a knowledge version
4. Educational content for learners stays APPROVED exports only
