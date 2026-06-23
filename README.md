# TopoPass

TopoPass is a responsive study web app for London private hire applicants
preparing for the TfL Private Hire Topographical Skills Assessment. It provides
knowledge questions, Mapbox location questions, route-drawing practice on a
real OpenStreetMap-derived London map, and a timed mixed mock exam.

TopoPass is an independent study tool. It is not affiliated with, endorsed by,
or sponsored by Transport for London, Uber, Bolt, FREENOW, or any private hire
operator.

## Phase 1 Status

Stages 1-14 are complete as a local/static MVP. The current app demonstrates
the complete learner and content-management workflows without production
accounts, database persistence, payments, or subscriptions.

Phase 1 is suitable for:

- Local product demonstrations
- Question and scoring prototyping
- Browser-based manual QA
- Route-scoring calibration
- Preparing reviewed question data for a later persistence layer

It is not yet a production learning platform.

## Completed Features

- Professional public homepage, resources, pricing, and study navigation
- Learn section with a route-planning entry point
- Route practice using a shared route-question bank
- Knowledge question bank with exact-answer scoring
- Map-click question bank with Mapbox, distance scoring, and configurable
  tolerances
- Route-drawing questions using a generated SVG map and hidden route geometry
- Reusable route scoring with start, end, coverage, length, and deviation checks
- Timed mixed mock exams with randomized question selection
- Question navigation, unanswered-state tracking, and browser-session recovery
- Final score, pass/fail result, per-type breakdown, and answer review
- Admin dashboard and managers for knowledge, map-click, and route questions
- Question validation, browser-local drafts, previews, activation controls, and
  JSON export
- Deterministic tests for route scoring, mock-exam scoring/selection, and admin
  validation

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Mapbox GL JS
- OpenStreetMap-derived GeoJSON and generated SVG map data
- Supabase JavaScript client scaffold only
- Node.js built-in test runner

## App Routes

| Route | Current purpose |
| --- | --- |
| `/` | Public TopoPass homepage |
| `/learn` | Learning guidance and route-planning entry point |
| `/resources` | Official TfL links and planned study resources |
| `/pricing` | Honest pre-launch pricing status |
| `/practice` | Practice-area selector |
| `/practice/routes` | Working route-drawing practice flow |
| `/demo` | Standalone multi-question Mapbox click demo |
| `/route-demo` | Route-drawing development/demo flow with accepted-route tools |
| `/mock-test` | Timed mixed mock exam |
| `/results/[attemptId]` | Legacy result route; no persisted attempt loading yet |
| `/review` | Legacy review route; live review is inside `/mock-test` |
| `/dashboard` | Local Phase 1 dashboard shell |
| `/login` | Phase 1 account-status page; authentication is not connected |
| `/register` | Phase 1 account-status page; registration is not connected |
| `/admin` | Admin overview and validation summary |
| `/admin/questions` | Combined static question inventory |
| `/admin/questions/knowledge` | Knowledge question draft manager |
| `/admin/questions/map-click` | Map-click question draft manager and preview |
| `/admin/questions/route` | Route question draft manager and preview |
| `/admin/questions/routes` | Compatibility route for the route manager |
| `/admin/questions/new` | Question-type creation entry point |
| `/admin/questions/[id]` | Question inspection and manager routing |

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

The admin area validates and previews all three question types. Admin edits are
prototype drafts saved to browser `localStorage`. They do not update source
files, Supabase, or learner-facing question banks automatically.

To make an admin draft permanent:

1. Export the relevant JSON bank.
2. Review and validate the exported records.
3. Deliberately add the approved data to the appropriate TypeScript question
   bank.
4. Run lint, tests, and build.

Active `/practice` and `/mock-test` content comes only from the committed source
banks.

## Environment Variables

Copy `.env.example` to `.env.local` and provide the values required locally:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

`NEXT_PUBLIC_MAPBOX_TOKEN` is required for Mapbox pages. The Supabase client is
scaffolded, but Phase 1 does not use Supabase for authentication or data
persistence.

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
- Supabase tables, Row Level Security, and admin permissions are not implemented.

## Known Limitations

- Route scoring is prototype-level and needs calibration against more reviewed
  routes and realistic learner attempts.
- Mock questions are representative training content, not official TfL content.
- The Mapbox style and map accessibility need further review.
- Route drawing needs broader mobile, pointer, and accessibility testing.
- `/results/[attemptId]` and `/review` cannot load historical attempts yet.
- Admin routes are not authenticated.
- There is no production analytics, payment, or subscription logic.
- Automated test coverage should expand as persistence and server behaviour are
  introduced.

See:

- `docs/PHASE_1_CLOSURE.md`
- `docs/TECHNICAL_DEBT.md`
- `docs/MANUAL_QA_CHECKLIST.md`

## Phase 2 Direction

The recommended Phase 2 starting point is a persistence and identity foundation:

1. Define versioned database schemas for questions, attempts, answers, and
   progress.
2. Add Supabase authentication and Row Level Security.
3. Move reviewed question banks behind a typed repository/data-access layer.
4. Protect admin routes and add explicit publishing workflows.
5. Persist completed mock exams and power `/results/[attemptId]`, `/review`, and
   dashboard progress from real attempt data.

Payments, subscriptions, and analytics should follow only after question
publishing, learner identity, and attempt persistence are reliable.
