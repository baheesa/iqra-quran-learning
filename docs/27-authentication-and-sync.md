# 27 - Authentication & Cloud Sync

> Identity and synchronization only. The Learning Engine and AI Teacher stay unchanged.

---

## Purpose

- Secure authentication via Supabase Auth (memory provider for tests / fallback)
- Guest mode remains fully usable for reading and learning
- Incremental sync of learner progress across devices
- Offline queue — reading is never blocked by connectivity
- Explicit migration merge when local and cloud both have data

---

## Architecture

```
createAuthSyncEngine()
  ├─ AuthService (memory | supabase)
  ├─ SessionManager
  ├─ SyncEngine
  ├─ ConflictResolver
  ├─ MigrationService
  ├─ CloudStorageAdapter (memory | file)
  ├─ OfflineQueue
  └─ BundleBuilder
```

Learning / Teacher / Personalization engines are **not** rewritten — sync wraps their file state in a `SyncBundle`.

---

## Authentication

Supported:

- Email + password (sign up / sign in)
- Password reset
- Email verification (Supabase-managed when using live Auth)
- Optional Google OAuth URL (`GET /api/v1/auth/google`)
- Guest mode (no account)

Session: client stores tokens in `localStorage` (`qls.auth.session`) and sends `Authorization: Bearer …`.

Set `AUTH_PROVIDER=memory` to force local auth without Supabase.

---

## Sync bundle

Includes:

- Learning state (vocabulary, rules, sessions, reflections, review)
- Reading slice (position, history, bookmarks)
- Teacher conversations
- Personalization preferences

Incremental: unchanged checksum → no upload.

Conflicts: `newer_wins` | `keep_local` | `keep_remote` | `merge` (timestamps).

---

## Migration

On first sign-in:

1. Preview local vs cloud
2. If both have data → ask user (`MergeProgressDialog`)
3. Apply merge / keep cloud / upload local

---

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/signup` | Register |
| POST | `/api/v1/auth/signin` | Sign in |
| POST | `/api/v1/auth/signout` | Sign out |
| POST | `/api/v1/auth/reset-password` | Password reset |
| GET | `/api/v1/auth/profile` | Current user / guest |
| GET | `/api/v1/auth/google` | Google OAuth URL |
| GET/POST | `/api/v1/auth/sync` | Status / sync |
| POST | `/api/v1/auth/migrate` | Migration + confirm |
| POST | `/api/v1/auth/conflicts` | Resolve conflict |

---

## UI (Urdu)

- `/auth/login` `/auth/register` `/auth/forgot`
- `/auth/profile` — sync status + offline indicator
- Merge progress dialog after sign-in
- Guest continues via home “قرآن پڑھنا جاری رکھیں”

---

## Database

Migration `20260721220000_auth_cloud_sync`:

- `LearnerCloudState` (revision, checksum, payload JSON)
- `SyncConflictLog`

File fallback cloud store: `data/sync/cloud/` (when not using memory).

---

## Out of scope

- Payments / subscriptions
- Social features
- Push notifications
