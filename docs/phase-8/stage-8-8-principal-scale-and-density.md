# Stage 8.8: Principal Examination-Atlas Scale And Information Density

## Status

Complete. Stage 8.8 registers a source-backed Victoria / Westminster / Vauxhall
visual-QA benchmark, applies reusable principal-scale density rules, and records
desktop, tablet, mobile, active-route and submitted-review evidence. Stage 8.9
was not started.

## Benchmark And Provenance

`victoriaWestminsterVauxhallOverpass.json` is a committed OpenStreetMap Overpass
export captured at `2026-07-13T16:48:15Z`. The 3,968,601-byte source contains
26,733 elements: 24,574 nodes, 2,083 ways and 76 relations. Raw IDs, tags,
members, geometry, OSM metadata and attribution are retained.

The fixture is registered as `visualQaOnly`, `scoreable: false`,
`visibleInBeta: false` and `betaPracticeAllowed: false`. Its 3.9 MB JSON module
and conversion code sit behind the existing dynamic map-option boundary, so the
benchmark is not parsed by the default learner route-runner bundle. Selecting
the benchmark hydrates 2,310 route nodes and 2,389 road segments. It has no
invented route exercise.

Deterministic source/context coverage includes:

| Coverage | Count |
| --- | ---: |
| Named roads | 609 |
| One-way tagged ways | 387 |
| Turn-restriction relations | 59 |
| Road-reference features | 261 |
| A-road / B-road reference features | 246 / 15 |
| Building footprints | 57 |
| Institutional areas | 12 |
| Land-use blocks | 56 |
| Park/open-space features | 89 |
| Water features | 12 |
| Rail / station features | 65 / 5 |
| Supported compact public-feature candidates | 136 |

Raw relation/member recursion includes coordinates outside the displayed road
projection. The rendered map bounds are derived from retained road geometry,
not those outliers.

## Principal-Scale Rules

Stage 8.8 adjusts central typed cartographic tokens rather than fixture-specific
draw code. At displayed 100%:

- Major, secondary, minor and service-road names admit slightly shorter usable
  source geometry and repeat at shorter, still bounded intervals.
- Label collision padding is reduced modestly so dense real streets do not
  create artificial blank fields.
- Existing viewport padding, source-geometry placement, category priorities and
  collision rejection remain active.
- One-way arrows use wider spacing and lower alpha so repeated blue marks do not
  compete with street names.
- Existing distinct-reference-first selection and A/B reference budgets remain
  unchanged.

The benchmark regression records 55 road names, five road references and two
district labels at desktop displayed 100%, with 11 road names and four road
references in the mobile acceptance viewport. Every accepted road reference is
tested against matching rendered major-road geometry, casing/fill passes and
its own source-aligned label geometry.

## Visual Evidence

All captures use the production canvas renderer at displayed 100% and retain
OpenStreetMap attribution.

| Scenario | Viewport/state | Screenshot |
| --- | --- | --- |
| Victoria / Westminster / Vauxhall benchmark | 1440 by 900, idle | `screenshots/stage-8-8/desktop-victoria-westminster-vauxhall-100.png` |
| Victoria / Westminster / Vauxhall benchmark | 1024 by 768, idle | `screenshots/stage-8-8/tablet-victoria-westminster-vauxhall-100.png` |
| Victoria / Westminster / Vauxhall benchmark | 390 by 844, idle | `screenshots/stage-8-8/mobile-victoria-westminster-vauxhall-100.png` |
| Piccadilly dense junction | 1440 by 900, idle | `screenshots/stage-8-8/desktop-piccadilly-principal-100.png` |
| Waterloo river/bridge context | 1440 by 900, idle | `screenshots/stage-8-8/desktop-waterloo-principal-100.png` |
| King's Cross / Euston | 1440 by 900, idle | `screenshots/stage-8-8/desktop-kings-cross-principal-100.png` |
| Quiet residential context | 1440 by 900, idle | `screenshots/stage-8-8/desktop-quiet-residential-100.png` |
| One-way/restriction context | 1440 by 900, idle | `screenshots/stage-8-8/desktop-one-way-restrictions-100.png` |
| Active learner comparison route | 1440 by 900, active | `screenshots/stage-8-8/desktop-active-learner-route-100.png` |
| Correct submitted review | 1440 by 900, pass | `screenshots/stage-8-8/desktop-correct-review-100.png` |
| Incorrect submitted review | 1440 by 900, failed required stop | `screenshots/stage-8-8/desktop-incorrect-review-100.png` |

Normal-size inspection against the approved visual master found a denser,
useful local-street field without broad collision voids. Yellow major corridors
and red A/B references retain authority; local names, districts, buildings,
institutions, parks, water, rail and compact symbols fill context without
overtaking learner overlays. Labels follow source geometry. Route, marker,
review, attribution and coordinate alignment remain intact.

## Deliberate Non-Changes

Stage 8.8 does not change route generation, route exercises, legality,
restrictions, matching, snapping, scoring, hints, feedback, persistence,
authentication, payments, deployment, coordinate transforms, map pan/zoom/reset
semantics, learner marker ownership or review-overlay draw order. It does not
make the benchmark learner-visible and does not fabricate missing buildings,
roads, labels, restrictions or public features.

## Known Limitations

- The benchmark is intentionally a development visual-QA fixture with no scored
  exercise.
- Source turn-restriction relations are audited but are not converted into
  scored restrictions by the current route-graph importer.
- Building and named public-feature coverage is limited to retained source
  geometry; sparse blocks remain sparse.
- At 390 by 844, the development-only QA toolbar is wider than the map viewport
  and wraps/crops. The map canvas, source geometry and accepted labels remain
  aligned; Stage 8.10 owns the broader mobile/accessibility pass.
- The benchmark still performs a substantial import/conversion when explicitly
  selected. It remains outside default learner loading.

## Validation

The focused Stage 8.8 renderer, registration, provenance and beta-gate tests
passed. Final required validation also passed:

- `npm.cmd run lint`
- `npm.cmd run test:map` (1,217 passed, 0 failed, 0 skipped)
- `npm.cmd test`
- `npm.cmd run build` (70 static pages generated)
- `git diff --check`
