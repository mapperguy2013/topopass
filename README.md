# TopoPass

TopoPass is a responsive study web app for London private hire applicants
preparing for the TfL Private Hire Topographical Skills Assessment. It helps
learners practise map reading, location knowledge, point-to-point route
planning, route drawing, mock-test decision making, and mistake review before
assessment day.

TopoPass is an independent study tool. It is not affiliated with, endorsed by,
or sponsored by Transport for London, Uber, Bolt, FREENOW, or any private hire
operator.

## Current Status

Phase 1 and Phase 2 are complete.

The app is currently a local-first Learning MVP. Learners can use the complete
prototype practice loop with local browser persistence, progress analytics,
mistake review, explanations, learning tips, mock exam modes, route drawing,
map-click questions, and admin/content tooling.

Phase 3 is complete. It added Supabase schema and helpers, optional learner
accounts, account-backed progress persistence, admin role protection, question
publishing, admin-only question import/export, production seed content, app
error/loading states, production-safe logging, account data isolation checks,
full `/review` answer history, and a simpler mock exam flow where map-click and
route-planning questions continue with Next after a valid answer.

Stage 36 is complete as a post-Phase-3 content-readiness pass. It expands the
draft-first production question seed, standardises the question topic structure,
keeps learner reads published-only, and improves admin inventory organisation
with topic, status, and difficulty filters.

Stage 37 is complete as a post-Phase-3 learner/admin polish pass. It adds
topic-based practice entry points, focused practice-session summaries, clearer
answer feedback and wrong-answer review, admin batch publish/archive actions,
and admin-only learner previews for question review.

Stage 38 is complete as a learner experience polish pass. It refreshes the
public home page, improves `/progress` and `/account` dashboards with topic
strengths/weaknesses and recent activity, and makes mock exam results/review
clearer with pass/fail guidance and topic breakdowns.

The app should continue to work without Supabase credentials for current local
learner flows. Supabase credentials are required for account features,
account-backed progress records, and admin publishing controls.

## Completed Phase 1: Prototype Foundation

Phase 1 established the core product shape and working prototype flows:

- Core Next.js app structure
- Public homepage, Learn, Practice, Mock Test, Resources, Pricing, and Admin
  areas
- Knowledge question bank and exact-answer scoring
- Map-click question bank with coordinate distance scoring
- Route-drawing question bank
- Route drawing over an OpenStreetMap-derived local SVG map
- Route scoring with start, end, coverage, length, off-route, and bounds checks
- Timed mixed mock exam engine
- Question navigation, unanswered-state tracking, and result review
- Static/local question banks for all supported question types
- Prototype admin tools for knowledge, map-click, and route questions
- Browser-local admin draft workflows
- Validation and preview tools for learner-facing question behaviour
- Deterministic tests for scoring, mock exam selection, and question validation

## Completed Phase 2: Learning MVP Hardening

Phase 2 turned the prototype into a stronger local Learning MVP:

- Local progress persistence
- Progress dashboard
- Mistake review flow
- Visual answer review for map-click and route questions
- Explanations and learning tips across supported question types
- Personalised practice recommendations
- Expanded knowledge, map-click, route, learn, and mock exam content
- Mock exam modes for practice, exam simulation, weak areas, and mistakes
- Smarter review flow and retry queues
- Route drawing correction and map interaction polish
- Map-click interaction polish
- Route drawing pan, zoom, reset, undo, clear, and submit controls
- Local atlas-page support structure and QGIS/OS atlas workflow documentation
- Cleanroom generated driver-training atlas review asset
- Learn section expansion
- Accessibility and mobile QA improvements
- Mobile/touch target hardening and keyboard focus improvements

## Completed Phase 3: Backend Foundation And Production Readiness

Phase 3 completed the real product infrastructure needed before Phase 4.
Phase 4 has not started yet.

| Stage | Focus | Status |
| --- | --- | --- |
| Stage 27 | Supabase setup and database schema | Complete |
| Stage 28 | User accounts / authentication | Complete |
| Stage 29 | Save progress to database | Complete |
| Stage 30 | Admin authentication and protected admin area | Complete |
| Stage 31 | Question publish workflow: draft, published, archived | Complete |
| Stage 32 | Import/export question tools | Complete |
| Stage 33 | Production seed data and content migration | Complete |
| Stage 34 | Error handling, loading states, and production logging | Complete |
| Stage 35.6 | Account data isolation, review history, and exam UX improvements | Complete |

Phase 3 guardrails:

- Do not replace the local practice loop prematurely.
- Do not require login for current local learner flows yet.
- Do not expose service-role or private Supabase keys to frontend code.
- Do not add external monitoring services until there is a deliberate product
  decision to do so.

## Current Feature Set

- Landing page with private-hire applicant positioning
- Modern public home page with learner CTAs, local-first/account progress copy,
  and map-learning promotion
- Expanded Learn section with structured learning paths
- Practice selector for knowledge, map-click, and route drawing
- Topic-based practice selector with counts per topic and weak-topic guidance
- Knowledge practice with local saved attempts
- Map-click practice with selected marker feedback and distance scoring
- Route-drawing practice with continuous line drawing, pan/zoom, undo, clear,
  reset, and route scoring
- Focused practice filters for topic and difficulty
- End-of-session practice summaries with wrong-answer review prompts
- Mixed mock exam modes and timed exam simulation
- Progress dashboard with signed-out local analytics and signed-in
  account-scoped Supabase reads when configured
- Progress and account dashboards with question totals, accuracy, topic
  strengths/weaknesses, and recent activity
- Mistake review with retry queue and visual answer review
- Full `/review` answer history for practice and mock attempts with filters
- Local data export/import/reset tools for learner progress
- Optional learner account sign-up, log-in, sign-out, and account page
- Signed-in practice/mock completion saves to Supabase account tables
- Authenticated progress reads are scoped by the current Supabase user id
- Basic account progress summary from Supabase records
- Protected prototype admin question managers and validators
- Protected admin publishing controls for Supabase `question_bank_items`
- Admin batch publish/archive/draft review actions for selected questions
- Admin-only learner preview for source-bank and imported question records
- Admin-only JSON import/export tools for `question_bank_items`
- Expanded draft-first production starter seed content and manual question-bank
  seed command
- Canonical learner content topics for `question_bank_items`: London geography,
  major roads and routes, bridges and river crossings, stations and transport
  hubs, hospitals/key public buildings, landmarks and destinations, route
  planning, direction sense, map interpretation, and passenger scenario
  judgement
- Root/admin/account error boundaries and async loading states
- Safe structured logger for production-safe diagnostics
- Phase 3 regression tests for auth, progress persistence, admin protection,
  publishing, import/export, seed safety, and safe logging
- Mock exam map-click and route-planning answers save from the interaction and
  advance with Next instead of requiring a separate Submit step
- Mock exam results show pass/fail feedback, score clarity, question-type and
  topic breakdowns, next-step guidance, and improved answer review metadata
- OpenStreetMap-derived local route map
- Cleanroom generated driver-training atlas review asset, not yet integrated
- Supabase package/helper/schema foundation for Phase 3
- Stage 27 schema-aligned learner progress persistence

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Mapbox GL JS for current map-click demo questions
- OpenStreetMap-derived GeoJSON and generated SVG map data
- Local browser persistence for current progress and mistake review
- Supabase JavaScript client and SSR helper scaffold
- Supabase learner auth page/action scaffold
- Supabase SQL migrations for the Phase 3 backend foundation
- Node.js built-in test runner

## App Routes

| Route | Current purpose |
| --- | --- |
| `/` | Public TopoPass homepage |
| `/learn` | Expanded learning hub and study path |
| `/practice` | Practice-area selector |
| `/practice/knowledge` | Knowledge question practice |
| `/practice/map-click` | Map-click location practice |
| `/practice/routes` | Route-drawing practice |
| `/mock-test` | Mock exam mode selection and exam flow |
| `/progress` | Local progress dashboard |
| `/progress/mistakes` | Mistake review and retry flow |
| `/auth/sign-up` | Optional learner account creation |
| `/auth/log-in` | Optional learner account login |
| `/auth/callback` | Supabase email confirmation/session exchange callback |
| `/account` | Protected learner account/profile page |
| `/route-demo` | Route-drawing development/demo flow |
| `/demo` | Standalone Mapbox click demo |
| `/login` | Legacy placeholder route; active auth is under `/auth/log-in` |
| `/register` | Legacy placeholder route; active sign-up is under `/auth/sign-up` |
| `/dashboard` | Local dashboard shell |
| `/admin` | Prototype admin overview and validation summary |
| `/admin/questions` | Combined static question inventory |
| `/admin/questions/knowledge` | Knowledge question draft manager |
| `/admin/questions/map-click` | Map-click question draft manager and preview |
| `/admin/questions/route` | Route question draft manager and preview |
| `/admin/questions/new` | Question-type creation entry point |
| `/admin/questions/[id]` | Question inspection and manager routing |
| `/admin/questions/import-export` | Admin-only question_bank_items JSON import/export |
| `/admin/questions/routes` | Compatibility route for route question manager |
| `/resources` | Useful official and study resource links |
| `/pricing` | Honest pre-launch pricing status |
| `/results/[attemptId]` | Legacy result route; database loading is not active yet |
| `/review` | Full answer review history with filters for subject, type, result, source, date, and sort order |

## Question Types

### Knowledge

Multiple-choice questions are stored in `lib/knowledgeQuestions.ts`. Practice
and mock-exam scoring use exact answer matching.

### Map Click

Location questions are stored in `lib/mapClickQuestions.ts`. Mapbox captures a
clicked coordinate and `lib/distance.ts` calculates the distance from the
configured target. Each question defines its own tolerance in metres.

### Route Drawing

Route questions are stored in `src/data/routeQuestions.ts`. The learner draws
over local map assets generated from real OSM GeoJSON. Route scoring lives in
`lib/routeScoring.ts`.

## Mock Exam Behaviour

The mock exam currently supports:

- Practice mock mode
- Exam simulation mode
- Weak areas mode
- Mistakes mode
- Configurable timer and pass mark
- Question navigator and unanswered-state tracking
- Active attempt restoration using browser `localStorage`
- Answer preservation while moving between questions
- Automatic submission when time expires
- Overall and per-question-type results
- In-session review of every answer

Configuration lives in `lib/mockExamConfig.ts` and mode construction lives in
`lib/mockExamModeBuilder.ts`.

## Progress And Review

Current learner progress remains local-first for signed-out users and
account-scoped for signed-in users when Supabase is configured. It supports:

- Saved practice attempts
- Saved mock attempts
- Progress dashboard metrics
- Weak area analysis
- Practice recommendations
- Mistake aggregation
- Reviewed/unreviewed mistake state
- Retry queues
- Full answer history review
- Local progress export, import, and reset for browser-local data

This keeps the app usable without accounts. When a learner is signed in, new
practice and mock completions save locally first and also save to the Stage 27
Supabase tables. Signed-in progress, mistake review, and answer review reads
are scoped to the authenticated Supabase user id; signed-out review and
progress use only browser-local history.

`/progress/mistakes` is the filtered mistakes view for incorrect answers.
`/review` is the full answer history view and includes both correct and
incorrect practice/mock answers. Review filters include subject/category,
question type, result, source, date range, and newest/oldest sort order.

## Admin Tools

The admin area validates and previews all three question types. It is protected
by Supabase learner authentication plus the `profiles.role = 'admin'` role. It
supports browser-local create, edit, activate/deactivate, preview, reset, and
export workflows for knowledge, map-click, and route questions.

Admin edits are prototype drafts saved to browser `localStorage`. They do not
update source files or learner-facing question banks automatically.

Stage 31 adds Supabase publishing controls to the combined question inventory.
Admins can save a source-bank question into `question_bank_items` as a draft,
publish it, or archive it. Database-backed learner question reads use only
`status = 'published'`; draft and archived rows are hidden by repository
filtering and Row Level Security. Non-admin learners cannot access admin pages
or manage question status.

Stage 32 adds `/admin/questions/import-export`. Admins can export all
`question_bank_items` rows or filter exports to published, draft, or archived
rows. Admins can import pasted JSON or a JSON file, preview validation results,
then either create new records only or upsert matching IDs. Import writes only
to `question_bank_items`, defaults missing status values to `draft`, and rejects
old table-shaped payloads rather than silently mapping them.

Stage 33 adds production seed support. Stage 36 expands the starter seed file at
`supabase/seed/question_bank_items.json` into a larger draft-first content set
covering knowledge, map-click, route-planning, direction sense, landmarks,
stations, hospitals, bridges, roads, and passenger scenario judgement. It uses
the same Stage 32 import format and starts all records as `draft` so admins must
review and publish content deliberately.

The admin question inventory now shows source-bank and Supabase-only
`question_bank_items` records together, with counts and filters for publishing
status, topic/category, and difficulty. Stage 37 adds batch status controls for
selected questions and a review/preview detail page that shows how a question
will read to learners without publishing it.

To make a browser-local admin draft permanent today:

1. Export the relevant JSON bank.
2. Review and validate the exported records.
3. Deliberately add approved data to the appropriate TypeScript question bank.
4. Run lint, tests, and build.

Production moderation remains planned for a later phase.

## Question Bank JSON Format

Question bank exports use this envelope:

```json
{
  "format": "topopass-question-bank-items",
  "version": 1,
  "exportedAt": "2026-06-24T00:00:00.000Z",
  "statusFilter": "all",
  "question_bank_items": [
    {
      "id": "knowledge-example",
      "question_type": "knowledge",
      "status": "draft",
      "difficulty": "easy",
      "category": "Map interpretation",
      "prompt": "Example question?",
      "explanation": "Example explanation.",
      "tip": "Example tip.",
      "tags": ["Map interpretation"],
      "payload": {
        "options": ["North", "South"],
        "correctAnswer": "North"
      },
      "version": 1,
      "source": "admin-import"
    }
  ]
}
```

Imports also accept a raw array of `question_bank_items` records. The importer
validates required fields, canonical topic/category values, `easy`/`medium`/
`hard` difficulty, `knowledge` options/answer payloads, `map-click`
coordinate/radius payloads, and `route-drawing` endpoint/map-bounds payloads.
Only `draft`, `published`, and `archived` are accepted statuses; missing status
defaults to `draft`, and missing difficulty defaults to `medium`.

Canonical Stage 36 topics are:

- `London geography`
- `Major roads and routes`
- `Bridges and river crossings`
- `Stations and transport hubs`
- `Hospitals and key public buildings`
- `Landmarks and destinations`
- `Route planning`
- `Direction sense`
- `Map interpretation`
- `Passenger scenario judgement`

## Production Seed Data

Production starter content is stored here:

```txt
supabase/seed/question_bank_items.json
```

Validate and import it manually with:

```powershell
npm.cmd run seed:questions
```

The seed command:

- reads `supabase/seed/question_bank_items.json`
- validates with the same Stage 32 import helper
- signs in with a normal Supabase admin account
- upserts only `question_bank_items`
- refuses to run when required environment variables are missing
- does not touch learner progress tables

Required local environment variables for the seed command:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SEED_ADMIN_EMAIL=
SUPABASE_SEED_ADMIN_PASSWORD=
```

`SUPABASE_SEED_ADMIN_EMAIL` must belong to an authenticated user whose
`profiles.role` is `admin`. Do not commit real seed credentials.

Seeded draft questions are visible in `/admin/questions` and hidden from
learner-safe database reads. Review seeded content in admin, use the topic,
status, and difficulty filters to organise the larger content set, then publish
only records that are ready for learners.

## Error Handling And Logging

Stage 34 adds app-level resilience for production use:

- Root error and not-found states for unexpected app errors and missing routes
- Admin, account, and import/export error boundaries
- Admin, account, and import/export loading states for async auth/Supabase work
- Safe generic user-facing messages for auth, account, admin publishing,
  import, and export failures
- A shared logger in `lib/logging/logger.ts`

The logger writes structured JSON in production and console-readable output in
development. Log context is sanitized before output. It must not be used for
passwords, tokens, cookies, authorization headers, service-role keys, anon keys,
private keys, raw request bodies, full imported JSON payloads, full user
objects, or learner answers. Admin import/export logs counts and safe status
metadata, not imported question content.

## Supabase Foundation

The project now includes Supabase dependencies and helper scaffolding for Phase
3:

```txt
lib/supabase/browser.ts
lib/supabase/server.ts
lib/supabase/config.ts
lib/supabase/types.ts
lib/auth/session.ts
lib/auth/admin.ts
lib/auth/roles.ts
lib/db/practiceAttemptRepository.ts
lib/db/mockAttemptRepository.ts
lib/db/progressRepository.ts
```

The current Phase 3 schema foundation is:

```txt
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_question_publishing_workflow.sql
```

It defines:

- `profiles`
- `practice_attempts`
- `question_attempts`
- `mock_attempts`
- `mock_question_attempts`
- `saved_progress`
- `question_bank_items`

Row Level Security is enabled for these tables. User-owned progress tables are
scoped to `auth.uid()`. Signed-in practice saves use `practice_attempts` plus
`question_attempts`; signed-in mock saves use `mock_attempts` plus
`mock_question_attempts`. Admin page access uses `profiles.role`; database
admin/content policies use a profile-backed admin role helper for
`question_bank_items` management. Question publishing statuses are `draft`,
`published`, and `archived`, with new admin-created database rows defaulting to
`draft`.

An older persistence-foundation migration is still present for project history.
Phase 3 work should use the Phase 3 roadmap and current migration strategy.

## Environment Variables

Copy `.env.example` to `.env.local` and provide values as needed:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

`NEXT_PUBLIC_MAPBOX_TOKEN` is required for current Mapbox map-click pages.
Supabase public URL and anon key are optional until Phase 3 stages wire database
behaviour into learner flows. They are required to use account pages and
account-backed progress saving. Do not commit real secrets.

## Map Assets

Current learner route practice uses generated local map assets derived from:

```txt
public/maps/kings-cross-euston/osm-raw.geojson
```

Regenerate the current route-practice map and graph only when source map data or
map scripts change:

```powershell
npm.cmd run map:build:kings-cross-euston
```

The cleanroom driver-training atlas review asset can be regenerated with:

```powershell
npm.cmd run map:render:driver-training-atlas
```

That generated atlas asset is saved under `public/maps/generated/` for review
and is not integrated into the live app UI yet.

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

For a production-mode local check:

```powershell
npm.cmd run build
npm.cmd run start
```

## Test And Verify

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

The test suite covers route scoring, map helpers, mock exam logic, admin
validation, local persistence, Supabase schema/auth/progress/admin/publishing
and import/export/seed validation, safe production logging, progress analytics,
recommendations, mistake review, and visual review helpers.

## Stage 35.6 Account Isolation And Review QA Status

Stage 35.6 is a verification and improvement pass. It did not add database
tables, columns, policies, or migrations.

Account data isolation result:

- Existing Supabase RLS already isolates `practice_attempts`,
  `question_attempts`, `mock_attempts`, `mock_question_attempts`, and
  `saved_progress` with `user_id = auth.uid()`.
- Repository reads were tightened so authenticated learners query progress by
  the authenticated Supabase user id instead of relying on broad reads or
  signed-out local history.
- Signed-out users still use browser-local progress and review history.
- Admin question tooling remains server-side protected and does not read learner
  progress tables.

Review and exam UX result:

- `/review` now renders full answer history instead of the old placeholder.
- Review history includes practice and mock exam answers where saved.
- Review filters cover subject/category, question type, correct/incorrect,
  source, date range, and newest/oldest sorting.
- `/progress/mistakes` remains the mistakes-only view.
- Mock exam map-click and route-planning questions now save from the map/route
  interaction and use Next to continue, without a second Submit button in the
  question body.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Result for this Stage 35.6 pass: all three commands passed.

## Stage 36 Content Readiness QA Status

Stage 36 expands content and organisation without adding monetisation,
payments, subscriptions, or launch marketing.

Content result:

- `supabase/seed/question_bank_items.json` now contains a larger draft-first
  starter set across knowledge, map-click, and route-drawing question types.
- New seed records use canonical `category` topics and `easy`/`medium`/`hard`
  difficulty values.
- Existing static question-bank categories now align with the same canonical
  topic structure.
- Import validation rejects invalid topics, invalid difficulty values, invalid
  statuses, old table-shaped payloads, and malformed question payloads.
- Learner-safe question reads still filter Supabase content to
  `status = 'published'`.

Admin result:

- `/admin/questions` shows source-bank and Supabase-only `question_bank_items`
  records together.
- Admin inventory includes counts and filters for status, topic/category, and
  difficulty.
- `/admin/questions/import-export` previews topic and difficulty metadata before
  commit.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 36 pass: all commands passed.

## Stage 37 Learner And Admin Review Polish QA Status

Stage 37 improves learner usefulness and admin review workflow without adding a
new schema migration or changing signed-out local progress behaviour.

Learner result:

- `/practice` now includes topic-based entry points with available question
  counts for knowledge, map-click, and route sessions.
- Saved local/account-synced answer history is used on-device to highlight weak
  topics where previous mistakes exist.
- Knowledge, map-click, and route practice pages accept `topic` and
  `difficulty` filters.
- Practice sessions show clearer intros, empty states, answer feedback, and
  end-of-session summaries.
- Current-session wrong answers are shown with learner answer, accepted answer,
  and focused feedback.
- Explanation panels now separate the reason, accepted area, route guidance, and
  learning tip for easier reading on mobile.

Admin result:

- `/admin/questions` supports selecting multiple rows and batch moving selected
  records to `published`, `archived`, or `draft`.
- Batch actions reuse the server-side admin check and write only through the
  `question_bank_items` repository path.
- `/admin/questions/[id]` now includes an admin-only learner preview for
  knowledge, map-click, and route questions.
- Database-only imported questions can be opened for review/preview from the
  inventory.
- Import validation UI gives clearer record/field-level guidance without
  logging raw payloads.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 37 pass: all commands passed.

## Stage 38 Progress Dashboard, Mock Exam, And Home UI QA Status

Stage 38 improves learner-facing polish without adding a schema migration or
changing the signed-out local progress fallback.

Home page result:

- The public home page now has a stronger learner-focused hero, primary practice
  CTA, secondary mock/progress CTAs, and a real generated map preview asset.
- Map-click, route drawing, and knowledge practice are surfaced directly from
  the map-learning section.
- Public copy explains local practice without sign-in and account-backed
  progress for signed-in learners.
- Admin-only features are not exposed on the public home page.

Dashboard result:

- `/progress` now clearly labels whether the current view is browser-local or
  account-backed Supabase progress.
- The dashboard shows total questions attempted, correct answers, accuracy,
  mock exams completed, topic strengths/weaknesses, and recent saved answers.
- Topic percentages are highlighted only when there are enough saved answers;
  low-data topics remain marked as developing.
- `/account` now includes account-backed accuracy, topic snapshot, and recent
  activity for signed-in learners.

Mock exam result:

- Mock exam results now show clearer pass/fail wording, score details,
  question-type breakdown, topic breakdown, and next-step recommendations.
- The mock review screen shows each question with learner answer, accepted
  answer, correctness, topic, difficulty, score, and explanation where
  available.
- Older/incomplete review metadata has a fallback message instead of crashing.

Verification commands for this pass:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --cached --check
```

Result for this Stage 38 pass: lint, tests, and production build passed.

## Phase 3 Manual QA Checklist

### Public learner flow

- Open the home page.
- Open `/learn`.
- Start practice while signed out.
- Answer practice questions.
- Confirm local progress remains available.
- Start a mock exam while signed out.
- Confirm the mock result saves locally.

### Auth and account flow

- Sign up with a learner account.
- Confirm email if required by Supabase.
- Log in.
- Confirm the navbar changes to Account/Sign out.
- Open `/account`.
- Confirm profile and progress summary render.
- Sign out.
- Confirm public learner routes still work.

### Signed-in progress flow

- Log in.
- Complete a practice question.
- Complete a mock exam.
- Refresh `/account`.
- Confirm practice and mock counts update from Supabase.

### Admin flow

- Signed-out users visiting `/admin` redirect to `/auth/log-in`.
- Confirm the redirect includes `?next=/admin`.
- Signed-in learner accounts with `profiles.role = 'learner'` see a clear not
  authorised state for `/admin`.
- Signed-in admin accounts with `profiles.role = 'admin'` can open `/admin` and
  nested admin question routes.
- Confirm the question inventory loads.

### Question publishing flow

- Create or locate a draft question.
- Confirm learner pages do not show draft questions.
- Publish the question.
- Confirm learner pages can show it.
- Archive the question.
- Confirm learner pages no longer show it.

### Import/export flow

- As an admin, open `/admin/questions/import-export`.
- Export all questions.
- Export published only.
- Export draft only.
- Export archived only.
- Preview a valid import file.
- Preview an invalid import file.
- Confirm invalid records do not commit.
- Commit valid records as admin.
- Confirm imported records appear in admin inventory.
- Confirm draft imports are hidden from learners.

### Production seed flow

- Confirm `supabase/seed/question_bank_items.json` previews successfully in
  `/admin/questions/import-export`.
- Run `npm.cmd run seed:questions` in a configured local environment.
- Confirm seeded records appear in `/admin/questions`.
- Confirm seeded records are `draft` by default and hidden from learners.
- Publish one reviewed seed record and confirm it can be returned by
  learner-safe database reads.
- As an admin, open `/admin/questions/import-export`.
- Import with create-only mode using a new ID.
- Import with upsert mode using an existing ID.
- Confirm imported records are written to `question_bank_items`.
- Confirm records without explicit status import as `draft`.
- Confirm draft and archived Supabase `question_bank_items` rows do not appear
  in any database-backed learner question read.
- Confirm published Supabase `question_bank_items` rows can be returned by the
  learner-safe question repository.

### Regression flow

- Learner practice, mock exam, progress, and account routes remain accessible.
- Signed-in learner progress saving from Stage 29 still works.
- Confirm signed-out practice, mock exam, progress, and mistake review still
  work with local browser persistence.
- Existing admin prototype editing/export behaviour is unchanged for admins.
- Mobile admin access-denied and admin pages remain readable.

### Production safety flow

- Visit a missing route and confirm the not-found page is readable.
- Trigger a safe test error and confirm the generic error page.
- Open `/account` while signed out and signed in.
- Confirm `/account` shows a clean fallback if account progress cannot load.
- Confirm admin and account loading states render during async navigation.
- Trigger invalid JSON in `/admin/questions/import-export` and confirm the
  error is clear without exposing stack traces or raw payloads.
- Trigger an import validation failure and confirm no records are committed.
- Confirm logs do not contain Supabase secrets, cookies, raw imported JSON, full
  user objects, or learner answers.
- No service-role keys are needed in the app.

## Stage 35.6 Manual QA Checklist

### Account isolation

- Create learner account A.
- Complete practice and a mock exam.
- Sign out.
- Create learner account B.
- Confirm B does not see A's account, progress, review, or mistake data.
- Sign back into A.
- Confirm A still sees A's own account-backed data.

### Review page

- Complete practice questions.
- Complete a mock exam.
- Open `/review`.
- Confirm all saved answers appear.
- Filter by subject.
- Filter by correct only.
- Filter by incorrect only.
- Filter by question type.
- Filter by practice/mock source.
- Confirm `/progress/mistakes` matches the incorrect review items.

### Exam UX

- Start a mock exam.
- Answer a map-click question.
- Press Next once and confirm it advances.
- Answer a route-planning question.
- Press Next once and confirm it advances.
- Press Next on a map-click question without selecting a location and confirm
  validation prevents advancing.
- Press Next on a route-planning question without drawing a route and confirm
  validation prevents advancing.
- Complete the exam.
- Confirm score and review answers are correct.

## Stage 36 Manual QA Checklist

### Draft content review

- Open `/admin/questions` as an admin.
- Confirm the inventory shows status, topic, difficulty, source, and validation
  columns.
- Filter by `draft`, `published`, `archived`, and `not-saved`.
- Filter by several topics, including `Route planning`, `Map interpretation`,
  and `Stations and transport hubs`.
- Filter by `easy`, `medium`, and `hard`.
- Confirm imported database-only rows appear in the same inventory.

### Seed/import workflow

- Open `/admin/questions/import-export`.
- Paste or upload `supabase/seed/question_bank_items.json`.
- Preview the import and confirm valid records show topic and difficulty.
- Confirm all seed records are `draft`.
- Try an invalid topic and confirm the preview rejects it clearly.
- Try an invalid difficulty and confirm the preview rejects it clearly.
- Commit valid seed records as an admin in a configured Supabase environment.

### Learner visibility

- Confirm draft seed records do not appear in learner practice, mock exam, or
  learner-safe question reads.
- Publish one reviewed sample question from `/admin/questions`.
- Confirm the published sample can be returned by learner-safe Supabase reads.
- Archive the sample and confirm it is hidden from learner-safe reads again.
- Confirm signed-out local practice and mock exam flows still work.
- Confirm signed-in progress saving still works after publishing changes.

## Stage 37 Manual QA Checklist

### Learner practice polish

- Open `/practice` on desktop and mobile width.
- Confirm topic cards show counts for knowledge, map-click, and route sessions.
- Complete a few answers incorrectly, return to `/practice`, and confirm weak
  topics are highlighted from saved history.
- Start a topic-filtered knowledge session and confirm the intro shows the
  selected topic/difficulty.
- Change difficulty from the session intro and confirm the question set updates.
- Submit a knowledge answer and confirm correct answer plus explanation/tip are
  easy to read.
- Start a topic-filtered map-click session, submit a click, and confirm distance
  feedback plus accepted-area guidance appears.
- Start a topic-filtered route session, draw a route, and confirm route feedback
  plus explanation appears.
- Confirm each practice session summary shows score, topic breakdown, and wrong
  answers from the current session.
- Confirm empty topic/style combinations show a helpful empty state.

### Admin review polish

- Sign in as an admin and open `/admin/questions`.
- Select multiple draft or not-saved rows and use Publish selected.
- Select multiple rows and use Archive selected.
- Move selected rows back to draft.
- Confirm non-admin learners cannot access `/admin/questions` or batch actions.
- Open a source-bank row with Review / preview and inspect the learner preview.
- Open an imported Supabase-only row with Review / preview and inspect the
  learner preview.
- Preview invalid import JSON and confirm errors identify record number and
  field without exposing raw payloads in logs.
- Confirm learner-safe reads still return only `status = 'published'`.

## Stage 38 Manual QA Checklist

### Home page

- Open `/` on desktop and mobile width.
- Confirm the hero explains TfL/topographical-test practice clearly.
- Use Start practice, Take a mock exam, and View progress CTAs.
- Confirm the generated map preview renders.
- Confirm map-click, route practice, and knowledge practice links work.
- Confirm no admin-only publishing/import/export features are promoted publicly.

### Progress and account dashboards

- Open `/progress` while signed out with no local activity and confirm the empty
  state is helpful.
- Complete knowledge, map-click, route, and mock exam attempts while signed out.
- Reopen `/progress` and confirm totals, accuracy, topic strengths/weaknesses,
  and recent activity update from local data.
- Sign in, complete a practice question and mock exam, then open `/account`.
- Confirm account-backed totals, topic snapshot, and recent activity render.
- Confirm signed-out local progress still remains available after signing out.

### Mock exam polish

- Complete a mock exam with a passing score and confirm pass-level feedback,
  topic breakdown, and next-step guidance.
- Complete or simulate a failed mock and confirm below-pass feedback and weakest
  topic guidance.
- Open Review answers from the result screen.
- Confirm each review card shows question, learner answer, accepted answer,
  correctness, topic, difficulty, score, and explanation.
- Confirm old/incomplete review metadata shows a fallback instead of crashing.

## Current Limitations

- Learner accounts are optional; signed-in completions save to Supabase, but
  local-to-account migration is not implemented yet.
- Legacy `/login` and `/register` remain placeholder routes; active auth lives
  under `/auth/*`.
- The progress dashboard uses browser-local progress for signed-out learners
  and account-scoped Supabase progress for signed-in learners when configured.
- Admin tools are permission-protected by profile role; create/edit managers
  remain prototype-level browser-local editors.
- Static TypeScript question banks remain the active learner content source.
- Supabase account progress writes are implemented for new signed-in practice
  and mock completions; broader syncing and migration remain deferred.
- A full multi-step editorial approval workflow is not implemented yet; current
  production review is admin-managed draft, publish, and archive.
- Payment and subscription logic is not implemented.
- External production observability services are not implemented; logging is
  currently local/server-console only.
- Route scoring still needs calibration against more reviewed real-world
  learner attempts.
- The generated driver-training atlas asset is a review artifact and is not the
  live map UI.

## Supporting Documentation

- `docs/mobile-accessibility-qa.md`
- `docs/free-atlas-map-workflow.md`
- `docs/os-qgis-atlas-poc.md`
- `docs/cleanroom-driver-training-atlas-generation.md`
- `docs/production-question-content.md`
- `docs/TECHNICAL_DEBT.md`
- `docs/MANUAL_QA_CHECKLIST.md`
