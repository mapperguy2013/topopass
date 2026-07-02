# Phase 6 Map Styling Acceptance Checklist

Stage 141 defines the Phase 6 baseline for Real London learner map styling and
readability. It is an acceptance contract for future visual work, not a visual
implementation stage.

Phase 6 map styling should make the Real London beta maps easier to read for
learners while preserving the existing route engine, legality model, scoring
model, fixtures, beta gates, persistence, auth, analytics, production exposure,
and Marlowe/default map behavior.

Future Phase 6 stages should use this checklist before and after making visual
changes. Each stage should identify which criteria it affects, record evidence
from the relevant Real London views, and treat regressions against this
checklist as unfinished work. The checklist is outcome-based: it defines what
good must mean for learners, without prescribing a specific renderer or style
implementation.

## Visual Direction

- The Real London base map should move toward a classic London street-atlas
  inspired training style while remaining an original TopoPass visual design.
- The base map should improve orientation and route planning clarity without
  competing with active learner overlays.
- Styling decisions should be judged in student-facing Real London practice
  and, where relevant, dev QA/review states.

## Acceptance Checklist

### 1. Road Hierarchy

- [ ] Major roads, secondary roads, local streets, service roads, pedestrian
      paths, and restricted roads are visually distinct.
- [ ] Route-relevant roads remain easy to identify at the zoom levels used by
      Real London exercises.
- [ ] Non-active roads are de-emphasised enough to reduce noise without making
      the surrounding street network confusing.
- [ ] Restricted or non-drivable roads do not look like normal available route
      choices.
- [ ] One-way, no-entry, and restriction styling supports the existing legal
      movement model without implying behavior the route engine does not enforce.

### 2. Label Readability

- [ ] Street labels are readable against roads, parks, water, land, rail, and
      learner overlay backgrounds.
- [ ] Labels do not overwhelm the learner route, the selected route, or review
      overlays.
- [ ] Important route roads, junctions, landmarks, and area names are
      prioritised over less useful context labels.
- [ ] Label placement avoids avoidable overlaps with learner controls, route
      endpoints, checkpoints, warnings, and review feedback.
- [ ] Label styling remains readable on desktop and mobile density displays.

### 3. Zoom Decluttering

- [ ] Lower zooms show only essential structure: major roads, meaningful
      geography, major landmarks, water, rail, stations, and selected learner
      route context.
- [ ] Higher zooms reveal more local street detail, labels, one-way arrows,
      restrictions, landmarks, checkpoints, hints, and learner aids.
- [ ] Repeated symbols such as one-way arrows are suppressed or spaced when
      they become too dense.
- [ ] Zoom changes do not produce sudden clutter spikes that obscure the active
      exercise.
- [ ] Decluttering rules keep route-relevant information visible even when
      surrounding context is reduced.

### 4. Parks, Water, Rail, Stations, Bridges, Landmarks, and Area Names

- [ ] Parks and water are recognisable London orientation features without
      becoming visually dominant.
- [ ] Rail lines, stations, bridges, and landmarks improve orientation and do
      not read as active learner route overlays.
- [ ] Area names help learners understand London geography and the shape of the
      exercise area.
- [ ] Bridges and station areas are clear enough to support route-planning
      decisions where they affect learner interpretation.
- [ ] Context features stay visually below start, destination, checkpoints,
      selected routes, mistakes, hints, restrictions, and review feedback.

### 5. Learner Overlays

- [ ] Start, destination, checkpoints, hints, selected route, mistakes, legal
      restrictions, and review states are clearly distinguishable from one
      another.
- [ ] Learner overlays remain visually above the base map across all supported
      Real London map states.
- [ ] The base map does not compete with active learning information.
- [ ] Overlay meaning is consistent between practice, feedback, and review
      states.
- [ ] Overlay visibility holds on both light and dense street backgrounds.

### 6. Route Review Clarity

- [ ] Correct route, user route, missed sections, illegal sections, hints,
      checkpoints, and scoring/review feedback are readable together.
- [ ] The review state explains what happened without relying only on colour.
- [ ] Illegal movements and missed checkpoints are visually separable from
      efficiency, distance, and scoring feedback.
- [ ] Review overlays preserve enough base-map context for learners to
      understand where their route diverged.
- [ ] Route review remains understandable when routes overlap, cross, or follow
      parallel streets.

### 7. Mobile Map Usability

- [ ] Touch, pan, zoom, route drawing, and scrolling are usable on small
      screens.
- [ ] Controls do not cover important map content, route endpoints, restriction
      markers, or review feedback.
- [ ] The exercise panel and map have a practical layout for beta learners on
      narrow screens.
- [ ] Tap targets and controls remain usable while the map is dense.
- [ ] Mobile route drawing remains aligned with the rendered map after pan and
      zoom interactions.

### 8. Performance

- [ ] Styling changes do not noticeably degrade map interaction.
- [ ] Zooming, panning, rendering labels, and drawing learner overlays remain
      responsive.
- [ ] Large Real London fixtures remain stable under the same fixture-backed
      beta flow.
- [ ] Decluttering and label logic avoid expensive redraw behavior that harms
      normal practice use.
- [ ] Performance checks cover at least the current Real London pilot maps
      before a styling change is considered accepted.

### 9. Attribution

- [ ] OSM attribution remains visible whenever OSM-derived data is shown.
- [ ] Attribution is not hidden by learner overlays, review panels, feedback
      controls, or mobile layout changes.
- [ ] Attribution remains legible without drawing attention away from the
      active exercise.
- [ ] Any future Real London map styling still preserves required attribution
      for committed OSM-derived fixtures.

## Stage 141 Scope Note

Stage 141 does not change rendering, routing, scoring, legality, fixtures, beta
gating, persistence, auth, analytics, or production exposure. It does not change
map rendering code, route engine behavior, OSM conversion, tests, dependencies,
Marlowe/default map behavior, or Real London beta gating.

## Done When

Stage 141 is done when this acceptance checklist is documented and linked from
the project README, so future Phase 6 stages can be judged consistently against
the same baseline before any Real London map visual changes are made.

Future Phase 6 visual stages are done only when their changes satisfy every
affected checklist item, keep unaffected checklist areas from regressing, and
record the validation evidence used to make that judgement.
