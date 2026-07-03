# Phase 6 Stage 160.6 Curated Fixture Routability Gate

Stage 160.6 adds a routability preflight for the curated Real London Overpass fixtures. The goal is to keep the richer Piccadilly Circus, Waterloo Bridge, one-way system, and quiet residential fixtures useful for visual QA while preventing clipped or disconnected OSM extracts from silently producing broken learner exercises.

## Fixture Modes

Curated fixtures now carry an explicit use mode:

- `visualQaOnly`: the fixture is suitable for map rendering, labels, context, and cartography inspection, but it should not be offered as a learner exercise.
- `routableExercise`: the fixture has a generated route whose required stops are on the same drivable component and have a confirmed legal path.
- `routeReviewFixture`: reserved for fixtures that are intentionally configured for review overlays or mistake explanations.

These modes are dev/test metadata. They do not change production route logic, scoring, legality checks, exercise generation, beta gates, OSM conversion behavior, or feedback tooling.

## Preflight Checks

The preflight builds the converted map graph, removes blocked directed edges, and reports:

- routable node and edge counts
- connected component count and largest component size
- highway class counts
- named road coverage
- one-way edge count
- raw source turn-restriction relation count
- converted route-engine turn, no-entry, road-closed, and blocked-edge counts
- access, vehicle, and motor-vehicle restriction tags present in the source fixture
- selected stop node IDs
- whether selected stops are on the same routable component
- whether the selected route has a legal path through all required stops

If a fixture cannot produce a confirmed legal route, it remains `visualQaOnly`. The preflight does not invent restrictions, roads, landmarks, or connectivity. Raw OSM restriction relations are reported separately from converted route-engine restrictions, so a fixture can still support restriction cartography while the current legal route preflight uses only restrictions that the conversion layer already exposes to the route engine.

## Safe Route Selection

For curated fixtures that can support learner-style visual QA routes, Stage 160.6 selects start and destination anchors from the largest drivable component. Anchor candidates prefer named drivable roads such as primary, secondary, tertiary, residential, living street, and unclassified roads. Service roads, tracks, footways, cycleways, paths, pedestrian ways, steps, construction, and proposed roads are excluded as start/destination anchors.

Candidate routes are accepted only after `findShortestLegalRouteThroughStops` confirms a legal route through the generated start, checkpoint, and destination stops. This preserves one-way and restriction behavior instead of weakening it.

## Stage 161.4 Submit Matching Gate

Stage 160.6 proves that a fixture can generate a legal route. Stage 161.4 adds
the separate drawn-route submit check: a learner-style drawn polyline must also
snap, match, visit the required stops, and reach scoring on the same converted
fixture graph.

The submit pipeline is:

1. Capture pointer/touch points in map coordinates.
2. Validate that the gesture has enough points and movement.
3. Simplify the trace for normal performance.
4. Snap points to candidate route-graph roads.
5. Match snapped roads into an ordered node/road sequence.
6. Run the existing exercise scorer against the selected exercise stops.
7. Let the existing legality engine reject wrong-way, no-entry, closed-road,
   prohibited-turn, U-turn, or disconnected movements.

Curated OSM fixtures contain many very short split-way segments near junctions.
When simplification removes one of those tiny points, a visually correct drawn
route can appear disconnected to the matcher. For converted OSM maps only, the
pipeline now retries matching against the unsimplified raw trace when the
simplified trace cannot produce a ready match. This does not change synthetic
map matching and does not alter route scoring rules.

Stage 161.4.1 adds a second converted-OSM-only recovery for sparse manual
submits. If snapping selected nearby roads but the selected roads skip over
short split-way or unnamed connector fragments, the pipeline can fill those
local gaps from the same graph only when each gap has a legal connector and the
connector stays within the drawn segment corridor. This is used for the
Cricklewood quiet-residential regression route from `osm-node-5222445789`
through `osm-node-13120968904` to `osm-node-623044867`. The supplied diagnostic
road sequence remains checked for fixture coverage, but scoring still uses the
continuous legal graph route through the required stops.

If snapping at a start or destination junction chooses an adjacent split road,
the pipeline may repair the matched route back to the required endpoint only
when the drawn endpoint is within the normal snap tolerance of that required
marker and a legal connector exists in the same graph. This is an endpoint
attachment repair, not a scoring shortcut. Required checkpoints are still
verified by the scorer from the matched node sequence.

Diagnostics:

- `osm_simplification_retry`: converted OSM matching retried without
  simplification to preserve split-way geometry.
- `osm_sparse_connector_retry`: converted OSM matching filled legal split-way
  connectors between sparse drawn anchors after selected road candidates broke
  across adjacent fixture fragments.
- `start_anchor_repaired`: the matched route was legally anchored back to the
  required start node because the drawn endpoint was near the start marker.
- `destination_anchor_repaired`: the matched route was legally anchored forward
  to the required destination node because the drawn endpoint was near the
  destination marker.
- Existing snapping and matching diagnostics still distinguish off-road points,
  disconnected selected roads, unmatched points, unknown roads, and unresolved
  legal direction.

Learner-facing copy now avoids the generic "matching failed" wording where
possible. A match block tells the learner that the drawn route could not be
matched to the road network and to draw closer to the roads. The detailed OSM
retry/anchor diagnostics stay in dev/test output rather than becoming noisy
learner warnings.

Tests cover the generated legal route geometry for the existing Real London
pilot fixture plus Piccadilly Circus, Waterloo Bridge, one-way system, and
quiet residential curated fixtures. They also cover a wobbled Waterloo submit
inside normal snap tolerance, the sparse Cricklewood route submit regression,
and a genuine wrong-way one-way submit that still fails through the existing
legality engine.

## Curated Fixture Status

The four Stage 160.5 curated fixtures currently preflight as `routableExercise`:

- Piccadilly Circus: dense Central London readability
- Waterloo Bridge: Thames, bridge, rail, station, and central context
- One-way system area: one-way and restriction cartography
- Quiet residential roads: suburban learner-driver readability

Each fixture still has multiple routable components because the extracts are bounded and clipped. The generated exercises use only stops on a confirmed legal route within the largest usable drivable component.

## Known Limitations

- These fixtures are not full London coverage.
- Connectivity is limited by the manually exported Overpass bounds.
- Some OSM restrictions or access tags may be absent or incomplete in the source data.
- The app does not call Overpass at runtime.
- Future full-London work should use a controlled import pipeline, such as a Geofabrik-derived extract, with provenance and attribution metadata.
