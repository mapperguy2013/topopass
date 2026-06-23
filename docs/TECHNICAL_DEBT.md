# Technical Debt

This register records known Phase 1 debt. Items are not defects unless they
contradict the documented local/static MVP behaviour.

## Data and Persistence

### Static and Local Question Banks

Knowledge, map-click, and route questions are stored in TypeScript source files.
Adding permanent content requires a code change, review, and deployment.

Recommended direction: introduce a typed question repository that can read the
current static banks first, then support Supabase without changing learner UI
components.

### Browser-Local Admin Drafts

Admin edits are saved in `localStorage`. They are available only in the current
browser profile and can be lost when browser storage is cleared.

Recommended direction: retain JSON export during migration, then add server-side
draft storage and an explicit publishing workflow.

### LocalStorage-Based Exam Persistence

Only the active mock exam is stored in `localStorage`. It supports local refresh
recovery but is not a durable attempt record.

Recommended direction: version the stored attempt model and persist completed
attempts server-side after authentication is introduced.

### No Real User Progress Persistence

Dashboard statistics, historical results, review history, and progress trends
are not connected to real attempts.

Recommended direction: define attempts and answers as the source of truth, then
derive dashboard summaries from those records.

### No Supabase Question Storage

The Supabase client exists, but question banks and accepted route geometry are
not stored in Supabase.

Recommended direction: design schema, constraints, validation, migration, and
publishing rules before moving source-bank content.

## Authentication and Authorization

### No User Authentication

Login and registration routes explain the Phase 1 limitation but do not create
or authenticate users.

### No Admin Authentication or Permissions

Anyone who can access the app can open the admin routes. There are no roles,
permissions, audit records, or publishing approvals.

Recommended direction: add Supabase Auth, Row Level Security, an admin role
model, and server-enforced authorization before production use.

## Route Drawing and Scoring

### Prototype-Level Route Scoring

Route scoring uses geometric tolerances and penalties. It is useful for
prototyping but is not examiner-grade map matching.

Remaining work:

- Review accepted route geometry
- Calibrate thresholds with realistic correct and incorrect traces
- Test alternative valid routes
- Improve treatment of route direction and junction decisions
- Evaluate road-graph matching and restriction-aware scoring
- Add regression fixtures from reviewed learner attempts

### Limited Map Coverage

The generated route-training map and graph cover one central London area.

Recommended direction: create a versioned map-area pipeline, validation checks,
and repeatable accepted-route generation process.

## Content

### Representative, Not Official, Questions

Mock-test content demonstrates assessment-related skills but is not official TfL
content and should not be described as such.

Recommended direction: establish content review, source notes, editorial
standards, difficulty calibration, and change history.

### Unreviewed Accepted Routes

Accepted route records currently indicate `reviewed: false`.

Recommended direction: require a named review step before a route becomes active
in a production bank.

## Maps and Accessibility

### Map Styling Needs Further Improvement

The Mapbox click map uses a safe built-in style. The SVG route map is a
controlled OSM-derived training render. Both need continued visual and
cartographic review.

### Accessibility Needs Further Improvement

Interactive maps and freehand route drawing are inherently pointer-heavy.
Keyboard alternatives, non-visual instructions, focus handling, contrast,
reduced-motion behaviour, and screen-reader output need a dedicated audit.

### Mobile Interaction Needs Broader Testing

Touch drawing, pan/zoom mode switching, Mapbox controls, and long admin forms
need testing across real devices and browser engines.

## Testing and Operations

### Test Coverage Must Expand

Current tests cover route scoring, mixed mock scoring, mock selection/timing,
admin helpers, and validation. They do not cover all React interaction flows.

Recommended direction:

- Add component tests for answer restoration and reset behaviour
- Add browser end-to-end tests for learner and admin journeys
- Add accessibility checks
- Add production deployment smoke tests
- Add route-scoring regression fixtures

### No Production Analytics

There is no product analytics, error reporting, performance monitoring, or
operational dashboard.

Recommended direction: define a privacy-conscious event and error taxonomy
after identity and persistence are stable.

### No Payment or Subscription Logic

Pricing, checkout, entitlements, billing events, and subscription lifecycle
handling do not exist.

Recommended direction: defer until authentication, persistence, publishing, and
core learner retention have been validated.

## Legacy Route Shells

`/dashboard`, `/results/[attemptId]`, and `/review` are retained for continuity,
but they cannot display persisted learner data in Phase 1.

Recommended direction: connect these routes to the real attempt repository in
Phase 2 instead of creating parallel result flows.
