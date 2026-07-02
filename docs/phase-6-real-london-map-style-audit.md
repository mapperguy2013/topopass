# Phase 6 Real London Map Style Audit

Stage 142 audits the current Real London map rendering state and introduces
central TOPOPASS street-atlas style tokens. It is audit/tokenisation work only:
it does not intentionally redesign the map or change routing, scoring,
snapping, legality, exercise generation, beta gating, persistence, auth,
analytics, OSM conversion, map fixtures, production exposure, or Marlowe/default
map behavior.

This audit should be read with the Phase 6 acceptance contract in
[docs/phase-6-map-styling-acceptance.md](phase-6-map-styling-acceptance.md).

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
  roads, OSM road hierarchy metadata, optional OSM road labels, synthetic-only
  parks/water/land blocks, synthetic rail, landmarks, route overlays, and the
  route-runner legend.
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
- `app/dev/route-runner/topopassCartographyStyle.ts` now centralises the
  current TOPOPASS cartography tokens without intentional visual changes.

## Current Layer Inventory

Current canvas layer order in `RouteRunnerClient.tsx` is:

1. Canvas background fill.
2. Synthetic background polygons for Marlowe only. Converted OSM/Real London
   maps currently receive no park, water, land-block, rail, station-area,
   bridge, landmark, or area polygon layer from OSM.
3. Synthetic rail/context lines for Marlowe only.
4. Road visuals from `buildSyntheticRoadVisuals`. Real London roads are
   straight graph-segment lines derived from OSM route graph nodes.
5. Landmark visuals from map landmarks. Real London pilot maps currently have
   limited landmark/context support compared with the synthetic Marlowe map.
6. Base labels. Synthetic road, area, and landmark labels are visible by
   default. OSM road labels exist but are only shown when OSM QA/debug overlays
   are visible.
7. Road restriction overlays, when enabled.
8. OSM debug directed-edge overlays, when enabled.
9. Fastest/shortest legal route overlay, when revealed.
10. OSM exercise debug route and blocked-edge overlays, when enabled.
11. Matched attempted movement overlay from the drawn pipeline.
12. Route issue overlays for illegal, disconnected, prohibited-turn, and
    no-U-turn review state.
13. Restriction map symbols for one-way arrows, no-entry signs, restricted
    road signs, turn-ban signs, and route issue symbols.
14. Selected restriction/review focus highlight.
15. Small graph node dots.
16. Matched route node markers.
17. Exercise stop markers for start, destination, and checkpoints.
18. Exercise stop labels.
19. Snapped route preview line.
20. Raw drawn route strokes.
21. Snapped original-point dots.
22. Route replay markers.

## Current Styling Source Inventory

- `topopassCartographyStyle.ts` contains named tokens for current road colours,
  road casing colours, widths, label fonts/colours/halos, background features,
  rail, station/landmark markers, route overlays, exercise markers, hints,
  restrictions, review overlays, replay markers, node markers, zoom thresholds,
  and decluttering thresholds.
- `syntheticStreetMapRenderer.ts` now reads road hierarchy, synthetic road
  styles, OSM road styles, background feature colours, rail styling, landmark
  styling, label priorities, and route overlay styles from the token object.
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
  `primary`, `secondary`, `tertiary`, `residential`, `service`, and `unknown`.
- `primary` roads render as the strongest yellow/orange roads. Secondary and
  tertiary roads share a lighter yellow treatment. Residential and unknown
  roads render as grey/white context roads. Service roads render thinner and
  more subdued.
- No-entry and road-closed restrictions override the general road class for
  visual modelling.
- Real London road geometry is graph-segment based, so long real-world OSM ways
  appear as multiple rendered segments. Group ids are used for one-way arrow
  decluttering on the same OSM way where available.

## Labels

- Real London/OSM road labels are implemented but hidden unless OSM QA/debug
  overlays are visible.
- Synthetic Marlowe labels are always visible for non-service roads, area
  polygons, labelled landmarks, and exercise stops.
- Label collision avoidance is not currently implemented in the route-runner
  canvas renderer.
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
- Real London converted OSM maps currently do not render OSM-derived parks,
  water, rail, station footprints, bridges, landmarks, or area names as base
  context layers.
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

- Road hierarchy: major, secondary, residential, service, one-way, no-entry, and
  restricted roads are distinguished, but Real London still reads as graph
  segments rather than a polished street-atlas base map.
- Label readability: Real London OSM road labels are not available in the
  normal learner view, and there is no label collision/priority system for
  learner-scale OSM labels.
- Zoom decluttering: only one-way arrows and debug-gated OSM labels are
  meaningfully decluttered. Most layers do not respond to zoom level.
- Parks/water/rail/stations/bridges/landmarks/area names: these are largely
  absent for Real London base maps, even though they exist in the synthetic
  Marlowe visual model.
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
2. Introduce learner-safe OSM road labels with priority, collision avoidance,
   and zoom thresholds.
3. Improve Real London road hierarchy styling using the new tokens, starting
   with current OSM highway classes and restricted-road distinctions.
4. Add zoom-based decluttering for labels, one-way symbols, restrictions,
   landmarks, and learner aids.
5. Strengthen route review cartography with non-colour cues for missed,
   illegal, correct, and user-drawn sections.
6. Run a mobile-specific Real London readability pass after labels and context
   features exist.
7. Add performance checks for large Real London fixtures after any new
   label/context layer is introduced.

## Stage 142 Scope Confirmation

Stage 142 documents the current state and centralises existing style values.
Renderer values were migrated to tokens only where that was safe and intended
to preserve the current appearance. This stage does not intentionally redesign
the map, expose new Real London data, alter beta gating, or change any route
engine, scoring, snapping, legality, OSM conversion, fixture, persistence, auth,
analytics, production, or Marlowe/default behavior.
