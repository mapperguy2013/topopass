# Phase 6 Visual Acceptance Audit

Stage 155 audits the completed Phase 6 Real London learner-map styling as a
visual system. This is a readability and QA record only. It does not change
route logic, legality checks, scoring, exercise generation, beta gates, feedback
tooling, OSM conversion, or route-engine behaviour.

## Scenarios Reviewed

Use the dev route-runner visual comparison scenarios for future checks:

- `dense-central-readability`: dense central street grid, label density, and
  road hierarchy.
- `major-road-side-street-hierarchy`: primary/secondary/local hierarchy and
  side-street visibility.
- `park-water-rail-station-context`: park, water, rail, and station context.
- `bridge-crossing-context`: water crossing, bridge labels, and nearby review
  restrictions.
- `landmark-area-orientation`: landmark labels, public buildings, and area
  names.
- `learner-route-overlay-review`: start/destination/checkpoints, hints,
  attempted route, correct route, review markers, and callouts.
- `one-way-restriction-declutter`: one-way and restriction-heavy local streets
  at lower detail.
- `complete-phase-6-stack-integration`: final Phase 6 stack, including base
  context, hierarchy, labels, restrictions, learner overlays, warnings,
  callouts, and selected focus.

Use the Stage 158 release-candidate visual QA scenarios for final regression
checks:

- `dense-central-low-zoom-overview`: low-zoom central street density and area
  context without label/symbol clutter.
- `high-street-side-street-readability`: high-street hierarchy, side streets,
  and medium-zoom label clarity.
- `estate-residential-blocks`: residential blocks, pedestrian-area context, and
  local label readability.
- `park-open-space-edge`: park, water, canal/basin, and adjacent road context.
- `bridge-river-crossing-review`: bridge/water context with review restriction
  overlays.
- `awkward-junction-restriction-review`: one-way/restriction-heavy junction
  review overlays.
- `rail-station-interchange-context`: rail, station, park/water, and nearby
  street labels.
- `landmark-area-high-zoom`: landmark, public-building, area-name, and
  high-zoom street label collision checks.

Use the Stage 156 responsive visual QA scenarios for phone and tablet checks:

- `mobile-dense-central-readability`
- `mobile-route-drawing`
- `mobile-route-review`
- `mobile-one-way-restriction-declutter`
- `mobile-marker-hint-collision`
- `tablet-portrait-learner-overlays`
- `tablet-landscape-review-panels`
- `tablet-context-orientation`

These scenarios use deterministic viewports for small phone portrait, large
phone portrait, phone landscape, tablet portrait, tablet landscape, and a narrow
embedded map. They are configuration/readability fixtures, not pixel-perfect
screenshot assertions.

## What Works

- Major, secondary, and local roads now read as a hierarchy rather than a raw
  graph.
- Street labels and context labels are collision-filtered against learner
  markers and review overlays.
- Parks, water, rail, stations, bridge/crossing context, landmarks, and area
  names provide orientation where fixture data exists.
- One-way arrows and restriction markers are decluttered by zoom and preserve
  review-critical issue markers.
- Attempted routes, correct/reference routes, accepted alternative fixture
  routes, illegal segments, inefficient sections, and backtrack warnings use
  distinct central tokens.
- Start, destination, checkpoint, hint, missed/completed checkpoint, callout,
  and selected-focus states share the final learner overlay token family.
- Student beta practice keeps base restriction overlays quiet by default while
  preserving route-review issue visibility after submission.
- OSM attribution remains visible in the Real London practice screen and now
  appears inside the route map frame when OSM-derived data is selected.
- The compact learner legend explains road hierarchy, route overlays,
  restrictions, objective markers, parks, water, rail, and stations.
- Mobile and tablet readability now has explicit 44 px touch-target tokens,
  larger in-map control tap areas, mobile-constrained legend height,
  touch/pen-safe canvas gesture handling, and label reservations that account
  for finger-sized marker, hint, and review issue targets.
- Stage 157 preserves the same visual output while memoizing static base-map
  candidates, caching label width/font-size estimates, skipping hidden road
  label width work, and keying restriction candidate generation by zoom tier.
- Stage 158 adds a repeatable final visual regression gate covering additional
  Real London contexts, low/medium/high decluttering tiers, responsive
  phone/tablet coverage, and final overlay ordering without changing route or
  OSM behaviour.
- Stage 159 closes the Phase 6 readiness gate: the final review checks the
  documented visual QA scenarios, draw order, central cartography tokens,
  learner overlays, review callouts, mobile/tablet interaction notes, legend,
  attribution, and fixture-data limitations as one completed Phase 6 package.

## Remaining Visual Issues

| Issue | Severity | Phase | Notes |
| --- | --- | --- | --- |
| Some side-street labels still compete with checkpoint and review callout space at high zoom in dense areas. | Minor | Future polish | Current collision rules protect learner overlays first, which is the right Phase 6 tradeoff. A later pass could tune local-road label repetition. |
| Station markers and generic landmark markers can feel similar when labels are hidden by collision filtering. | Minor | Future polish | Data-backed station labels help, but a later marker-shape pass could strengthen distinction without changing routing. |
| Medium-zoom restriction markers are intentionally quiet and may need manual zoom for review detail in dense junctions. | Minor | Phase 6 accepted | Review-critical restriction markers remain visible; base restriction clutter is reduced by design. |
| Some bridge and water-crossing names depend on available committed fixture tags. | Future polish | Deferred | No OSM conversion or fixture invention was done in Phase 6. |
| Accepted alternative, route completed, and some hint/callout states are represented in QA fixtures and tokens, but appear only when existing review or fixture data supplies them. | Future polish | Deferred | This is expected until route-review data grows in a later phase. |
| Mobile map space is improved, but opening the full legend on very small screens can temporarily cover the lower-left map area. | Minor | Phase 6 accepted | Stage 156 constrains legend height and keeps it collapsed by default; learners can still open it when needed. |
| Stage 156 responsive QA is fixture/configuration based rather than device screenshot automation. | Future polish | Deferred | Tests verify scenario wiring, touch targets, and map layout metadata. Full device screenshot comparison belongs to a later QA investment. |
| Stage 157 does not add separate dirty canvas layers for static base and live overlays. | Future polish | Deferred | Candidate generation and label measurement are optimized first; a multi-canvas renderer would be a larger architecture change. |
| Stage 158 remains metadata/test based rather than pixel-perfect visual snapshot automation. | Future polish | Deferred | The release gate verifies scenario coverage, contexts, zoom tiers, and layer order. Screenshot baselines can be added later if the project adopts that infrastructure. |
| Stage 159 does not add new map data or visual features. | Accepted | Completion gate | This gate is a final readiness review. It confirms Phase 6 scope and records deferrals rather than starting Phase 7. |

## Stage 159 Completion Gate

The final Phase 6 readiness review confirms that the Real London map now has a
usable learner street-atlas presentation rather than the earlier graph-like
view. The completed package covers land, water, parks, road hierarchy,
junction clarity, labels, station and landmark context, area names,
one-way/restriction cartography, learner route overlays, review warnings,
callouts, mobile/tablet touch usability, visual comparison fixtures, and the
release-candidate QA scenarios listed above.

The reviewed layer order matches the exported
`FINAL_PHASE_6_REAL_LONDON_LAYER_STACK`: base land/context draws first, then
road casings/fills and hierarchy, labels and context, restriction and one-way
symbols, learner route overlays, markers, hints, review callouts, focused
states, compact legend, and attribution. Styling remains driven by central
TOPOPASS cartography tokens in the route-runner styling modules.

The Stage 159 gate did not change route logic, legality checks, scoring,
exercise generation, beta gates, feedback tooling, OSM conversion behaviour,
auth, subscriptions, or product flow. Known limitations remain intentionally
bounded to data and QA infrastructure: fixture-derived context appears only
where committed OSM/fixture data supplies it, restrictions and landmarks are
not invented, and visual regression checks are scenario/configuration based
rather than pixel-perfect screenshot automation.

## Acceptance Decision

No blocking visual issues remain for the Phase 6 Real London styling pass.
Stage 159 records Phase 6 as complete and ready to close after the required
lint, map test, build, and diff checks pass. Known limitations are driven by
fixture data coverage, non-pixel-perfect QA, and future route-review data
depth.

Future work should stay separate from Phase 6 unless it is strictly visual QA:
new route analysis, alternative-route acceptance, new scoring rules, additional
exercise generation, live OSM fetching, or broader product flow belongs to a
later phase.

## Stage 160 Extension Note

Phase 6 remains active after Stage 159. Stage 160 reopens the visual acceptance
gate for a TOPOPASS London street-atlas identity pass: calmer original base-map
tokens, sharper road hierarchy, quieter local/service streets, stronger label
readability rules, refined context colours, and explicit atlas-identity QA
fixtures.

This extension remains visual-only. It does not copy A-Z, Google, OS, or other
proprietary cartographic assets, and it does not change routing, legality,
scoring, exercise generation, beta gates, OSM conversion, feedback tooling,
auth, subscriptions, product flow, or Phase 7 scope.
