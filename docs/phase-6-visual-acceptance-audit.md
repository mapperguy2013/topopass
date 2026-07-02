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

## Remaining Visual Issues

| Issue | Severity | Phase | Notes |
| --- | --- | --- | --- |
| Some side-street labels still compete with checkpoint and review callout space at high zoom in dense areas. | Minor | Future polish | Current collision rules protect learner overlays first, which is the right Phase 6 tradeoff. A later pass could tune local-road label repetition. |
| Station markers and generic landmark markers can feel similar when labels are hidden by collision filtering. | Minor | Future polish | Data-backed station labels help, but a later marker-shape pass could strengthen distinction without changing routing. |
| Medium-zoom restriction markers are intentionally quiet and may need manual zoom for review detail in dense junctions. | Minor | Phase 6 accepted | Review-critical restriction markers remain visible; base restriction clutter is reduced by design. |
| Some bridge and water-crossing names depend on available committed fixture tags. | Future polish | Deferred | No OSM conversion or fixture invention was done in Phase 6. |
| Accepted alternative, route completed, and some hint/callout states are represented in QA fixtures and tokens, but appear only when existing review or fixture data supplies them. | Future polish | Deferred | This is expected until route-review data grows in a later phase. |
| Mobile map space is improved, but opening the full legend on very small screens can temporarily cover the lower-left map area. | Minor | Phase 6 accepted | The legend is collapsed by default and avoids primary drawing controls. |

## Acceptance Decision

No blocking visual issues remain for the Phase 6 Real London styling pass. The
map is coherent enough for the current beta learner experience, with known
limitations driven by fixture data coverage and future route-review data depth.

Future work should stay separate from Phase 6 unless it is strictly visual QA:
new route analysis, alternative-route acceptance, new scoring rules, additional
exercise generation, live OSM fetching, or broader product flow belongs to a
later phase.
