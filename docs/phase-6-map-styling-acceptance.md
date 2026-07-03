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
- Street-atlas inspiration means general cartographic principles only:
  hierarchy, cased roads, calm land/context colours, readable labels, and
  restrained decluttering. It does not permit copying A-Z, Google, OS, or any
  other proprietary tiles, screenshots, palettes, icons, fonts, label
  placement, or artwork.
- The TOPOPASS identity should remain visible through the central token
  palette: learner overlays use the established route/review colours, while
  the base map stays quieter and printed-atlas-like.

## Stage 160 TOPOPASS Street-Atlas Design Principles

Stage 160 extends Phase 6 after the original Stage 159 gate. It is a visual
refinement pass only and does not approve Phase 7 work.

The intended identity is an original TOPOPASS London learner map: calm paper
land, warm cased primary/secondary roads, quieter local and service streets,
soft park and water washes, restrained rail/bridge context, legible label
halos, and learner overlays that remain unmistakably above the base map. The
work is inspired by general street-atlas cartography, not by copying any
commercial or proprietary map design.

Road hierarchy rules:

- Primary/A-road style roads are widest and warmest, with clear casing and
  labels available at lower zooms.
- Secondary roads remain obvious but are less saturated and slightly narrower.
- Tertiary and local streets provide navigable texture without competing with
  learner overlays.
- Service, pedestrian, inactive, and restricted roads are thinner, quieter, and
  harder to label until higher zooms.
- Junctions preserve rounded cased strokes and endpoint blends so dense graph
  geometry reads as connected streets.

Label rules:

- Major-road labels receive the strongest halo, longest repeat distance, and
  lowest zoom threshold.
- Secondary and local labels progressively require longer on-screen segments
  and more zoom before rendering.
- Service labels are deliberately sparse.
- Area, park, water, bridge, station, landmark, and public-building labels stay
  below learner overlays and use collision filtering against route, marker,
  hint, and review reservations.

Layer and overlay rules:

- Land, parks, water, rail, bridges, landmarks, and area names stay below road
  hierarchy and labels.
- One-way and restriction cartography remains zoom-aware and subordinate to
  route-review warnings.
- Correct route, attempted route, accepted alternative, illegal sections,
  checkpoints, hints, review callouts, selected focus, legend, and attribution
  stay above the base map in the documented Phase 6 layer order.
- Mobile readability keeps 44 px touch targets, map-first scenarios, and
  pinch/pan/draw separation from Stage 158.5.

Stage 160 visual QA fixtures are documented through the deterministic
`STAGE_160_TOPOPASS_ATLAS_IDENTITY_FIXTURES` catalogue. It covers dense central
streets, major roads with side streets, high streets, suburban estates, park
edges, a Thames-bridge-style crossing proxy using fixture-backed water/bridge
data, rail/station-heavy context, awkward junctions, one-way systems, learner
review mistakes, and mobile viewports.

Final Stage 160 visual acceptance checklist:

- [ ] The base map feels calm, professional, London street-atlas-inspired, and
      recognisably TOPOPASS.
- [ ] Road hierarchy is readable at overview, learner, and detail zoom tiers.
- [ ] Labels are useful and decluttered rather than dense decoration.
- [ ] Parks, water, rail, stations, bridges, landmarks, and area names orient
      learners without competing with route decisions.
- [ ] Learner route, review, hint, checkpoint, warning, and selected-focus
      overlays remain visually dominant and mobile-usable.
- [ ] No proprietary cartographic assets, colours, fonts, icons, screenshots,
      label placement, or copied map artwork are used.
- [ ] No routing, legality, scoring, exercise generation, beta gate, feedback,
      OSM conversion, auth, subscription, product-flow, or Phase 7 behaviour
      changes are included.

## Stage 160.5 Curated OSM Data Enrichment

Stage 160.5 improves the fixture data available for Phase 6 Real London visual
QA. It adds a bounded, deterministic enrichment script that reads the existing
local OSM-derived GeoJSON cache and writes
`curatedLondonStage1605Overpass.json` as an Overpass-like fixture with
provenance, OSM attribution, a tag whitelist, import timestamp metadata, and
small named London fixture zones. The app still does not fetch Overpass data at
runtime.

Learner benefit: the renderer now has a richer committed fixture for checking
street-atlas readability, including real road names and hierarchy, one-way
tags, access tags, bridges, tunnels, rail, stations, parks, water, landmarks,
and area-label candidates where the local OSM cache provides them. This makes
Phase 6 cartography easier to inspect without inventing landmarks,
restrictions, or proprietary map content.

The curated fixture normalises coverage into renderer-facing categories:
`majorRoad`, `secondaryRoad`, `localRoad`, `serviceRoad`, `nonDrivingPath`,
`bridgeRoad`, `tunnelRoad`, `oneWaySegment`, `restrictedTurn`, `park`, `water`,
`rail`, `station`, `landmark`, `areaLabel`, and `learnerOverlay`. Styling stays
in TOPOPASS cartography tokens rather than in the raw import data.

Known limitations: the current local cache does not produce turn-restriction
relations, crossings, or traffic-signal nodes in the Stage 160.5 fixture, and
the defined Thames bridge zone requires a wider future OSM source because the
current cache is central/north-central London only. OSM access, speed, lane,
landmark, and public-building tags remain dependent on source data quality.

Stage 160.5 also ingests four manually exported curated Overpass JSON fixtures
for visual QA: Piccadilly Circus, Waterloo Bridge, a one-way system area, and
quiet residential roads. They are registered as dev-only selectable maps and
fixed visual comparison scenarios, with OSM attribution retained. The fixtures
increase real London coverage for dense streets, Thames/bridge context,
rail/stations, parks/water, one-way tags, and turn-restriction relation data,
but they remain small bounded extracts rather than full London coverage.
Production practice still does not call Overpass at runtime.

## Stage 161 Curated Fixture Visual Refinement

Stage 161 tunes the TOPOPASS canvas cartography against the four curated
manual Overpass fixtures. The pass keeps the design original while taking only
general inspiration from printed London street-atlas readability: clear cased
roads, restrained land/context washes, useful labels, and strong route-overlay
priority. It does not copy A-Z, Google, Apple, Ordnance Survey, or any other
proprietary tiles, screenshots, colours, icons, typography, label placement, or
cartographic artwork.

Changes:

- Major and secondary roads use calmer original TOPOPASS atlas tones with
  clearer casing hierarchy.
- Residential roads remain readable at learner zoom, while service,
  pedestrian, inactive, and restricted roads are quieter.
- Base map node dots are disabled in the normal atlas view so converted London
  fixtures read as streets rather than a graph. Matched-route nodes and the
  explicit OSM debug overlay still have their own marker rendering.
- Converted OSM road labels now judge fit using the deterministic total length
  of the named OSM road group instead of a single split graph segment. This
  makes real London street names visible in Piccadilly, Waterloo, the one-way
  fixture, and the quiet residential fixture without changing route geometry.
- Waterloo Bridge visual QA now explicitly checks Thames water context,
  Waterloo Bridge and Blackfriars Bridge bridge context, and the key road
  labels Victoria Embankment, Strand, Stamford Street, Upper Thames Street, and
  Southwark Street.
- Station, bridge, water, park, public-building, landmark, and area labels
  enter at slightly more useful learner zooms while overview zoom remains
  decluttered.
- Rail and restriction overlays are quieter so attempted routes, correct
  routes, checkpoints, hints, and review warnings remain dominant.

Known limitations: labels are still point/segment based rather than curved
along-road labels, and fixture context remains limited to the OSM tags present
in the committed extracts.

## Stage 161.4 Curated Fixture Submit Matching

Stage 161.4 fixes a Phase 6 blocker where the curated fixtures could preflight
and display legal routes but a correct drawn submit could stop at
`matching_failed`. This was caused by converted OSM split-way geometry: normal
trace simplification could remove tiny junction points, and start/destination
junction snapping could choose an adjacent segment rather than the required
marker node.

The fix is deliberately narrow:

- Converted OSM maps retry submit matching with the unsimplified raw trace when
  simplified matching cannot produce a ready route.
- Start/destination endpoint anchoring is repaired only when the drawn endpoint
  is within normal snap tolerance of the required marker and a legal connector
  exists in the same converted graph.
- Existing scoring, legality, one-way, no-entry, closed-road, and
  prohibited-turn behavior remains authoritative.
- Dev/test diagnostics distinguish OSM simplification retry and endpoint anchor
  repair, while learner-facing copy says to draw closer to the roads when a
  match cannot be made.

Tests cover generated legal submits for the existing Real London pilot,
Piccadilly Circus, Waterloo Bridge, one-way system, and quiet residential
fixtures; a wobbled Waterloo submit; and a wrong-way one-way submit that still
fails.

Stage 161.4.1 fixes the Cricklewood quiet-residential submit regression where a
real sparse manual trace from `osm-node-5222445789` through
`osm-node-13120968904` to `osm-node-623044867` could still stop at
`matching_failed`. For converted OSM maps only, the matcher can now recover
from selected road candidates that skip tiny split-way or unnamed connector
fragments by filling the gap with a legal connector from the same graph, bounded
by the drawn segment corridor. The supplied Cricklewood/Finchley road IDs are
kept under regression coverage for fixture presence; scoring still uses the
continuous legal graph route and the existing legality engine remains
authoritative.

## Stage 161.5 Waterloo / Thames Correction

Stage 161.5 applies a targeted correction from the Waterloo Bridge /
Blackfriars / Thames corridor screenshots:

- Thames rendering uses existing OSM-derived water data only. Closed water
  features render as stronger filled areas, while `waterway=*` lines use a
  wider calm blue corridor where polygon coverage is thin.
- Bridge roads remain above water; Waterloo Bridge and Blackfriars Bridge keep
  their road and bridge context labels.
- Major base roads are calmer and slightly narrower so they remain clear
  atlas hierarchy rather than reading like learner route overlays.
- Local and residential streets keep stronger low/medium-zoom visibility so
  Waterloo side-street texture remains useful.
- Rail lines and station context are quieter, and repeated context labels are
  deduplicated by kind/text before collision filtering. Thameslink should not
  repeat across every split rail segment.
- Destination marker radius/halo is tightened so the finish point remains
  visually attached to the destination road and route.

## Stage 161.6 Beta Map Selection And Drawing UX

Stage 161.6 makes the learner-facing Real London beta practice screen easier
to use while keeping route matching, scoring, legality, exercise generation,
OSM conversion, feedback tooling, and Phase 7 scope unchanged.

Beta testers can now choose from the Real London pilot and the curated
Piccadilly Circus, Waterloo Bridge / Thames corridor, one-way system, and quiet
residential fixtures. Fixture metadata controls use:

- `routableExercise` maps are available for scored practice.
- `routeReviewFixture` maps are labelled as review fixtures.
- `visualQaOnly` maps are labelled as map-inspection fixtures and are not
  offered as scored exercises.

Changing the selected map resets the current drawing, previous result, matching
messages, viewport state, and debug overlays so stale attempt state does not
carry into another fixture. The student beta controls now use the learner
wording `Erase route`; it clears the drawn polyline and current feedback while
keeping the selected map and exercise.

Desktop map sizing is now viewport bounded. The student beta map uses a
dynamic height capped by the visible viewport so map controls, legend,
attribution, submit, erase, and selector controls remain reachable without the
map forcing unnecessary vertical scrolling. Mobile and tablet touch behaviour,
including draw, pan, zoom, and pinch zoom, remains covered by the existing
Stage 156 and Stage 158.5 layout/interaction checks.

Stage 161.6.1 corrects the desktop sizing balance from the first pass. The
Real London practice map should fill the available desktop practice panel
using a wider beta canvas and width-first responsive sizing, while still
limiting its effective width from the available viewport height. The intent is
to remove unused right-side whitespace on desktop without letting the map push
submit, erase, selector, legend, attribution, or review controls below an
unusable viewport.

Stage 161.6.2 keeps that wider desktop layout but increases the beta map canvas
height by 20% to `1920 x 912`. The canvas backing size, route-runner viewport,
pointer mapping, wheel zoom focus point, and CSS aspect ratio must all use the
same dimensions so the map refits naturally instead of stretching horizontally
or vertically. Converted OSM viewport bounds continue to be expanded to match
the display aspect ratio, preserving equal X/Y map scale and keeping drawing,
pan, zoom, pinch zoom, marker hit areas, and submit matching aligned after
resize.

Stage 161.6.3 fixes the Real London beta selector hydration rule: the server
render and first client render must choose the same deterministic map,
exercise, and heading. The beta practice page now accepts stable `?map=` and
`?exercise=` URLs, while the client selector resolves within the Real London
beta catalogue rather than falling back through the synthetic Marlowe default.
Changing the map or exercise updates the visible route immediately and clears
stale drawing, score, matching, viewport, and debug state.

The four imported curated Overpass fixtures now each expose three generated
scoreable beta route exercises when their graph supports it. Catalogue tests
validate every scored curated exercise before it is offered: the fixture map
exists, required stop nodes exist, a legal route exists through the stops, the
expected route can be generated, a synthetic perfect drawn attempt matches, and
scoring is reached. `visualQaOnly` fixtures remain map-inspection only, and
`routeReviewFixture` fixtures stay labelled for review workflows rather than
normal scored practice.

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

## Stage 148 Context Rendering Evidence

Stage 148 addresses the parks/water/rail/stations/bridges/landmarks/context
part of this checklist through visual-only renderer changes. Rail corridors,
subway-tagged rail corridors, bridge/crossing indicators, station markers,
landmark markers, and bridge labels are generated only from existing map
landmarks or the selected map option's committed raw Overpass fixture. Missing
fixture data, unsupported tags, and unknown fields are safe no-ops.

The Stage 148 renderer keeps context below learner overlays by drawing context
lines before roads, filtering station/landmark markers against learner overlay
reservation boxes, fading or suppressing rail and bridge/crossing context by
viewport scale, and leaving route, review, restriction, start, checkpoint,
destination, hint, and replay layers above the base map. Underground-specific
styling is intentionally not claimed: `railway=subway` can render as rail
context when present, but no separate Underground distinction is invented.

## Stage 149 Orientation And Overlay Evidence

Stage 149 addresses the landmarks/area names/learner overlay readability part
of this checklist through visual-only renderer changes. Named OSM nodes and
closed ways from the selected committed raw Overpass fixture can now produce
area labels, public-building markers, open-space markers, important landmark
markers, learner-reference markers, and station markers when their existing
tags match the supported cartographic categories. Unsupported tags, unnamed
features, and missing fixture data remain safe no-ops.

The Stage 149 renderer keeps orientation context subordinate to learner tasks by
using central context-label priorities, zoom thresholds, collision boxes, route
issue reservations, and exercise-marker reservations before drawing context
labels or markers. Route-review issue markers keep their own tokenised halo,
radius, stroke, and reservation padding so missed/illegal review cues stay
readable above the base map without changing routing, scoring, legality,
exercise generation, beta gating, feedback, or route attempts.

## Stage 150 Restriction Cartography Evidence

Stage 150 addresses the one-way/restriction readability part of this checklist
through visual-only renderer changes. One-way arrows now use tokenised
decision-point placement ratios, zoom-tier spacing, halo styling, and collision
padding so useful arrows remain readable without repeating densely on the same
rendered road group. Medium zoom applies wider one-way spacing than high zoom,
and low zoom still suppresses base restriction symbols.

Base no-entry, one-way, restricted-road, and turn-restriction markers now pass
through a deterministic collision filter that avoids learner route, hint,
review issue, start, checkpoint, and destination reservation boxes. Route-review
restriction warnings are preserved across zoom tiers and are not removed by
base-symbol collision filtering. The legend text now uses learner-friendly
labels for one-way streets, restricted turns, no-entry/blocked movements, and
review warnings. The renderer still uses only existing restriction overlays,
turn visuals, and route-review data; missing data remains a safe no-op.

## Stage 149.5/150.5 Context Data Audit And Adapter Evidence

Stage 149.5/150.5 addresses the Real London context-data coverage part of this
checklist without changing routing, legality, scoring, exercise generation,
OSM conversion behaviour, beta gates, feedback, or route attempts. The new
audit helper reads committed fixture/source data only and reports deterministic
counts for rail, subway rail, stations, named stations, bridges, named bridges,
crossings, landmark-like features, park/open-space features, water, named
water, and area/context label candidates.

The new internal adapter normalises supported OSM fixture elements into typed
render-ready context features for the existing synthetic street-map renderer.
It covers the audited context categories plus the pre-existing visual-only
pedestrian-area background category. It is a safe no-op when a map has no OSM
projection, when fixture data is missing or malformed, or when required node
geometry is unavailable. Tests cover deterministic counts, malformed input,
stable adapter ordering, missing projection behaviour, and the rule that no
context feature is invented when fixture/source data is absent.

Known limitation: the earlier committed Real London pilot Overpass fixtures
(`tinyLondonOverpass.json`, `realLondonPilotOverpass.json`,
`realLondonPilotTwoOverpass.json`, `mediumLondonOverpass.json`, and
`largeLondonOverpass.json`) audit to zero for the audited non-road context
categories. The learner benefit today is a clearer, testable pipeline and
baseline for fixture-backed context rendering; visible new context still
depends on selected fixture data containing those OSM tags. The later Stage
160.5 curated manual exports add richer dev-only context fixtures for visual
QA.

## Stage 151 Visual QA And Learner Readability Checklist

Stage 151 validates the combined Phase 6 styling through a dev-only synthetic
visual QA scenario and central objective-overlay token changes. It remains
visual/readability work only: route logic, legality checks, scoring, exercise
generation logic, beta gates, feedback tooling, and OSM conversion behaviour
are unchanged.

Use the Phase 6 visual QA scenario in the dev route-runner to judge whether:

- [ ] Roads are distinguishable by hierarchy in a dense London-like street grid.
- [ ] Street labels are readable at normal learner zoom levels.
- [ ] Labels do not overwhelm dense streets or learner objectives.
- [ ] Parks, water, rail, and station context help orientation.
- [ ] Landmarks and area names make the map feel grounded where fixture data
      exists.
- [ ] Route overlays remain clear above the base map.
- [ ] Start, destination, first required via point, checkpoints, and optional
      hints are immediately identifiable.
- [ ] Selected road and selected/matched node styling is visible but not
      confused with required stops.
- [ ] Restrictions and one-way arrows are useful but do not overpower learner
      objectives.
- [ ] Route-review warnings remain visible through decluttering.
- [ ] Low zoom suppresses non-essential detail.
- [ ] Normal learner zoom feels materially clearer than the Phase 6 baseline.
- [ ] The combined Phase 6 styling feels coherent rather than disconnected
      across roads, labels, context, restrictions, and learner overlays.

The visual QA scenario is explicitly synthetic test fixture data, not a real
OSM export. It exists to make parks, water, rail, stations, landmarks,
one-way arrows, a turn restriction, route stops, and objective overlays visible
in one place while committed real pilot fixtures still have limited non-road
context coverage.

## Stage 152 Visual Comparison Fixtures

Stage 152 adds deterministic comparison fixtures around the Stage 151 dev-only
visual QA map. The fixtures define four QA modes:

- `plain-route-graph`
- `phase-6-street-atlas`
- `learner-route-overlay`
- `route-review-readability`

The fixed readability scenarios are:

- `dense-central-readability`
- `major-road-side-street-hierarchy`
- `park-water-rail-station-context`
- `bridge-crossing-context`
- `landmark-area-orientation`
- `learner-route-overlay-review`
- `one-way-restriction-declutter`

Open the dev route-runner and select `Phase 6 visual QA scenario` to inspect the
underlying map. The scenario definitions live in
`app/dev/route-runner/realLondonVisualComparisonScenarios.ts` and document the
intended fixed viewport, comparison modes, and expected categories for each
inspection case. The automated checks verify configuration and rendered category
coverage rather than pixel-perfect screenshots.

Learner benefit: developers can now compare the same London-like fixture as a
plain graph, a Phase 6 street-atlas map, a learner route overlay, and a review
state with warnings. This makes it easier to see whether the map reads as a
usable learner street atlas rather than backend route geometry.

Known limitations: these scenarios are synthetic QA fixtures, not real OSM
exports. They do not add missing landmarks or restrictions to committed real
pilot fixtures, and restriction/context visibility still depends on available
fixture data.

## Stage 152.5 Route Review Styling

Stage 152.5 improves visual route-review cartography without changing routing,
legality, scoring, exercise generation, beta gates, feedback tooling, or OSM
conversion behaviour.

Route-review styling meanings:

- Attempted route: orange learner line with a pale casing. This is the route the
  learner drew or submitted.
- Correct route: blue dashed reference line with a quiet casing. This answers
  what the learner should have done when a fastest/correct route is available.
- Accepted alternative route: teal dotted line in visual QA fixture support.
  This communicates also valid without adding route-engine alternative logic.
- Illegal segment: prominent red cased section, drawn above the attempted route
  and restriction cartography so the offending movement is immediately visible.
- Inefficient section: amber dashed warning style for non-blocking review
  warnings where existing review data or QA fixture data exposes one.
- Backtrack section: purple dashed warning style, quieter than illegal movement
  styling.
- Completed checkpoint: checkpoint marker keeps its normal objective style and
  gains a green review ring/check.
- Missed checkpoint: checkpoint marker gains a stronger red dashed review ring
  and cross treatment.

The Stage 152 visual QA scenarios `learner-route-overlay-review` and
`one-way-restriction-declutter` now include expected route-review overlay
categories for attempted route, correct route, accepted alternative fixture
support, illegal segment, inefficient section, and backtrack section.

Known limitations: accepted alternatives, inefficient sections, and backtrack
sections are styling/fixture categories only unless existing review data supplies
those classifications. This stage does not invent alternative-route acceptance
or new route-analysis behaviour.

## Stage 153 Learner Marker, Hint, And Callout Styling

Stage 153 centralises learner overlay styling for start, destination,
checkpoints, hints, warnings, review callouts, and draw order. The canvas
renderer uses those tokens for objective markers, hint preview paths, hint
points, missed/completed checkpoint rings, and compact review-critical
restriction callouts.

Learner overlay meanings:

- Start and destination markers: larger green and red objective anchors with
  quiet halos so the route endpoints remain visible above roads and labels.
- Required checkpoint and checkpoint markers: orange objective markers, with the
  first required via/checkpoint visually stronger than ordinary checkpoints.
- Checkpoint states: upcoming, active, completed, missed, focused, and reached
  states have distinct central tokens for rings, dashes, and check/cross symbols.
- Hint available/revealed states: hint paths are quieter than route review
  warnings, while revealed hints and snapped points remain readable above the
  base map.
- Next-road suggestion: teal dashed styling that is intentionally distinct from
  the correct-route blue reference line.
- Review warnings/callouts: wrong turn, restricted manoeuvre, illegal segment,
  inefficient, backtrack, missed checkpoint, accepted alternative, checkpoint
  reached, and route completed states have compact callout tokens and severity
  ordering.

The Stage 152 visual QA scenarios now list expected learner overlay states for
`learner-route-overlay-review`, `bridge-crossing-context`, and
`one-way-restriction-declutter`. These checks verify configuration and expected
state coverage rather than pixel-perfect screenshots.

Known limitations: Stage 153 does not add new route analysis, accepted
alternative logic, checkpoint logic, hints, restrictions, landmarks, or OSM
conversion behaviour. Review callouts only reflect existing review/restriction
items exposed to the renderer.

## Stage 154 Final Readability Integration And Practice Layout

Stage 154 completes the Phase 6 visual-readability pass by checking the full
Real London map stack as one TOPOPASS system. The final stack is documented in
the visual comparison fixture metadata as:

1. land/background
2. water
3. parks/open spaces
4. rail
5. bridges/crossings
6. stations
7. landmarks
8. area names
9. road casings
10. road fills
11. road hierarchy
12. street labels
13. one-way arrows
14. restriction symbols
15. correct/reference routes
16. accepted alternative routes where fixture/review data represents them
17. attempted route
18. illegal/warning overlays
19. start/destination markers
20. checkpoints
21. hints
22. review callouts
23. selected/focused learner overlays

Stage 154 consolidates selected/focused review highlighting onto the central
learner overlay tokens, keeps route-review warnings above route lines, and adds
`complete-phase-6-stack-integration` to the deterministic visual QA scenario
set. Existing low/learner/detail decluttering metadata remains the visibility
contract for labels, context features, restrictions, and learner overlays.

Stage 154.5 makes the Real London practice layout more map-first without
changing product flow: beta base restriction overlays are quiet by default,
route-review issue symbols remain available after attempts, map controls use
more compact labels, the beta map receives a taller preferred workspace, and
practice-screen metadata records the map-first layout intent.

Known limitations: QA scenarios are synthetic, deterministic inspection
fixtures. Real pilot maps still depend on the committed OSM fixture data for
landmarks, bridge names, restrictions, context features, and hint/review states.
This pass does not add route-engine alternative handling, new scoring, new
legality checks, exercise generation, beta gates, feedback tooling, live OSM
fetching, or Phase 7 product-flow work.

## Stage 155 Visual Acceptance Audit, Legend, And Attribution

Stage 155 records the final Phase 6 visual acceptance audit in
`docs/phase-6-visual-acceptance-audit.md`. The audit reviews dense central
streets, major/side-street hierarchy, junction-heavy restriction areas,
park/water/rail/station context, bridges, landmarks, area names, learner
markers, route review overlays, low/medium/high decluttering, and mobile-relevant
layout concerns.

Stage 155 also adds a compact learner-facing map legend inside the route map
frame. It explains major roads, secondary roads, local streets, one-way arrows,
restriction markers, start, destination, checkpoints, attempted route, correct
route, accepted alternative route, illegal segment, missed checkpoint highlight,
parks, water, rail, and stations. The legend uses the existing route-runner
legend item model and central TOPOPASS tone classes rather than a separate modal
or route-engine data.

OSM attribution remains visible in the beta page and is also shown inside the
map frame when an OSM-derived map option provides attribution. The attribution
is intentionally small, legible, and separate from drawing controls.

Known remaining visual issues are non-blocking: side-street labels can still
compete with callouts at high zoom, station and landmark markers could be more
distinct in a later polish pass, and some context/review states depend on
available committed fixture data. No route logic, legality, scoring, exercise
generation, beta gate, feedback tooling, OSM conversion, or Phase 7 product-flow
work is included.

## Stage 156 Mobile And Tablet Readability

Stage 156 makes the Real London learner map more practical on phones and
tablets without changing routing, legality, scoring, exercise generation, beta
gates, feedback tooling, accepted route rules, checkpoint validation, or OSM
conversion.

The route map now uses central TOPOPASS mobile readability tokens for 44 px
touch targets, marker/review issue hit-area reservations, callout height,
compact control height, map minimum heights, and legend height. Touch and pen
route drawing explicitly suppress native page gestures while the canvas has
control, the in-map draw/pan/undo/clear/reset/zoom controls have larger tap
areas, and the collapsed legend is constrained on narrow screens so it does not
dominate the lower-left map area.

Stage 156 also adds deterministic responsive visual QA fixture metadata:

- `small-mobile-portrait`
- `large-mobile-portrait`
- `mobile-landscape`
- `tablet-portrait`
- `tablet-landscape`
- `narrow-embedded-map`

The responsive scenarios cover dense central readability, route drawing, route
review, one-way/restriction decluttering, marker/hint collision, tablet learner
overlays, tablet review panels, and tablet context orientation. These fixtures
are configuration checks rather than pixel-perfect screenshots.

Known limitations: this pass improves canvas readability and responsive QA
fixtures, but it does not add a new map provider, live device lab automation, or
new OSM data. Some restrictions, landmarks, bridges, stations, and labels still
depend on the committed OSM fixture data available to the selected map.

## Stage 157 Rendering Performance Budget

Stage 157 keeps the richer Phase 6 Real London map smooth without changing the
visual design, routing, legality, scoring, exercise generation, beta gates,
feedback tooling, accepted-route rules, checkpoint validation, or OSM
conversion.

The route-runner now memoizes static base-map visual candidates before each
canvas draw: road visuals, context backgrounds/lines, landmark markers, map
labels, and stop labels are derived only when the map, selected exercise,
fixture context, or source inputs change. Per-frame work still performs viewport
filtering, collision checks, and drawing so pan/zoom decluttering remains
accurate.

Label collision filtering now reuses cached approximate text widths and font
sizes, and road label visibility skips width work when the current zoom tier or
road-screen length already hides the label. Restriction visual generation can be
keyed by zoom tier instead of the full viewport, so panning within the same tier
does not rebuild one-way/restriction item candidates.

Intentionally uncached: viewport-specific collision boxes, reserved learner
overlay boxes, current route drawing, route-review overlays, and selected focus
state. Those depend on the live viewport or learner attempt and must stay
fresh.

Manual performance review: open Real London practice or the dev route-runner,
select a dense Phase 6 visual QA scenario, then pan, zoom, draw a route, submit
for review, and toggle restriction/legend states. The expected result is stable
Phase 6 visual output with smoother redraws and no loss of labels, hierarchy,
context layers, restrictions, markers, hints, or review callouts.

## Stage 158 Final Visual Regression Gate

Stage 158 records the Phase 6 final visual regression and release-candidate
gate. It remains a visual QA and readability pass only: route logic, legality
checks, scoring, exercise generation, beta gates, feedback tooling, OSM
conversion behaviour, and route-engine behaviour are unchanged.

The visual comparison fixture metadata now includes additional deterministic
Real London readability contexts:

- `dense-central-low-zoom-overview`
- `high-street-side-street-readability`
- `estate-residential-blocks`
- `park-open-space-edge`
- `bridge-river-crossing-review`
- `awkward-junction-restriction-review`
- `rail-station-interchange-context`
- `landmark-area-high-zoom`

Together with the existing Stage 152 and Stage 156 scenarios, the release gate
covers dense central streets, major-road/side-street hierarchy, bridges and
river crossings, parks and open spaces, estate/residential blocks, high
streets, awkward junctions, rail/station context, landmark/area-name context,
learner route-review overlays, and phone/tablet readability.

Gate checks are configuration and readability checks rather than pixel-perfect
screenshots. They verify the fixed scenarios, low/medium/high decluttering
tiers, final Phase 6 layer order, responsive viewport coverage, and the
explicit list of behaviours this gate must not change.

Known limitations: Stage 158 does not add live OSM fetching, new map data, a
new map provider, screenshot automation, or invented restrictions/landmarks.
Bridge, station, landmark, restriction, and area-name visibility still depends
on the committed fixture data available to the selected map. After the required
validation commands pass, Phase 6 is ready for final learner-facing visual
review.

## Stage 158.5 Mobile Pinch-Zoom Interaction

Stage 158.5 fixes a mobile Phase 6 usability blocker: the Real London canvas
map now recognises two-finger pinch gestures as map zoom instead of accidental
route drawing. The fix uses the existing route-runner viewport zoom/pan limits,
so labels, decluttering tiers, learner overlays, markers, hints, and review
callouts stay aligned after pinch zoom. It does not change route logic,
legality checks, scoring, exercise generation, beta gates, feedback tooling,
OSM conversion behaviour, or map visual styling.

Manual mobile QA checklist:

- Open the Real London practice map on a mobile phone.
- Pinch out on the map to zoom in.
- Pinch in on the map to zoom out.
- Pan the map after zooming.
- Draw or attempt a learner route with one finger.
- Confirm a two-finger pinch does not draw a route or leave stray route points.
- Confirm start, destination, and checkpoint markers remain aligned.
- Confirm street labels and zoom-based decluttering update after zooming.
- Confirm map controls, panels, legend, and attribution do not block the main
  gesture area.

Known limitation: automated browser-level pinch simulation is not part of the
current test stack. Stage 158.5 adds focused unit coverage for two-pointer
pinch recognition, zoom clamping, and overlay alignment, with the checklist
above retained for real-device QA.

## Stage 159 Phase 6 Completion Gate

Stage 159 is the final Phase 6 readiness gate, not a feature stage. The review
confirms that the Real London practice map now reads as a learner street atlas
across the documented visual QA scenarios: dense central streets, high streets
and side streets, parks and water, bridges and river crossings, rail and
stations, landmarks and area names, one-way/restriction-heavy junctions,
learner route overlays, route review callouts, and mobile/tablet viewports.

The gate checks the final draw order against
`FINAL_PHASE_6_REAL_LONDON_LAYER_STACK`, including base context, road hierarchy,
labels, one-way/restriction symbols, learner overlays, markers, hints, review
warnings, selected focus, legend, and attribution. It also confirms that
styling remains driven by central TOPOPASS cartography tokens and that the
Phase 6 visual comparison and release-candidate fixtures are wired for future
readability checks.

Known limitations remain accepted for Phase 6: context labels, bridges,
landmarks, stations, area names, and restriction symbols depend on available
committed fixture/OSM-derived data; restrictions and landmarks are not
invented; visual regression coverage is scenario/configuration based rather
than pixel-perfect screenshot automation; and deeper route analysis, scoring,
exercise-generation, product-flow, and Phase 7 work stay deferred.

Stage 159 does not change route logic, legality checks, scoring, exercise
generation, beta gates, feedback tooling, OSM conversion behaviour, auth,
subscriptions, or product flow. After `npm.cmd run lint`,
`npm.cmd run test:map`, `npm.cmd run build`, and `git diff --check` pass, Phase
6 is complete and ready to close.

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
