# Phase 9 Stage 9.4: Exam Route Pack Expansion

## Scope

Stage 9.4 adds seven deterministic tasks to the exam-mode route selector. The tasks reuse committed route-graph stops and landmarks, so they run through the existing drawing, snapping, validation, Stage 9.2 scoring, and Stage 9.3 review flows without changing the underlying map fixtures.

The additions are an exam-only catalogue overlay. Existing practice options and exercise arrays are not mutated, and task tags are metadata for later progress analysis rather than guidance shown during an active attempt.

## Added route coverage

| Task | Fixture | Tags | Planning skill |
| --- | --- | --- | --- |
| Mortimer Market to Byng Place | Real London pilot | `central-density`, `major-road-choice` | Read a dense central grid and select a practical road corridor. |
| Regent Street to Haymarket | Curated Piccadilly Circus OSM | `central-density`, `major-road-choice` | Plan between nearby central corridors without live route guidance. |
| Lancaster Place to Blackfriars Road via Stamford Street | Curated Waterloo Bridge OSM | `bridge`, `major-road-choice`, `central-density`, `checkpoint` | Make a Thames-crossing plan while satisfying an ordered intermediate stop. |
| Gray's Inn Road to Goodge Street | Curated one-way-system OSM | `one-way-awareness`, `central-density`, `major-road-choice` | Respect supported directed-road and restriction data in a dense network. |
| Hendon Way to Cricklewood Lane | Curated quiet-residential OSM | `residential`, `major-road-choice` | Move between a residential network and a major-road context. |
| Fox Lane Station to Crown Court | Marlowe District fixture | `station`, `landmark`, `public-building` | Locate a station and civic destination using existing fixture landmarks. |
| Albion Square to Northgate Hospital | Marlowe District fixture | `hospital`, `landmark`, `public-building` | Plan from a public square to a hospital destination using existing fixture landmarks. |

The real London tasks use existing committed OSM-derived graph stops and retain their fixture attribution. Marlowe District is an explicitly fictional practice fixture; it supplies the current dependable station, hospital, and public-building landmark endpoints without presenting them as real London facts.

## Metadata contract

Each task has:

- a stable `exam-9-4-*` identifier and `1.0.0` exercise version;
- explicit origin and destination labels, plus ordered checkpoint metadata where applicable;
- deterministic skill tags from the Stage 9.4 tag vocabulary;
- the source exercise and stop index for every endpoint;
- the source fixture name and attribution already carried by its map option;
- `officialTfLTask: false` to prevent an official assessment claim.

Automated coverage confirms that every endpoint still matches its committed source stop, every task is legally reachable, and a shortest legal attempt can be submitted, scored, and reviewed through the existing exam-mode pipeline.

## Unchanged systems

Stage 9.4 does not change cartographic data, road hierarchy, labels, buildings, colours, symbols, restriction rendering, map density, drawing, pan, wheel zoom, pinch zoom, scoring rules, or review presentation. Practice mode keeps its existing route catalogue. No turn-by-turn guidance, progress history, readiness dashboard, route-pack persistence, or official TfL certification language is added.

## Known limitations and deferred coverage

- The current committed real London graphs do not provide dependable route-exercise endpoints for hospitals, public buildings, or estates. Those categories remain represented by the fictional Marlowe District fixture until source-backed real endpoints are added in a later route-data stage.
- The King's Cross and Euston atlas remains on its existing lazy-loading path and is not pulled into the eager exam pack, avoiding a large fixture and build-memory change.
- Estate-specific tasks and a broader geographic spread outside the available committed fixtures remain missing.
- Tags describe intended practice coverage; Stage 9.2 does not yet score landmark quality, bridge choice, or road-hierarchy quality where the engine lacks dependable evidence.

## Manual QA

On desktop, tablet, and mobile:

1. Open Exam Mode and confirm the added tasks are selectable on their expected maps.
2. Start representative central, bridge, one-way, residential, station, and hospital tasks; confirm the origin, destination, and checkpoint text is clear without exposing tags or route guidance.
3. Draw and edit before submission, then submit and confirm scoring and review appear while the route remains locked.
4. Check map overlays remain readable above the dense Phase 8 atlas and that route selection and submission controls do not overflow or cover essential map content.
5. Open normal practice and confirm its existing route list and hint behaviour are unchanged.
