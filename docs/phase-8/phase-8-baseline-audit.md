# Phase 8 Baseline Audit

Stage 8.1 inspected the current renderer and documentation without changing
production map behaviour. The approved visual master at
`docs/phase-8/references/phase-8-approved-exam-atlas-visual-master.png` was
found and visually inspected before this audit was written.

Stage 8.2 adds the deterministic fixture-by-fixture evidence report in
[`phase-8-geographic-render-data-audit.md`](phase-8-geographic-render-data-audit.md).
This Stage 8.1 document remains a historical baseline inventory; use the Stage
8.2 audit for source-versus-route-graph-versus-context-versus-renderer coverage
claims.

Where visual proof is not available, this audit records: Requires
representative production screenshot review.

## Current Implementation Inventory

1. Current renderer entry points:
   `app/dev/route-runner/RouteRunnerClient.tsx:3627` owns the canvas drawing
   input shape, `app/dev/route-runner/RouteRunnerClient.tsx:3654` obtains the
   2D context, and `app/dev/route-runner/RouteRunnerClient.tsx:7967` renders
   the route-runner canvas element.
   `app/dev/route-runner/syntheticStreetMapRenderer.ts` prepares and filters
   road, context, label, landmark, restriction, and route-overlay visuals.
   `app/practice/real-london/realLondonBetaPracticeScreen.ts` builds the
   learner-facing Real London beta screen model.

2. Current central style-token locations:
   `app/dev/route-runner/topopassCartographyStyle.ts:671` defines
   `TOPOPASS_STREET_ATLAS_STYLE`, including road tokens at
   `app/dev/route-runner/topopassCartographyStyle.ts:675`, label tokens at
   `app/dev/route-runner/topopassCartographyStyle.ts:836`, context/background
   tokens at `app/dev/route-runner/topopassCartographyStyle.ts:1076`, learner
   overlay tokens at `app/dev/route-runner/topopassCartographyStyle.ts:1400`,
   restriction/review tokens at
   `app/dev/route-runner/topopassCartographyStyle.ts:1914`, and zoom tokens at
   `app/dev/route-runner/topopassCartographyStyle.ts:2078`.

3. Existing road classifications and styles:
   `app/dev/route-runner/syntheticStreetMapRenderer.ts:322` maps OSM
   `primary`, `secondary`, `tertiary`, `residential`, `service`, pedestrian and
   inactive highways to render hierarchy. Road casing/fill passes are prepared
   at `app/dev/route-runner/syntheticStreetMapRenderer.ts:550`. Current road
   styles live in `app/dev/route-runner/topopassCartographyStyle.ts:675`.

4. Existing road-label placement capabilities:
   `app/dev/route-runner/syntheticStreetMapRenderer.ts:678` builds synthetic
   label candidates, `app/dev/route-runner/syntheticStreetMapRenderer.ts:1723`
   builds OSM road labels, and
   `app/dev/route-runner/syntheticStreetMapRenderer.ts:662` derives along-road
   label positions. OSM labels are grouped by road name rather than drawn once
   per split segment.

5. Existing label collision and repetition rules:
   `app/dev/route-runner/syntheticStreetMapRenderer.ts:909` applies label
   priority ordering, viewport thresholds, collision boxes, reserved boxes, and
   road-name repeat distance. Label text and font measurements are cached by
   `labelTextWidthCache` and `labelFontSizeCache` at
   `app/dev/route-runner/syntheticStreetMapRenderer.ts:283`.

6. Current road-reference support:
   Curated fixture enrichment keeps the `ref` tag in its whitelist in
   `app/dev/route-runner/curatedLondonOsmEnrichment.ts:163`, and OSM road raw
   tags are preserved in route-graph metadata by
   `lib/map-engine/osm/osmToRouteGraph.ts:286`. No current renderer path turns
   road `ref` values into prominent A-road or B-road shields/inline references.

7. Current building-footprint support:
   `lib/map-engine/osm/overpassImport.ts:250` detects non-road ways with
   `building` tags when explaining excluded highway data, and the enrichment
   whitelist preserves `building` at
   `app/dev/route-runner/curatedLondonOsmEnrichment.ts:143`.
   `app/dev/route-runner/realLondonContextData.ts:552` uses selected
   `building` values only for public-building landmark classification. There is
   no render-ready building footprint or block layer.

8. Current land-use and institutional-area support:
   `app/dev/route-runner/realLondonContextData.ts:84` defines supported context
   feature kinds. It supports parks, gardens, open space, water, pedestrian
   areas, area labels, selected public-building landmarks, and selected
   institutions as point-like landmarks through checks such as
   `app/dev/route-runner/realLondonContextData.ts:552`. It does not provide
   muted pink institutional polygons or general land-use blocks for the atlas
   target.

9. Existing parks, water, rail, station, bridge and landmark support:
   `app/dev/route-runner/realLondonContextData.ts:212` counts and normalises
   rail/station context, `app/dev/route-runner/realLondonContextData.ts:398`
   builds water features, and
   `app/dev/route-runner/realLondonContextData.ts:643` supports selected area
   labels. `app/dev/route-runner/syntheticStreetMapRenderer.ts:1842` builds OSM
   background features, `app/dev/route-runner/syntheticStreetMapRenderer.ts:1820`
   builds landmark visuals, and
   `app/dev/route-runner/syntheticStreetMapRenderer.ts:1849` draws water and
   pedestrian-area polygons.

10. Existing district, neighbourhood and estate-label support:
    `app/dev/route-runner/realLondonContextData.ts:643` supports area labels
    for `place=neighbourhood`, `suburb`, `quarter`, `locality`, and `square`.
    Estate-specific labels are not separately identified; they depend on source
    tags being accepted by the current generic area-label rules.

11. Current one-way and restriction rendering:
    OSM one-way tags are imported by `lib/map-engine/osm/overpassImport.ts:217`
    and converted into directed route graph behaviour.
    `app/dev/route-runner/syntheticStreetMapRenderer.ts:2257` defines legend
    entries for no-entry and one-way visuals, while
    `app/dev/route-runner/topopassCartographyStyle.ts:1914` centralises
    restriction styling. Curated enrichment notes at
    `app/dev/route-runner/curatedLondonOsmEnrichment.ts:383` and
    `app/dev/route-runner/curatedLondonOsmEnrichment.ts:418` that turn
    restriction relation data can exist in source exports while the current
    converter does not yet turn those relations into scored restrictions.

12. Current layer order:
    `app/dev/route-runner/realLondonVisualComparisonScenarios.ts:330` defines
    `FINAL_PHASE_6_REAL_LONDON_LAYER_STACK`: land background, water, parks,
    rail, bridges/crossings, stations, landmarks, area names, road casings, road
    fills, road hierarchy, street labels, one-way arrows, restriction symbols,
    correct route, alternatives, attempted route, warnings, markers,
    checkpoints, hints, review callouts, and selected/focused overlays.

13. Current zoom tiers and decluttering rules:
    `app/dev/route-runner/topopassCartographyStyle.ts:2078` defines zoom
    thresholds, low/high detail viewport scales, restriction-symbol alpha/scale,
    semantic cartographic scale, label gains, label caps, and high/very-high
    zoom behaviour. `app/dev/route-runner/mapViewport.ts:182` handles pinch
    distance, `app/dev/route-runner/mapViewport.ts:349` starts pinch zoom, and
    `app/dev/route-runner/mapViewport.ts:448` applies phone-specific viewport
    defaults.

14. Current mobile and high-zoom behaviour:
    `app/dev/route-runner/mapViewport.ts:448` defines phone map limits.
    `app/dev/route-runner/routeRunnerMobileQa.ts:232` builds the mobile QA
    report, `app/dev/route-runner/routeRunnerMobileQa.ts:343` models bounded
    map areas, and `app/dev/route-runner/routeRunnerMobileQa.ts:584` validates
    touch drawing. `app/dev/route-runner/syntheticStreetMapRenderer.test.ts:1179`
    and `app/dev/route-runner/syntheticStreetMapRenderer.test.ts:1408` cover
    high-zoom road and label scaling.

15. Existing visual-QA fixtures:
    `realLondonVisualQaScenario.ts` defines the synthetic Phase 6 visual QA
    fixture. `app/dev/route-runner/realLondonVisualComparisonScenarios.ts:256`
    defines comparison modes,
    `app/dev/route-runner/realLondonVisualComparisonScenarios.ts:356` defines
    mobile/tablet viewports,
    `app/dev/route-runner/realLondonVisualComparisonScenarios.ts:439` starts
    the scenario catalogue, and
    `app/dev/route-runner/realLondonVisualComparisonScenarios.ts:1470` records
    the Phase 6 release-candidate gate.

16. Existing performance optimisations:
    `app/dev/route-runner/syntheticStreetMapRenderer.ts:283` caches label
    measurements, `app/dev/route-runner/syntheticStreetMapRenderer.ts:1723`
    groups OSM road labels by name, and
    `app/dev/route-runner/syntheticStreetMapRenderer.ts:909` filters labels by
    viewport. `app/dev/route-runner/curatedLondonOsmEnrichment.ts:471` records
    fixture coverage counts and budget-related metadata.

17. Existing learner and route-review overlays:
    `app/dev/route-runner/topopassCartographyStyle.ts:1400` centralises route
    overlays, exercise markers, hints, learner overlay draw order, review
    callouts, warnings, selected focus, touch targets, and review issue
    styling. `app/dev/route-runner/RouteRunnerClient.tsx:8610` renders the
    route-result summary region and `app/dev/route-runner/RouteRunnerClient.tsx:8648`
    renders the route-feedback/attempt-review details region.

18. Current OSM attribution rendering:
    `app/dev/route-runner/routeRunnerMaps.ts:977` assigns
    `OpenStreetMap contributors` attribution to converted OSM map options.
    `app/practice/real-london/realLondonBetaPracticeScreen.ts:647` exposes
    attribution in the learner practice model and
    `app/practice/real-london/realLondonBetaPracticeScreen.ts:797` falls back
    to OSM attribution for converted OSM maps.
    `app/dev/route-runner/RouteRunnerClient.tsx:7953` renders map data
    attribution in the route-runner UI.

## Data Coverage Findings

| Data needed for Phase 8 | Baseline finding | Distinction |
| --- | --- | --- |
| Road references | `ref` is preserved by curated enrichment and raw route-road tags, but not rendered as atlas references. | Source or route metadata can exist while displayed reference output is still absent. |
| Buildings | `building` tags may be present and whitelisted; selected public/civic buildings can become landmark points. | Source polygons can exist, but general footprints are not adapted into render-ready building polygons. |
| Institutional building classification | Some `amenity` and `building=public/civic` tags become public-building landmarks. | Feature exists only as point-like landmark classification; institutional polygons are absent. |
| Estates | No estate-specific adapter was found. Generic area labels support selected `place` values only. | Data may be absent or discarded depending on source tags; requires later audit and visual QA. |
| Neighbourhoods | `place=neighbourhood/suburb/quarter/locality/square` labels are supported. | Render-ready labels exist but density and typography are insufficient for Phase 8. |
| Public buildings | `amenity` and `building` tags can produce public-building landmarks. | Feature is drawn as compact landmark/label, not as atlas institutional area. |
| Rail and station context | Rail lines and station markers/labels are supported from raw fixtures. | Render-ready data exists and is drawn, but Phase 8 styling requires screenshot review. |
| Parks and gardens | Parks, gardens, and open spaces are supported. | Render-ready data exists and is drawn where fixtures contain it. Styling requires Phase 8 review. |
| Water | Water polygons, waterway lines, and multipolygon outer rings are supported. | Render-ready data exists and is drawn where fixtures contain it. Styling requires Phase 8 review. |
| Piers | No pier-specific adapter or symbol was found. | Data is absent from current render-ready categories. |
| Landmarks | Selected hospitals, attractions, historic features, public buildings, market/mall, museums and galleries are supported. | Feature is drawn as point-like landmark visuals; symbol system is not Phase 8-complete. |

## Gap Table

| Visual-master requirement | Current capability | Evidence/file | Gap | Proposed later stage | Risk or dependency |
| --- | --- | --- | --- | --- | --- |
| Broad continuous flat-yellow major roads | Major/primary road hierarchy exists with casings and fills. | `topopassCartographyStyle.ts`, `syntheticStreetMapRenderer.ts` | Current colours are warmer/subtler and roads are graph-segment strokes, not clearly flat-yellow printed corridors. Requires representative production screenshot review. | Stage 8.4 | Must preserve snapping and route geometry alignment. |
| Crisp dark road edges | Road casing/fill passes exist. | `buildRoadRenderPasses` in `syntheticStreetMapRenderer.ts` | Current casings are restrained and rounded, not hard-edged atlas edges. Requires representative production screenshot review. | Stage 8.4 | Junction joins may need visual changes without breaking hit testing. |
| Prominent A-road and B-road references | `ref` tags can be preserved in source metadata. | `curatedLondonOsmEnrichment.ts`, `osmToRouteGraph.ts` | No prominent road-reference rendering. | Stage 8.7 | Depends on reliable `ref` availability in committed fixtures. |
| Dense local-street coverage | Converted OSM road graph and residential/service hierarchy exist. | `routeRunnerMaps.ts`, `osmRoadFilters.ts`, `syntheticStreetMapRenderer.ts` | Coverage depends on fixture extent and filters; current decluttering may suppress too much density. Requires representative production screenshot review. | Stage 8.2, Stage 8.8 | Large fixtures have performance and beta-gating constraints. |
| Compact labels on many useful streets | Road labels, collision boxes, repeat-distance rules, and OSM name grouping exist. | `filterSyntheticMapLabelsForViewport`, `buildOsmRoadLabels` | Current labels are learner-clean rather than printed-atlas dense; service labels require high scale. | Stage 8.6 | More labels can collide with learner overlays. |
| Large condensed district names | Area labels exist for selected `place` tags. | `realLondonContextData.ts` | Typography is not large/condensed and estates are not specifically supported. Requires screenshot review. | Stage 8.6 | Depends on source data and collision strategy. |
| Visible building and built-up context | Warm canvas and some synthetic land blocks exist; building tags may be whitelisted. | `topopassCartographyStyle.ts`, `curatedLondonOsmEnrichment.ts` | No general building footprint or simplified block rendering for Real London. | Stage 8.3, Stage 8.5 | Raw fixtures may need audited building coverage and performance budgets. |
| Muted pink institutional areas | Public-building landmarks can be classified. | `realLondonContextData.ts` | Institutional areas are not drawn as polygons or pink blocks. | Stage 8.3, Stage 8.5 | Requires source classification rules and visual QA. |
| Green parks and gardens | Park/garden/open-space polygons are supported where source data exists. | `realLondonContextData.ts`, `syntheticStreetMapRenderer.ts` | Styling and density need Phase 8 comparison. Requires representative production screenshot review. | Stage 8.5 | Fixture completeness varies by map. |
| Pale-blue water | Water polygons, waterways, and some relation rings are supported. | `realLondonContextData.ts`, `syntheticStreetMapRenderer.ts` | Styling may need lighter printed-atlas treatment. Requires representative production screenshot review. | Stage 8.5 | Relation stitching coverage must remain deterministic. |
| Rail and station context | Rail, station markers, station labels, and context feature styles exist. | `realLondonContextData.ts`, `topopassCartographyStyle.ts` | Symbols and hierarchy need original Phase 8 atlas treatment. Requires representative production screenshot review. | Stage 8.7 | Avoid overpowering road-reading task. |
| Compact public-feature symbols | Landmark visual kinds and marker styles exist. | `syntheticStreetMapRenderer.ts`, `topopassCartographyStyle.ts` | Symbols are generic learner markers, not compact printed atlas symbols. | Stage 8.7 | Must remain original and accessible. |
| Hard edges and flat composition | Canvas renderer uses flat colours and strokes. | `syntheticStreetMapRenderer.ts` | Current joins/caps are often rounded and sparse; hard printed composition is not proven. Requires representative production screenshot review. | Stage 8.4, Stage 8.5 | Style changes can affect legibility on mobile. |
| Minimal unexplained empty space | Some context features and warm background exist. | `realLondonContextData.ts`, visual scenarios | Building fabric is missing, so dense areas can still read as empty. Requires representative production screenshot review. | Stage 8.5, Stage 8.8 | Depends on buildings/land-use data availability. |
| Learner-route, hint and review overlays remain visible | Overlay tokens, draw order, and review callout styles exist. | `topopassCartographyStyle.ts`, `RouteRunnerClient.tsx` | Phase 8 density may obscure learner overlays without rebalancing. | Stage 8.9 | Must not turn the map into route-first navigation. |
| OSM attribution remains visible | Map options and learner screen expose attribution. | `routeRunnerMaps.ts`, `realLondonBetaPracticeScreen.ts`, `RouteRunnerClient.tsx` | Must be verified after any layout or screenshot changes. Requires representative production screenshot review. | Stage 8.11, Stage 8.12 | Attribution cannot be hidden by dense map styling. |

## Baseline Conclusion

The current renderer has a solid Phase 6 street-map foundation: OSM road
hierarchy, road labels, label collision, route overlays, one-way/restriction
visuals, selected context features, curated visual scenarios, mobile QA models,
and OSM attribution. It does not yet have the render-data breadth or visual
language needed for the approved Phase 8 examination-atlas master.

The highest-risk Phase 8 gaps are road-reference rendering, general building
fabric, institutional polygons, estate/place treatment, compact symbol design,
major-road corridor redesign, denser label placement, and proof through
representative production screenshots.
