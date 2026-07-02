# Phase 6 Real London Map Style Audit

Stage 142 audits the current Real London map rendering state and introduces
central TOPOPASS street-atlas style tokens. It is audit/tokenisation work only:
it does not intentionally redesign the map or change routing, scoring,
snapping, legality, exercise generation, beta gating, persistence, auth,
analytics, OSM conversion, map fixtures, production exposure, or Marlowe/default
map behavior.

This audit should be read with the Phase 6 acceptance contract in
[docs/phase-6-map-styling-acceptance.md](phase-6-map-styling-acceptance.md).

## Stage 143 Styling Application

Stage 143 applies the first TOPOPASS street-atlas base map styling pass. The
canvas now uses a warmer paper-like land colour, OSM road hierarchy tokens have
stronger primary/secondary/local/service contrast, and Marlowe context colours
were moved into the same warmer atlas palette. The route, legality, scoring,
exercise, beta-gate, fixture, and OSM conversion behavior is unchanged.

The renderer can now draw non-routable OSM context polygons and lines directly
from a map option's raw Overpass fixture when those tags are present: parks,
gardens, open space, pedestrian areas, water polygons, waterway lines, and rail
lines render below roads and learner overlays. The current Real London pilot
fixtures remain road-only, so Stage 143 does not fabricate parks, water, rail,
stations, landmarks, or new roads for those maps.

## Stage 144 Road Hierarchy

Stage 144 strengthens the Real London road hierarchy only. The canvas renderer
now draws base-road casings in hierarchy order, then base-road fills in the
same order, so service, restricted, inactive, pedestrian, and local roads sit
below tertiary, secondary, and primary roads. Major and minor roads now use
more differentiated widths, casing colours, fill colours, opacity, and dash
treatments through the central TOPOPASS cartography tokens. Route overlays,
restriction symbols, hints, start/destination/checkpoint markers, review
overlays, snapping, scoring, legality, exercise generation, OSM conversion,
beta gating, feedback, and persistence are unchanged.

## Stage 145 Street Label Readability

Stage 145 makes street labels follow the strengthened road hierarchy without
changing routing behavior. Road-label typography now uses central TOPOPASS
tokens for major, secondary, minor, restricted, and service labels. The label
layout pass filters labels by viewport scale, road-segment screen length, text
fit, repeated-name spacing, and reserved screen areas around active route
overlays, snapped hints, review lines, checkpoints, starts, and destinations.
Converted OSM street labels are now allowed into the learner renderer, with the
decluttering pass deciding which labels are readable enough to draw.

## Stage 145.5 Junction Clarity

Stage 145.5 improves dense Real London road geometry only. Road render passes
are now explicit and deterministic: all hierarchy-sorted casings draw before
all hierarchy-sorted fills, using rounded caps, rounded joins, and small
same-colour endpoint blends to reduce graph-segment seams at junctions. Minor,
service, restricted, and inactive roads are thinned or quieted at low zoom so
primary, secondary, and tertiary roads remain visually dominant. Existing
matched and snap-preview road ids can draw a subtle selected/candidate focus
below labels and learner route overlays. Routing, snapping, scoring, legality,
exercise generation, OSM conversion, beta gating, feedback, and persistence are
unchanged.

## Stage 146 Label Rendering System

Stage 146 expands the learner Canvas label system beyond road labels while
leaving routing behavior unchanged. Labels now have explicit categories for
roads, stations, landmarks, parks, water, and general area/context names.
Category-specific TOPOPASS tokens define text size, colour, halo, collision
padding, priority, and zoom visibility. The same deterministic layout pass
handles road-aligned labels, repeated street-name spacing, collision winners,
reserved route/marker/review areas, and context-label decluttering.

Context labels are generated only from data the current visual model already
has: synthetic Marlowe background polygons and landmarks, converted OSM context
polygons/lines when a fixture contains supported tags, and map landmarks where
present. The current Real London pilot fixtures remain mostly road-only, so
Stage 146 adds hooks and tests for parks, water, rail-line context, stations,
and landmarks without inventing unavailable Real London places.

## Current Rendering Entry Points

- `app/practice/real-london/page.tsx` is the student-facing beta page. It
  mounts the shared route-runner client in student beta mode and keeps beta
  access behind `NEXT_PUBLIC_REAL_LONDON_BETA`.
- `app/practice/real-london/realLondonBetaPracticeScreen.ts` builds the
  student-facing screen model, legend, known limitations, attribution, exercise
  labels, and compact beta diagnostics.
- `app/dev/route-runner/RouteRunnerClient.tsx` owns the canvas rendering loop,
  map controls, route drawing interaction, route/review overlays, restriction
  overlays, OSM debug overlays, replay markers, and compact/dev panels.
- `app/dev/route-runner/syntheticStreetMapRenderer.ts` builds visual models for
  roads, OSM road hierarchy metadata, optional OSM road labels, synthetic
  parks/water/land blocks, fixture-derived OSM context where available,
  synthetic rail, landmarks, road/station/landmark/context labels, route
  overlays, and the route-runner legend.
- `app/dev/route-runner/restrictionMapVisuals.ts` converts no-entry, one-way,
  restricted-road, prohibited-turn, illegal-movement, and missed-restriction
  data into map symbols and legend entries.
- `app/dev/route-runner/routeRunnerDisplay.ts` builds road restriction
  overlays, route issue overlays, required-stop review state, and pipeline
  display helpers.
- `app/dev/route-runner/mapViewport.ts` controls pan/zoom limits, wheel zoom,
  pan clamping, and screen-to-map viewport derivation.
- `app/dev/route-runner/routeRunnerMaps.ts` registers Marlowe, converted OSM,
  and Real London pilot map options. Real London maps use committed Overpass
  fixtures converted through the existing OSM pipeline.
- `lib/map-engine/osm/osmToRouteGraph.ts` preserves OSM highway, way id, and
  metadata that the renderer uses for visual hierarchy. Stage 142 does not
  change this conversion.
- `app/dev/route-runner/topopassCartographyStyle.ts` centralises the TOPOPASS
  cartography tokens, including the Stage 143 base-map colour and hierarchy
  changes.

## Current Layer Inventory

Current canvas layer order in `RouteRunnerClient.tsx` is:

1. Canvas background fill.
2. Synthetic background polygons for Marlowe and fixture-derived OSM context
   polygons where the selected fixture contains supported non-road tags.
3. Synthetic rail/context lines for Marlowe and fixture-derived OSM rail or
   waterway lines where available.
4. Road casing visuals from `buildSyntheticRoadVisuals`, sorted by hierarchy.
   Real London roads are straight graph-segment lines derived from OSM route
   graph nodes.
5. Road casing junction blends at road segment endpoints, using the same
   hierarchy order and casing colours.
6. Road fill visuals from `buildSyntheticRoadVisuals`, sorted by hierarchy.
   Service, restricted, inactive, pedestrian, and local roads draw before
   tertiary, secondary, and primary roads.
7. Road fill junction blends at road segment endpoints, using the same
   hierarchy order and fill colours.
8. Selected/candidate road focus strokes for existing matched route and
   snap-preview road ids.
9. Landmark visuals from map landmarks. Real London pilot maps currently have
   limited landmark/context support compared with the synthetic Marlowe map.
10. Base labels. Synthetic and converted OSM road labels, stations, landmarks,
   parks, water, rail-line context, and area names are filtered by category
   priority, zoom scale, road segment fit, repeated-name spacing, collisions,
   and reserved overlay/marker areas before drawing.
11. Road restriction overlays, when enabled.
12. OSM debug directed-edge overlays, when enabled.
13. Fastest/shortest legal route overlay, when revealed.
14. OSM exercise debug route and blocked-edge overlays, when enabled.
15. Matched attempted movement overlay from the drawn pipeline.
16. Route issue overlays for illegal, disconnected, prohibited-turn, and
    no-U-turn review state.
17. Restriction map symbols for one-way arrows, no-entry signs, restricted
    road signs, turn-ban signs, and route issue symbols.
18. Selected restriction/review focus highlight.
19. Small graph node dots.
20. Matched route node markers.
21. Exercise stop markers for start, destination, and checkpoints.
22. Exercise stop labels.
23. Snapped route preview line.
24. Raw drawn route strokes.
25. Snapped original-point dots.
26. Route replay markers.

## Current Styling Source Inventory

- `topopassCartographyStyle.ts` contains named tokens for current road colours,
  road casing colours, widths, road geometry, junction blends, road interaction
  focus, hierarchy-specific road label fonts/colours/halos, context label
  fonts/colours/halos, label visibility thresholds, label collision spacing,
  background features, rail, station/landmark markers, route overlays, exercise markers, hints,
  restrictions, review overlays, replay markers, node markers, zoom thresholds,
  and decluttering thresholds.
- `syntheticStreetMapRenderer.ts` now reads road hierarchy, synthetic road
  styles, OSM road styles, background feature colours, rail styling, landmark
  styling, road/context label priorities, label visibility, and route overlay
  styles from the token object.
- `RouteRunnerClient.tsx` now reads active canvas map styling, exercise marker
  styling, label text/halo styling, restriction overlay/symbol styling, review
  overlay styling, fastest route styling, replay markers, node markers, raw
  route, and snap-preview values from the token object where extraction was
  safe.
- `restrictionMapVisuals.ts` now reads one-way arrow density thresholds from
  the token object.
- `mapViewport.ts` now reads route-runner zoom thresholds from the token object.
- Tailwind class names still control surrounding panels, forms, buttons,
  mobile layout, and non-canvas page chrome.
- OSM QA/debug overlay styles from `routeRunnerOsmDebug.ts` remain separate
  dev/debug styling and were not folded into the learner cartography token set
  in this stage.

## Road Style Handling

- OSM road hierarchy is derived from preserved `highway` metadata:
  `primary`, `secondary`, `tertiary`, `residential`, `service`, `pedestrian`,
  `inactive`, and `unknown`.
- `primary` roads render as the strongest warm yellow/orange roads with the
  widest casing and fill. Secondary and tertiary roads use progressively
  lighter warm treatments. Residential and unknown roads render as pale local
  streets with quieter grey casings. Service, pedestrian, restricted, and
  inactive roads render thinner and more subdued.
- At low zoom, residential and unknown roads are slightly thinned and quieted;
  service, pedestrian, restricted, and inactive roads are thinned or faded more
  aggressively. Primary, secondary, and tertiary hierarchy remains unchanged at
  those zoom levels.
- Junction clarity uses deterministic casing/fill passes plus same-colour
  endpoint blends, so graph-segment endpoints read more like continuous streets
  without modifying the route graph.
- No-entry and road-closed restrictions override the general road class for
  visual modelling.
- Real London road geometry is graph-segment based, so long real-world OSM ways
  appear as multiple rendered segments. Group ids are used for one-way arrow
  decluttering on the same OSM way where available.

## Labels

- Real London/OSM road labels are learner-visible through the Stage 145
  hierarchy and decluttering pass instead of being limited to OSM QA/debug
  overlays.
- Major road labels use the strongest type treatment and lower visibility
  threshold. Secondary and tertiary labels are smaller. Minor street labels
  require more zoom and enough segment length. Service, restricted, and inactive
  labels are heavily limited.
- Station labels are stronger than generic landmark labels. Park, water, rail,
  and area/context labels are quieter and require enough zoom before they enter
  the collision pass.
- Labels are skipped when text would not fit the visible road segment, when the
  same road name was already placed nearby, when their category is below the
  current zoom threshold, or when their screen box intersects reserved route,
  hint, review, start, checkpoint, or destination areas.
- Synthetic Marlowe labels remain available for non-service roads, stations,
  landmarks, parks, water, area polygons, rail context, and exercise stops.
  Converted OSM context labels are available only where the selected fixture has
  supported non-road tags.
- Stop labels are drawn after markers, keeping start/destination/checkpoint
  labels above the base map.

## Route and Learner Overlays

- Raw drawing is orange.
- Snapped preview is green dashed.
- Matched route and attempted movements are purple when matched and red when
  unresolved/illegal.
- The revealed shortest legal route is blue dashed with a white halo.
- Route issue overlays use red or rose styling, with dashed treatment for
  disconnected gaps.
- Start markers are green, checkpoints orange, and destinations purple. They
  draw above the base map and are labelled with compact text.
- Hints are currently represented mainly through the snap preview, correction
  panels, fastest-route reveal, and review text rather than a dedicated hint
  map layer.

## Restrictions and One-Way Rendering

- Road restriction overlays can show no-entry, one-way, and restricted-road
  line treatments.
- Restriction map symbols include red no-entry signs, blue one-way arrows,
  amber restricted-road diamonds, rose turn-ban symbols, and route issue
  symbols.
- Stage 131 one-way decluttering remains active: arrows on the same rendered
  road group are spaced by at least 50 metres, and longer roads can receive two
  arrows.
- In student Real London beta mode, road restriction overlays are enabled and
  turn restriction overlays are collapsed/hidden by default outside internal QA
  surfaces.

## Context Features

- Synthetic Marlowe has parks, water, land-blocks, rail, landmarks, and area
  labels.
- Real London converted OSM maps can render OSM-derived parks, water, rail, and
  open-space context when the selected raw fixture includes those tags. The
  current Real London pilot fixtures do not include them, so those maps still
  rely primarily on the street hierarchy and atlas land background for context.
- OSM attribution is shown in the beta page and route-runner panels where
  OSM-derived Real London data is presented.

## Mobile and Zoom Behavior

- Mobile layout improvements from Phase 5 keep the student beta screen compact,
  collapse detailed instructions/limitations, and use a smaller mobile map
  height.
- Pan, zoom, draw, and scroll behavior are controlled by `mapViewport.ts` and
  `RouteRunnerClient.tsx`. The current zoom thresholds are default `1`, min
  `0.75`, max `10`, step `0.25`, and pan margin `80`.
- There is no broad base-map zoom decluttering yet. The main decluttering
  behavior is optional OSM road-label visibility and one-way arrow spacing.
- Repeated one-way arrows are thinned, but road labels, landmarks, restrictions,
  and context features do not yet have a full zoom-based density model.

## Current Strengths

- Real London route practice uses one shared route-runner canvas path, so dev
  and beta views share rendering, drawing, snapping, scoring, review, and QA
  overlay behavior.
- Road hierarchy metadata from OSM is preserved and already feeds visual road
  classes.
- Active learner overlays are generally drawn above base roads and context.
- One-way arrows already have deterministic density suppression.
- OSM attribution is surfaced in the beta practice page and related panel
  models.
- Stage 142 centralises current style values into named tokens, making future
  changes easier to review against the Stage 141 checklist.

## Current Weaknesses Against Stage 141

- Road hierarchy: Stage 144 and Stage 145.5 distinguish major, secondary,
  residential, service, one-way, no-entry, restricted, inactive, and selected
  candidate roads with explicit pass ordering, junction blends, low-zoom
  quieting, and focus strokes. Future work still needs fully generalized
  cartographic generalisation for long OSM ways and merged multi-segment roads.
- Label readability: Stage 145 and Stage 146 add learner-visible OSM road
  labels plus station, landmark, park, water, rail-line, and area/context label
  hooks with hierarchy, zoom, fit, repeat, priority, collision, and
  reserved-area rules. Future work still needs full curved placement and richer
  collision handling for dense parallel roads.
- Zoom decluttering: road labels and one-way arrows now have explicit
  decluttering. Most non-label layers still do not respond to zoom level.
- Parks/water/rail/stations/bridges/landmarks/area names: the renderer now has
  category-specific label hooks for available context data, but the current
  Real London base maps are still mostly road-only because the committed pilot
  fixtures do not yet carry broad non-road context or landmark data.
- Learner overlays: start, destination, checkpoint, route, restriction, and
  review overlays are visible above the base map, but some meanings still rely
  strongly on colour and compact text panels.
- Route review clarity: route review overlays exist, but overlapping route
  geometries and dense central London streets still need clearer hierarchy,
  non-colour cues, and review-state composition.
- Mobile map usability: mobile layout is practical for beta testing, but dense
  map symbols and hidden labels limit learner orientation on small screens.
- Performance: current fixture-backed rendering is stable, but future labels
  and context layers will need explicit density and redraw checks.
- Attribution: attribution exists, but future overlay and mobile layout changes
  must continue to verify that it remains visible.

## Recommended Next Styling Stages

1. Add a Real London base-map layer model for parks, water, rail/stations,
   bridges, landmarks, and area names from existing committed OSM data, without
   changing routing or scoring.
2. Add curved/along-road label placement and junction-name support once the
   base label hierarchy has been validated in learner QA.
3. Add zoom-based decluttering for restrictions,
   landmarks, and learner aids.
4. Strengthen route review cartography with non-colour cues for missed,
   illegal, correct, and user-drawn sections.
5. Run a mobile-specific Real London readability pass after labels and context
   features exist.
6. Add performance checks for large Real London fixtures after any new
   label/context layer is introduced.

## Stage 142 Scope Confirmation

Stage 142 documents the current state and centralises existing style values.
Renderer values were migrated to tokens only where that was safe and intended
to preserve the current appearance. This stage does not intentionally redesign
the map, expose new Real London data, alter beta gating, or change any route
engine, scoring, snapping, legality, OSM conversion, fixture, persistence, auth,
analytics, production, or Marlowe/default behavior.
