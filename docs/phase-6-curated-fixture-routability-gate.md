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
