# Phase 8 Visual QA Plan

Phase 8 final visual QA requires representative screenshots and side-by-side
comparison against the approved visual master:

`docs/phase-8/references/phase-8-approved-exam-atlas-visual-master.png`

Do not create fake screenshot baselines during Stage 8.1. Later stages must
capture real production-renderer screenshots from deterministic scenarios and
review them against the master for cartographic family, information density,
accuracy boundaries, originality, and learner usability.

## Inspection Criteria

Every scenario below must inspect:

- Local-road density.
- Major-road dominance.
- Road-reference prominence.
- Label compactness.
- Label quantity.
- Building and land-use context.
- Contextual-feature visibility.
- Unexplained empty space.
- Learner-overlay visibility.
- Review-overlay visibility.
- Attribution.
- Performance and interaction.

## Representative Scenarios

| Scenario | What must be inspected |
| --- | --- |
| Dense Central London | Dense minor-road coverage, compact labels, major-road hierarchy, district names, built-up fabric, lack of unexplained empty space, attribution, pan/zoom performance. |
| Major A-road corridors | Continuous flat-yellow corridor treatment, crisp dark edges, A-road reference prominence, side-street relationship, road-name fit, learner route visibility over major roads. |
| Civic and institutional areas | Muted institutional polygons, public-building labels/symbols, nearby road context, source-data accuracy, label collision, no copied concept geography. |
| High streets | Shop/market/public-feature context where sourced, dense useful labels, high-street dominance, compact symbols, local-road continuity. |
| Quiet residential streets | Residential/service-road visibility, useful local labels, estate/neighbourhood context, no excessive blankness, readable learner overlays. |
| Housing estates | Estate labels where source data supports them, local-road and service-road texture, building/block context, route-review visibility. |
| Parks and gardens | Green area styling, park/garden labels, boundary clarity, adjacent-road labels, learner-route contrast. |
| River and bridge crossings | Pale-blue water, bridge road hierarchy, bridge labels, pier support if source data exists, attribution, route and review overlays above water/bridges. |
| Rail and station areas | Rail line visibility, station symbols/labels, transport context priority, public-feature symbols, no overpowering of road-reading task. |
| Complex junctions | Road edge clarity, turn decision readability, one-way and restriction symbols, label collisions, route review warnings. |
| Roundabouts | Roundabout geometry, major/minor road priority, one-way direction cues, label fit, route-drawing alignment. |
| One-way systems | One-way symbol spacing, restriction prominence, local-road label density, review-critical symbol priority. |
| Restricted movements | No-entry/prohibited-turn/restricted-road rendering, learner feedback alignment, route-review issue visibility, no turn-by-turn guidance during independent attempts. |
| Desktop | Principal exam scale, dense visual field, route controls not hiding geography, attribution, performance. |
| Tablet | Map-first layout, touch target adequacy, label density, overlay visibility, attribution. |
| Mobile portrait | Compact map usability, readable but dense labels, marker/hint separation, scroll and pinch behaviour, attribution. |
| Mobile landscape | Short viewport composition, major-road dominance, control placement, overlay visibility, no text overlap. |
| Low zoom | Overview hierarchy, limited but useful labels, no consumer-style over-decluttering, performance. |
| Principal exam zoom | Main acceptance scale: dense local roads, major corridors, road refs, buildings/land-use context, labels, overlays, attribution. |
| High zoom | Building/road/detail clarity, collision handling, marker alignment, route drawing precision. |
| Very-high zoom | Semantic scaling caps, no stretched geometry, labels and overlays remain usable, performance. |
| Route drawing | Attempt line visibility, road context not hidden, no route-first simplification, start/checkpoint/destination readability. |
| Correct-route review | Correct route, accepted alternatives, checkpoints, restrictions, labels, and base map all visible together. |
| Incorrect-route review | Mistake markers, illegal/inefficient/backtrack warnings, missed checkpoints, restrictions, and dense base map remain readable. |

## Screenshot Evidence Rules

- Use representative production-renderer screenshots, not hand-edited images.
- Capture before/after evidence for visual changes after Stage 8.1.
- Compare screenshots side by side with the approved visual master.
- Record viewport size, map id, exercise id where applicable, zoom, interaction
  state, and fixture/source data used.
- Keep OSM attribution visible in screenshots wherever OSM-derived data is
  rendered.
- Do not accept a stage solely because automated tests pass.
- Do not treat generated labels or geography in the approved master as
  production data.

## Final QA Gate

Final Phase 8 visual QA passes only when screenshots from dense central,
major-road, institutional, residential, park/water, transport, junction,
route-drawing, and route-review scenarios visibly belong to the same
cartographic family as the approved master while remaining an original
TOPOPASS map based on permitted and attributed source data.

## Stage 8.6 Evidence

Stage 8.6 production-renderer evidence is recorded in
`stage-8-6-built-up-context.md` and `screenshots/stage-8-6/`. It covers dense
built and institutional fabric, sparse residential coverage, parks, water and
bridges, one-way context, an active learner route, correct/incorrect review
states, desktop 1440 by 900, and mobile 390 by 844. This is Stage 8.6 evidence,
not the final Phase 8 acceptance gate for later symbol, density, overlay,
mobile/accessibility and regression stages.

## Stage 8.7 Evidence

Stage 8.7 production-renderer captures are under `screenshots/stage-8-7/`.
Desktop 1440 by 900 captures cover King's Cross/Euston, Waterloo, Piccadilly,
quiet residential, one-way/restriction, lower/principal/higher zoom, active
route and submitted correct/incorrect review scenarios. Mobile 390 by 844
captures cover King's Cross/Euston, Waterloo, one-way/restriction, active route
and expanded correct/incorrect review details at displayed 100%.

Inspection found compact hard-edged symbols integrated with the map field,
prominent but bounded red A/B references, retained road-name and major-road
hierarchy, visible built/water context, aligned learner markers and visible OSM
attribution. Mobile symbol budgets remained restrained, and pass/fail details
fit their narrow layout without clipping. Visual inspection found no symbol,
reference, route, marker, restriction or attribution alignment regression.

## Stage 8.7 Correction Evidence

Focused before/after and production-state captures are under
`screenshots/stage-8-7-correction/`. Desktop 1440 by 900 evidence covers the
King's Cross A501 corridor at displayed 80%, 100% and 125%, Piccadilly,
Waterloo, an active route and correct/incorrect submitted reviews. Mobile 390
by 844 evidence covers the committed and corrected King's Cross reference view
plus an active route at displayed 100%.

Inspection against the approved visual master confirmed stronger genuine red
A/B references, clearer original compact symbols, padded edge placement,
distinct-reference-first budgeting and controlled long-corridor repetition.
Road names, routes, markers, attribution and review overlays remain aligned and
visually dominant where required. Stage 8.8 evidence follows below.

## Stage 8.8 Evidence

Stage 8.8 production-renderer captures are under `screenshots/stage-8-8/` and
are indexed in `stage-8-8-principal-scale-and-density.md`. The new Victoria /
Westminster / Vauxhall benchmark was inspected at exact 1440 by 900, 1024 by
768 and 390 by 844 viewports. Exact 1440 by 900 evidence also covers
Piccadilly, Waterloo, King's Cross / Euston, quiet residential,
one-way/restriction, active learner route and submitted correct/incorrect
review states.

Inspection against the approved visual master confirmed a denser principal
exam view with numerous source-backed local names, continuous major-road
corridors, bounded red A/B references, subordinate district/context labels and
no broad collision-created blank fields. Learner routes, markers, submitted
review overlays and attribution remain aligned. The development-only mobile QA
toolbar still wraps beyond the narrow benchmark viewport; Stage 8.10 owns the
broader mobile/accessibility layout pass. Stage 8.9 was not started.
