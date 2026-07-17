# Phase 3: Backend Foundation and Production Readiness

Status: Complete

Phase 3 added the account, database, publishing, content, and production-safety
foundations needed to move beyond a purely local prototype. Signed-out local
practice remains supported; Supabase is required only for account-backed and
admin features.

## Core steps

| Stage | Brief description | Status |
| --- | --- | --- |
| 27 | Add the Supabase schema, typed helpers, repositories, and Row Level Security foundation. | Complete |
| 28 | Add optional learner sign-up, login, logout, callback, and account flows. | Complete |
| 29 | Save signed-in practice and mock progress to account-scoped database records. | Complete |
| 30 | Protect admin routes with authenticated profile roles. | Complete |
| 31 | Add draft, published, and archived question states with published-only learner reads. | Complete |
| 32 | Add admin-only validated question-bank import and export. | Complete |
| 33 | Add draft-first production seed content and a guarded seed command. | Complete |
| 34 | Add error/loading states and production-safe structured logging. | Complete |
| 35.6 | Verify account isolation, full answer-history review, and simpler mock-exam continuation. | Complete |

## Post-phase product hardening

These stages followed the backend foundation and prepared the broader product
for beta use. They are grouped here because they build on Phase 3 learner and
admin behaviour; Phase 4 has its own separately numbered deployment steps.

| Stage | Brief description | Status |
| --- | --- | --- |
| 36 | Expand draft content, standardise topics, and improve admin inventory filters. | Complete |
| 37 | Add focused practice summaries, clearer feedback, batch admin actions, and learner previews. | Complete |
| 38 | Improve the homepage, progress/account dashboards, and mock-test results. | Complete |
| 39 | Polish launch messaging, pricing previews, SEO/social metadata, and typed analytics events. | Complete |
| 39.5 | Establish a separate SERU-style practice foundation and keep SERU out of topographical mocks. | Complete |
| 39.6 | Clarify the Practice journey, learner navigation, and public demo boundaries. | Complete |
| 39.7 | Add public Topographical, SERU, course, and assessment-discovery pages. | Complete |
| 40 | Add plan definitions, safe upgrade-interest capture, public footer, newsletter, and legal/information pages without live payments. | Complete |

## Guardrails

- Keep signed-out local practice working.
- Scope signed-in progress reads and writes to the authenticated learner.
- Never expose service-role keys or private credentials to browser code.
- Keep unpublished question records hidden from learner-safe reads.
- Keep Topographical and SERU learning areas separate.
- Do not present pricing previews as live payment processing.

## Related documents

- [Production question content](production-question-content.md)
- [Manual QA checklist](MANUAL_QA_CHECKLIST.md)
- [Technical debt register](TECHNICAL_DEBT.md)
- [Supabase migrations](../supabase/migrations/001_initial_schema.sql)
