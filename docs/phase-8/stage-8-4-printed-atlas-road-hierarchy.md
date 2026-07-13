# Stage 8.4: Printed-Atlas Road Hierarchy And Major-Road Corridors

## Status

Implemented in the production Real London renderer. Manual visual acceptance
is pending because no browser backend was available during this stage. Stage
8.4 is therefore not marked complete.

## Goal And Educational Purpose

Stage 8.4 begins moving the Real London renderer into TOPOPASS's original
printed examination-atlas family. The road base should let learners recognise
hierarchy quickly, follow principal corridors across split OSM segments, and
understand how secondary and side streets connect without turning the exercise
into route-first navigation.

## Reference And Affected Systems

The approved appearance reference was inspected at
`references/phase-8-approved-exam-atlas-visual-master.png`. It informed the
relationship between broad yellow corridors, dark edges, quieter side streets,
and dense road context only. No names, references, geometry, exact colours,
fonts, symbols, or label positions were copied.

Affected production systems:

- `topopassCartographyStyle.ts`: central road palette, widths, geometry,
  junction, interaction, and zoom tokens.
- `syntheticStreetMapRenderer.ts`: OSM way traceability on prepared road
  visuals; existing classification and render passes are retained.
- `RouteRunnerClient.tsx`: existing production canvas consumer, unchanged.
- Renderer and visual-scenario tests.

## Road Hierarchy And Corridor Rules

- OSM `primary` and `primary_link` remain the principal tier and now use an
  original flat-yellow fill with a firm charcoal casing.
- OSM `secondary` and `secondary_link` use a narrower muted-yellow corridor.
- Tertiary roads use a warm near-white fill and mid-strength edge.
- Residential and unclassified roads remain readable white local streets with
  a narrower neutral casing.
- Service, pedestrian, restricted, inactive, and unknown roads remain
  progressively quieter and do not receive the principal yellow treatment.
- The renderer still draws all deterministic casing passes before all fill
  passes, ordered from quiet roads to principal corridors.
- Safe round joins and a low miter limit prevent spikes. Butt line caps combine
  with one deduplicated half-width junction disc only where split segments from
  the same OSM way share an exact endpoint and visual treatment. True terminals,
  fixture-boundary endpoints, and mixed-tier transitions do not receive discs.
- Prepared OSM road visuals now retain `osmWayId`, allowing split segments from
  the same source way to be verified as one classified corridor without
  changing or merging route geometry.
- Major, secondary, local, service, and restricted zoom gains and caps are
  tiered. Principal roads remain dominant at low, principal, high, and maximum
  semantic zoom instead of local roads growing faster than major corridors.

## Movement Toward The Visual Master

The previous primary treatment used a pale casing around a narrow brown fill.
The new treatment reverses that relationship into the broad yellow surface and
crisp dark edge expected of a printed examination atlas. Secondary, tertiary,
residential, and service tiers step down in width, colour strength, and zoom
growth, preserving side-street context without making every road yellow.

The implementation remains recognisably TOPOPASS: its palette and proportions
are original, existing learner labels and overlays remain in place, and only
permitted OSM-derived classifications and geometry determine road hierarchy.

## Accuracy And Originality Boundaries

- Hierarchy comes only from imported OSM `highway` classes and existing
  synthetic-map rules; names do not influence classification.
- Route coordinates, graph edges, restrictions, snapping, hit testing, and
  painted geometry are not modified or duplicated.
- OSM attribution remains in the existing map UI.
- Stage 8.3 road-reference data remains unconsumed. No A/B references or
  shields are displayed in Stage 8.4.

## Non-Goals

This stage does not render buildings, land use, institutional areas, estates,
road references, new symbols, or denser label placement. It does not redesign
parks, water, rail, stations, labels, one-way arrows, or restrictions except
for preserving their contrast and layer order. Route generation, legality,
matching, snapping, scoring, curated routes, attempts, hints, feedback,
progress, persistence, authentication, payment, deployment, and map
interaction logic are unchanged.

## Automated Validation

Focused tests cover:

- OSM classification and deterministic quiet-to-major ordering.
- Global casing-before-fill pass order.
- Dark-casing/yellow-fill relationships and tier width ordering.
- Restrained residential, service, pedestrian, inactive, and restricted roads.
- Tier-specific zoom gains and maximum width caps.
- Same-OSM-way segment metadata and identical corridor styles.
- Shared-junction detection, terminal and mixed-tier exclusion, half-width cap
  bounds, safe join tokens, deterministic ordering, and geometry immutability.
- Base roads below labels, one-way arrows, restrictions, routes, warnings,
  markers, and review overlays.
- Existing bridge, one-way, restriction, route, and coordinate tests through
  the complete map suite.
- Source road refs remaining absent from rendered road labels.

Required validation commands:

```bash
npm.cmd run lint
npm.cmd run test:map
npm.cmd test
npm.cmd run build
git diff --check
```

## Manual Visual QA And Screenshot Scenarios

Completed:

- Inspected the approved visual master for road hierarchy, casing, corridor,
  and side-street relationships.
- Audited the production classification, style, zoom, pass, junction, canvas,
  and overlay code paths.
- Started the local application successfully on `http://localhost:3001`.
- Attempted to connect the in-app browser; browser discovery returned no
  available browser backends.
- Reviewed supplied desktop captures for King's Cross/Euston and quiet-road
  fixtures. They confirmed corridor hierarchy, casing, overlay visibility, and
  attribution, while exposing oversized endpoint and multi-lobed junction discs.
- Restricted junction discs to deduplicated, same-way shared joins. Terminal,
  fixture-boundary, and hierarchy-transition endpoints now rely on the normal
  restrained butt-ended road strokes.

Not completed and still required:

- Before/after production screenshots for Piccadilly Circus, a principal road
  corridor, Waterloo Bridge, King's Cross/Euston, the one-way-system fixture,
  and quiet residential roads.
- Low, principal, high, and very-high zoom review on desktop and at least one
  mobile-width viewport.
- Live route drawing, correct and incorrect review, pan, wheel zoom, mobile
  pinch zoom, marker/checkpoint alignment, one-way/restriction visibility, and
  OSM attribution checks.
- Side-by-side cartographic-family comparison with the approved visual master.
- Replacement King's Cross/Euston and quiet-road captures confirming that split
  seams remain closed without bulbs, gaps, spikes, or enlarged boundary ends.

Visual acceptance must not be inferred from token values or tests. Stage 8.4
can be marked complete only after those production-renderer checks pass.

## Performance Considerations

The implementation keeps the existing memoised road-visual preparation and
does not add per-frame classification, duplicated roads, or geometry merging.
Shared-junction plans are cached by the prepared road-visual array. The existing
two-pass renderer remains deterministic. Lower tier-specific zoom caps reduce
extreme high-zoom stroke growth, while OSM way traceability adds only one
optional string to prepared OSM visuals.

## Known Limitations

- Corrected junction appearance and split-segment seams still require replacement
  production screenshots at desktop and mobile widths.
- Exact-coordinate, same-way segment joins receive continuity discs. Separate
  OSM ways and mixed visual tiers connect through ordered butt-ended strokes;
  dense transitions still require visual review at every semantic zoom.
- Bridge/tunnel contrast relies on existing context styling and needs live
  review against the stronger road corridors.
- Building fabric and institutional/land-use context remain intentionally
  absent until Stage 8.5.
- Road references remain intentionally absent until Stage 8.7.

## Stage 8.5 Hand-Off

Stage 8.5 adds source-backed dense labels and road references above the
established road base. It must preserve corridor dominance, casing/fill pass
order, junction continuity, learner-overlay priority, and current performance
limits. Building fabric and area-fill redesign remain in the following stage.

## Commit Message

`Add Phase 8 printed-atlas road hierarchy`
