# Stage 8.8: Principal Examination-Atlas Scale And Information Density

## Status

Complete. Stage 8.8 registers a source-backed Victoria / Westminster / Vauxhall
visual-QA benchmark, applies reusable principal-scale density rules, and records
desktop, tablet, mobile, active-route and submitted-review evidence. Stage 8.9
was not started.

## Benchmark And Provenance

`victoriaWestminsterVauxhallOverpass.json` is a committed OpenStreetMap Overpass
export captured at `2026-07-13T21:07:45Z`. The 10,053,476-byte route source
contains 58,446 elements: 47,846 nodes, 10,573 ways and 27 relations. Its raw
bounds are `51.4838..51.5047` latitude and `-0.158..-0.1115` longitude. Raw IDs,
tags, members, geometry, OSM metadata and attribution are retained.

Visual QA showed that this lightweight export contained only 293 closed
building ways, so missing fabric was primarily a source-data gap. It also
showed a renderer gap: the existing building minimum scale was above the
displayed-100% viewport scale, suppressing even the retained footprints.
`victoriaWestminsterVauxhallBuildingsOverpass.json` is therefore a targeted,
5,699,779-byte building-only Overpass response for the same principal bounds.
It contributes 5,677 complete closed ways with inline source geometry. The
returned intersecting geometry reaches `51.4826363..51.5052893` latitude and
`-0.1595755..-0.1094953` longitude; no missing geometry is fabricated.

The fixture is registered as `visualQaOnly`, `scoreable: false`,
`visibleInBeta: false` and `betaPracticeAllowed: false`. The 9.59 MiB route
fixture, 5.44 MiB context-only supplement and conversion code sit behind the
existing dynamic map-option boundary, so neither source is parsed by the
default learner route-runner bundle. The building supplement is never consumed
by route conversion. Selecting the benchmark still hydrates exactly 8,426
route nodes and 8,914 road segments. It has no invented route exercise.

Deterministic source/context coverage includes:

| Coverage | Count |
| --- | ---: |
| Named roads | 2,495 |
| One-way tagged ways | 1,512 |
| Turn-restriction relations | 0 |
| Road-reference features | 945 |
| A-road / B-road reference features | 857 / 88 |
| Complete source building ways | 5,970 |
| Adapted/rendered building footprints | 5,675 |
| Institutional areas | 233 |
| Land-use blocks | 264 |
| Park/open-space features | 392 |
| Water features | 52 |
| Rail / station features | 456 / 12 |
| Supported compact public-feature candidates | 336 |

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
- Complete inline Overpass way geometry can feed context polygons without
  creating route nodes or roads.
- Building gates admit small source-backed footprints at the principal scale;
  stronger low-scale fill alpha and outlines make that fabric legible at normal
  size.
- Primary through service-road widths are reduced while preserving their typed
  hierarchy, yellow-corridor treatment and dark edges.
- `place=neighbourhood` and `place=locality` use compact estate typography;
  `place=square` uses compact contextual-area typography instead of district
  typography.

The benchmark regression requires at least 5,600 adapted and 5,500 visible
building footprints, at least 55 road names and four road references at desktop
displayed 100%, and at least eight road names in the mobile acceptance viewport.
Every accepted road reference is tested against matching rendered road
geometry, casing/fill passes and its own source-aligned label geometry.

## Visual Evidence

All captures use the production canvas renderer at displayed 100% and retain
OpenStreetMap attribution.

| Scenario | Viewport/state | Screenshot |
| --- | --- | --- |
| Stage 8.8 density/hierarchy correction | 1440 by 900 browser window, 1265 by 712 content capture, idle at displayed 100% | `screenshots/stage-8-8/desktop-victoria-westminster-vauxhall-100-density-correction.png` |
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

Normal-size inspection of the correction against the approved visual master
found a materially denser local-street and building field without broad
collision voids. Yellow major corridors remain authoritative but no longer
overwhelm the source-backed fabric. Red A/B references remain readable; local
names, districts, buildings, institutions, parks, water, rail and compact
symbols fill context without overtaking learner overlays. Labels follow source
geometry. Route, marker, review, attribution and coordinate alignment remain
intact.

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
- This lightweight source export carries one-way and access metadata but no
  turn-restriction relations.
- Building and named public-feature coverage is limited to retained source
  geometry. The building supplement contains inline way geometry rather than
  route-node records and is deliberately context-only.
- At 390 by 844, the development-only QA toolbar is wider than the map viewport
  and wraps/crops. The map canvas, source geometry and accepted labels remain
  aligned; Stage 8.10 owns the broader mobile/accessibility pass.
- The benchmark still imports about 15.0 MiB of JSON and performs a substantial
  context conversion when explicitly selected. It remains outside default
  learner loading.

## Validation

The focused Stage 8.8 renderer, registration, provenance and beta-gate tests
passed. Final required validation also passed:

- `npm.cmd run lint`
- `npm.cmd run test:map` (1,219 passed, 0 failed, 0 skipped)
- `npm.cmd test`
- `npm.cmd run build` (70 static pages generated)
- `git diff --check`
