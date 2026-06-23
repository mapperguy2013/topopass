# Phase 1 Closure

## Summary

Phase 1 establishes TopoPass as a complete local/static MVP for testing the
learning experience. The app now covers public product context, route practice,
Mapbox location questions, route drawing, a timed mixed mock exam, result
review, and browser-local admin tools.

The phase intentionally proves product flows and scoring architecture before
introducing production identity, persistence, permissions, payments, or
analytics.

## Completed Stages 1-14

1. Project scaffold, responsive layout, initial routes, Supabase client setup,
   and Mapbox dependency setup.
2. Standalone Mapbox click-location proof of concept.
3. Reusable `MapClickQuestion` component.
4. First map-click question connected to the mock-test flow.
5. Multi-question Mapbox demo with final scoring.
6. Mixed mock-test question model for knowledge and map-click questions.
7. Driver-focused map work, static route-drawing prototype, real OSM map
   generation, hidden route graph, and removal of unsafe Mapbox style layers.
8. Reusable route scoring, accepted-route overlays, multiple route questions,
   and route-demo zoom/pan controls.
9. Shared route-question model, bank, and lookup helpers.
10. Route question bank connected to Practice and Learn.
11. Route-question admin creation, editing, validation, preview, local drafts,
    and JSON export.
12. Full mixed mock-exam engine with knowledge, map-click, route-drawing,
    results, and review.
13. Exam timing, local attempt recovery, question selection, realism, and
    representative question-bank expansion.
14. Unified admin dashboard, inventory, validation, and managers for all three
    question types.

## What Is Working

- Public landing page with clear private-hire applicant positioning
- Learn page with route-planning guidance
- Practice selector and working route practice
- Real OSM-derived King's Cross, Euston, and Bloomsbury training map
- Mouse and touch route drawing with zoom, pan, clear, and submit controls
- Prototype route scoring and detailed feedback
- Multi-question Mapbox demo
- Timed mixed mock exam with randomized content
- Knowledge, map-click, and route-drawing answer storage during an active exam
- Unanswered-question state and submit confirmation
- Automatic submission when the timer expires
- Overall score, pass/fail status, per-type breakdown, and answer review
- Browser-local active-exam recovery
- Admin inventory and managers for all supported question types
- Validation and JSON export for browser-local admin drafts
- Lint, deterministic tests, TypeScript checking, and production build

## Intentionally Not Production-Ready

- Login and registration are not connected to an identity provider.
- Supabase is scaffolded but not used for application data.
- Question banks are committed TypeScript files.
- Admin changes are local browser drafts until exported and reviewed.
- Admin routes have no authentication or role checks.
- Completed attempts and progress are not stored after the active local session.
- Historical result and review routes do not load persisted attempts.
- Payments, subscriptions, and production analytics are not implemented.
- Current content is representative training material, not official TfL
  assessment content.

## Technical Debt

The prioritized debt register is maintained in `docs/TECHNICAL_DEBT.md`.
The highest-impact areas are:

1. Establishing a typed persistence boundary before adding Supabase storage.
2. Calibrating route scoring against reviewed routes and real learner traces.
3. Improving map accessibility and responsive interaction testing.
4. Expanding automated coverage beyond deterministic scoring and validation.
5. Replacing legacy local-only dashboard, results, and review shells with
   persisted attempt data in Phase 2.

## Known Limitations

- Mapbox pages require a valid `NEXT_PUBLIC_MAPBOX_TOKEN`.
- Mapbox network or token failures cannot be covered by the current unit tests.
- Route drawing is optimized around one generated central London map area.
- Accepted route geometry is marked unreviewed in the route bank.
- Browser `localStorage` is device- and browser-specific and can be cleared.
- Admin JSON export requires manual source review before learner content changes.
- The current test suite does not provide full browser end-to-end coverage.

## Recommended Manual QA Checklist

Use `docs/MANUAL_QA_CHECKLIST.md` for the complete founder checklist. At a
minimum, test:

- Desktop and mobile navigation
- Route drawing with both mouse and touch
- Mapbox click selection and scoring
- Mock-exam answer retention, timer, unanswered submission, results, and review
- Admin create/edit/validate/preview/export flows for every question type
- Browser console output while using all interactive pages

## Recommended Phase 2 Starting Point

Start with persistence design, not payments.

1. Define stable database records for questions, accepted route geometry,
   attempts, answers, and user progress.
2. Introduce a repository layer so existing static banks and future Supabase
   storage share typed application interfaces.
3. Add Supabase authentication and Row Level Security.
4. Protect admin routes and define draft, review, publish, archive, and rollback
   behaviour.
5. Persist completed attempts and connect dashboard, results, and review routes.
6. Add browser end-to-end tests for the persisted learner and admin flows.

Only after these foundations are stable should Phase 2 consider subscriptions,
payments, and production analytics.
