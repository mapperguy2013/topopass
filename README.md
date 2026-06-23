# TopoPass

TopoPass is a responsive study web app for London private hire applicants
preparing for the TfL Private Hire Topographical Skills Assessment. It helps
learners practise map reading, location knowledge, point-to-point route
planning, and mock-test decision making before assessment day.

The current app includes knowledge questions, Mapbox location questions,
route-drawing practice on a real OpenStreetMap-derived London map, route
scoring, a timed mixed mock exam, result review, and prototype admin tools for
managing question content.

TopoPass is an independent study tool. It is not affiliated with, endorsed by,
or sponsored by Transport for London, Uber, Bolt, FREENOW, or any private hire
operator.

## Current Status

TopoPass has completed Stages 1-14 of the Phase 1 MVP. Stage 15 has started
Phase 2 by adding the Supabase schema and typed persistence foundation.

The app is still a local/static MVP prototype, not production-ready software.
It demonstrates the core learner and content-management workflows without
production accounts, payments, or subscriptions. Existing learner routes still
work with static fallback data when Supabase is not configured.

Phase 1 is suitable for:

- Local product demonstrations
- Question and scoring prototyping
- Browser-based manual QA
- Route-scoring calibration
- Preparing reviewed question data for a later persistence layer

It is not yet a production learning platform.

## Completed Features

- Landing page with private-hire applicant positioning
- Learn section with a route-planning entry point
- Practice flow with route-practice selection
- Knowledge question bank with exact-answer scoring
- Map-click question bank with Mapbox, distance scoring, and configurable
  tolerances
- Route-drawing questions using a generated SVG map and hidden route geometry
- Route scoring with start, end, coverage, length, and deviation checks
- Timed mixed mock test with randomized mixed question selection
- Question navigator and unanswered-state tracking
- Active attempt restoration using browser `localStorage`
- Final score, pass/fail result, per-type breakdown, and answer review
- Local/static question banks for all supported question types
- Admin dashboard
- Admin question managers for knowledge, map-click, and route questions
- Create/edit question flows
- Validation tools for question data
- Preview tools for learner-facing question behaviour
- Export tools for browser-local admin drafts
- Deterministic tests for route scoring, mock-exam scoring/selection, and admin
  validation

## Stage History

- Stage 1: Initial app foundation
- Stage 2: Basic Mapbox demo map
- Stage 3: Map-click scoring foundation
- Stage 4: Mock test flow
- Stage 5: Multiple real map-click questions
- Stage 6: Improved driver-focused map styling
- Stage 7: First route map prototype
- Stage 8: Route scoring engine
- Stage 9: Route question engine / data scaling
- Stage 10: Connect route question bank to practice
- Stage 11: Knowledge questions / question system expansion
- Stage 12: Full mixed mock exam engine
- Stage 12A: Route scoring hardening
- Stage 13: Exam polish
- Stage 14: Admin tools
- Stage 15: Supabase data model and persistence foundation

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Mapbox GL JS
- OpenStreetMap-derived GeoJSON and generated SVG map data
- Supabase JavaScript client scaffold only
- Supabase schema and repository foundation
- Node.js built-in test runner

## App Routes

| Route | Current purpose |
| --- | --- |
| `/` | Public TopoPass homepage |
| `/learn` | Learning guidance and route-planning entry point |
| `/practice` | Practice-area selector |
| `/practice/routes` | Working route-drawing practice flow |
| `/mock-test` | Timed mixed mock exam |
| `/route-demo` | Route-drawing development/demo flow with accepted-route tools |
| `/demo` | Standalone multi-question Mapbox click demo |
| `/login` | Phase 1 account-status page; authentication is not connected |
| `/register` | Phase 1 account-status page; registration is not connected |
| `/dashboard` | Local Phase 1 dashboard shell |
| `/admin` | Admin overview and validation summary |
| `/admin/questions` | Combined static question inventory |
| `/admin/questions/knowledge` | Knowledge question draft manager |
| `/admin/questions/map-click` | Map-click question draft manager and preview |
| `/admin/questions/route` | Route question draft manager and preview |
| `/admin/questions/new` | Question-type creation entry point |
| `/admin/questions/[id]` | Question inspection and manager routing |
| `/admin/questions/routes` | Compatibility route for the route question manager |
| `/resources` | Official TfL links and planned study resources |
| `/pricing` | Honest pre-launch pricing status |
| `/results/[attemptId]` | Legacy result route; no persisted attempt loading yet |
| `/review` | Legacy review route; live review is inside `/mock-test` |

`/admin/questions/routes` remains supported for compatibility with the earlier
route-admin path. New navigation uses `/admin/questions/route`.

## Question Types

### Knowledge

Multiple-choice questions are stored in `lib/knowledgeQuestions.ts`. Mock-exam
scoring uses exact answer matching.

### Map Click

Location questions are stored in `lib/mapClickQuestions.ts`. Mapbox captures a
clicked coordinate and `lib/distance.ts` calculates the distance from the
configured target. Each question defines its own tolerance in metres.

### Route Drawing

Route questions are stored in `src/data/routeQuestions.ts`. The learner draws
over `public/maps/kings-cross-euston/map.svg`, which is generated from the real
OSM GeoJSON source. Route scoring lives in `lib/routeScoring.ts`.

## Mock Test Behaviour

The mock exam currently:

- Selects 3 knowledge, 3 map-click, and 2 route-drawing questions
- Uses a 30-minute configurable timer
- Uses a configurable 70% pass mark
- Stores the active attempt in browser `localStorage`
- Preserves answers while moving between questions
- Warns about unanswered questions before submission
- Automatically submits when time expires
- Shows overall and per-question-type results
- Provides an in-session review of every answer

Configuration is in `lib/mockExamConfig.ts`.

## Admin Tools

The admin area validates and previews all three question types. It supports
browser-local create, edit, activate/deactivate, preview, reset, and export
workflows for knowledge, map-click, and route questions.

Admin edits are prototype drafts saved to browser `localStorage`. They do not
update source files, Supabase, or learner-facing question banks automatically.

To make an admin draft permanent:

1. Export the relevant JSON bank.
2. Review and validate the exported records.
3. Deliberately add the approved data to the appropriate TypeScript question
   bank.
4. Run lint, tests, and build.

Active `/practice` and `/mock-test` content comes only from the committed source
banks.

## Stage 15 Persistence Foundation

Stage 15 introduces the database foundation for Phase 2 without forcing the app
to depend on Supabase at runtime.

The intended Supabase data model now covers:

- `profiles`
- `question_banks`
- `questions`
- `mock_test_attempts`
- `mock_test_answers`
- `practice_attempts`
- `scoring_results`
- `admin_question_drafts`

The SQL migration is:

```txt
supabase/migrations/20260623150000_stage15_persistence_foundation.sql
```

The TypeScript database and repository layer is in:

```txt
lib/db/types.ts
lib/db/questionRepository.ts
lib/db/mockAttemptRepository.ts
lib/db/practiceAttemptRepository.ts
lib/db/progressRepository.ts
lib/questions/types.ts
```

Current behaviour:

- If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing,
  repositories return explicit static/local fallback results.
- Static question banks remain the active source for current learner flows.
- Supabase reads/writes are available through the repository helpers for later
  integration stages.
- Admin drafts remain browser-local unless later stages wire them to
  `admin_question_drafts`.
- Mock and practice attempts are still local in the UI until Stage 16 connects
  authenticated users and persisted attempt writes.

To apply the schema to a Supabase project, install and authenticate the Supabase
CLI, link the project, then run:

```powershell
supabase db push
```

Or apply the SQL file manually in the Supabase SQL editor for a development
project. Review RLS policies before production use.

## Environment Variables

Copy `.env.example` to `.env.local` and provide the values required locally:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

`NEXT_PUBLIC_MAPBOX_TOKEN` is required for Mapbox pages. The Supabase client is
optional at runtime. When the Supabase URL or anon key is missing, the app keeps
using static question banks and browser-local session storage.

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

## Test and Verify

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Map source regeneration is separate from normal app verification:

```powershell
npm.cmd run map:build:kings-cross-euston
```

Do not regenerate the map unless the OSM source or map-generation scripts have
changed.

## Local and Static Data Limitations

- Question banks are TypeScript source files.
- Admin drafts are local to one browser and must be exported manually.
- Active mock-exam recovery uses browser `localStorage`.
- Completed attempts, review history, and user progress are not persisted.
- Login and registration are not connected.
- Supabase-backed question storage is planned by the Stage 15 schema but not yet
  wired into learner routes.
- Supabase tables and Row Level Security policies are defined, but production
  permission hardening is still required.
- Admin tools are prototype-level and are not production permission-protected.

## Technical Debt and Known Limitations

- Static/local question banks are the current source of truth.
- Active mock-exam restoration is browser-local via `localStorage`.
- There is no real user progress persistence yet.
- Supabase-backed question storage exists as a schema/repository foundation but
  is not the active app source yet.
- Admin tools are prototype-level and not production permission-protected yet.
- Route scoring is prototype-level and needs calibration against more reviewed
  routes and realistic learner attempts.
- Mock-test content is representative/demo content, not official TfL material.
- Mobile map UX needs more real-device testing.
- Accessibility and map styling need further improvement.
- Tests should be expanded as the app grows.
- `/results/[attemptId]` and `/review` cannot load historical attempts yet.
- There is no production analytics yet.
- There is no payment or subscription logic yet.

See:

- `docs/PHASE_1_CLOSURE.md`
- `docs/TECHNICAL_DEBT.md`
- `docs/MANUAL_QA_CHECKLIST.md`

## Phase 2 Direction

The recommended Phase 2 starting point is a persistence and identity foundation:

1. Add Supabase persistence.
2. Move reviewed question banks into database-backed question storage.
3. Connect authentication to user attempts.
4. Persist completed attempts, answers, and progress tracking.
5. Protect admin routes and add explicit draft, review, publish, archive, and
   rollback workflows.
6. Power `/results/[attemptId]`, `/review`, and dashboard progress from real
   attempt data.

Subscriptions and payments should come later, after persistence, question
publishing, protected admin workflows, learner identity, and attempt history are
reliable.
