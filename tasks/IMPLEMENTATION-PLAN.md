Milestone 1 — Foundation

Task 1.1 Project Setup ✅

Task 1.2 Database ✅

Task 1.3 Authentication ⏳ deferred (explicitly not in this pass)

Task 1.4 UI Foundation ✅ (shell + fonts hooks; full reader later)

---------------------------------

Milestone 2 — Reading

Task 2.1 Quran Reader ✅

Task 2.2 Bookmarks ✅

Task 2.3 Progress ✅

Task 2.4 Dashboard ⏳ deferred (explicitly out of scope for this pass)

---------------------------------

Milestone 3 — Knowledge Engine

Task 3.1 Book import / discovery ✅

Task 3.2 Page extraction pipeline ✅

Task 3.3 OCR provider architecture ✅

Task 3.4 AI extraction architecture ✅

Task 3.5 Verification + JSON export ✅

---------------------------------

Milestone 3.5 — AI Extraction & Verification ✅

- OpenAI Vision OCR provider
- OpenAI extraction provider
- PromptBuilder (loads cursor/PROMPTS.md)
- VerificationEngine (+ REJECTED)
- KnowledgeImporter / KnowledgeExporter
- Admin review UI (OCR + JSON + approve/reject/reprocess)

---------------------------------

Milestone 4 — Learning Engine ✅

- Vocabulary stages + confidence model
- Spaced review (priority, not random)
- Rule / lesson progress
- Daily session (15–20 min) + reflection
- Learner dashboard (Urdu)
- Seed curriculum until knowledge exports ready

---------------------------------

Milestone 5 — AI Teacher ✅

- ContextBuilder + KnowledgeRetriever (APPROVED first)
- PromptService from cursor/PROMPTS.md
- Teacher / Conversation / Explanation / Suggestion services
- Teacher panel on Quran reader
- Stub path when OpenAI key absent

---------------------------------

Milestone 6 — Personalization & Intelligence ✅

- LearnerProfileService (derived from Learning Engine)
- Weakness / Strength analyzers
- Recommendations + StudyPlanner (non-random)
- InsightService + AdaptationEngine → AI Teacher
- Dashboard personalization panel

---------------------------------

Milestone 7 — Authentication & Cloud Sync ✅

- Supabase Auth (+ memory provider for tests)
- Guest mode preserved
- SyncEngine + OfflineQueue + ConflictResolver
- Migration with user confirmation
- Auth UI (login / register / forgot / profile)

---------------------------------

Milestone 8 — Admin & Knowledge Management ✅

- Role-based access: Admin / Reviewer / Viewer
- AdminService, KnowledgeValidationService, AuditLogService, VersionService, PublicationService, RoleService
- Book archive/version (original PDFs never overwritten)
- OCR review + extraction edit/approve/reject with versioning
- Validation gate before publish; learners only see APPROVED exports
- Dashboard `/admin`, search, audit, roles UI
- Prisma: StaffMembership, KnowledgeVersion, AuditLogEntry, PublicationRecord
- Docs: `docs/28-admin-knowledge-management.md`

---------------------------------

Milestone 9 — Production, Performance & Quality ✅

- ADMIN_OPEN_LOCAL locked (prod always off; non-prod opt-in only)
- Rate limiting + security headers (middleware)
- Health + readiness endpoints; structured logging
- Quran/meta API caching; TeacherPanel dynamic import
- Error / not-found pages; safe API errors
- Accessibility pass (reader, offline, teacher, merge dialog)
- Prisma hot-path indexes; CI + Dockerfile + compose
- Docs: `docs/29-production-readiness.md`, `30-deployment-guide.md`, `31-maintenance-guide.md`

---------------------------------
