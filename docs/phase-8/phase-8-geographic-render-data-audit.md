# Phase 8 Geographic Render-Data Audit

Stage 8.2 adds deterministic code and tests for the geographic data currently
available to the Real London map pipeline. The audit is implemented in
`app/dev/route-runner/phase8GeographicRenderDataAudit.ts` and can be run with:

```bash
npm.cmd run map:audit:phase8
```

The command audits committed fixtures and current code paths only. It does not
fetch live Overpass data and does not use the approved visual master as
geography.

Stage 8.3 subsequently added typed building, institutional-area, land-use, and
road-reference context features. Stage 8.5 consumes supported names and road
references through a typed label-candidate pipeline. Stage 8.6 consumes the
supported area geometry, including complete relation inner rings. The source
totals below remain the Stage 8.2 baseline; adapter and renderer diagnostics
reflect the current code. Stage 8.7 consumes named supported transport and
public-feature candidates through a typed compact-symbol pipeline and refines
source-validated A/B reference placement. Stage 8.8 adds a source-backed
Victoria / Westminster / Vauxhall benchmark and uses it to gate principal-scale
density without exposing the fixture to learner beta catalogues. Its correction
adds a bounded building-only context source after proving that the lightweight
route export held only 293 building ways and that semantic scale gates also
suppressed the retained footprints at displayed 100%. Stage 8.8.3 adds targeted
source-backed visual/context-only supplements for lighter non-Victoria fixtures.
Those supplements are merged only into renderer source context and do not
replace route conversion, preflights or scoring fixtures.

## Scope And Methodology

The audit distinguishes:

- Source coverage: tags and geometry present in committed OSM-derived fixture
  JSON.
- Retained/imported coverage: data accepted by the current OSM importer or
  retained by the curated tag whitelist.
- Route-graph coverage: data available on converted OSM road metadata.
- Context-adapter coverage: data converted by `buildRealLondonContextFeatures`.
- Renderer-consumed coverage: data consumed by current renderer helpers.
- Unsupported/discarded coverage: source data that has no adapter, no renderer
  consumer, missing whitelist support, or only survives as metadata.
- Source absence: features not present in a fixture.
- Manual unverified: visibility or performance that automation cannot prove.

The audit deliberately avoids treating source-tag counts as rendered output.
A `ref` tag is not a displayed road reference, a building way is not a rendered
building polygon, and a public-building landmark point is not an institutional
area.

## Audited Fixtures

| Fixture | Classification | Elements | Road-ref ways | Building polygons | Institutional source | Water multipolygons | Context features | Renderer labels | Gate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `centralLondonOverpass.json` | Real OSM | 251273 | 5960 | 602 | 635 | 15 | 0 | 0 | `devOnlyStressTest` |
| `kingsCrossEustonOverpass.json` | Real OSM | 25746 | 830 | 56 | 66 | 1 | 1909 | 228 | `betaPracticeAllowedWithLoading` |
| `oneWaySystemAreaOverpass.json` | Real OSM | 13404 | 268 | 11 | 32 | 0 | 920 | 61 | `betaPracticeAllowed` |
| `piccadillyCircusOverpass.json` | Real OSM | 5269 | 73 | 9 | 10 | 0 | 305 | 16 | `betaPracticeAllowed` |
| `quietResidentialRoadsOverpass.json` | Real OSM | 3339 | 39 | 3 | 8 | 0 | 119 | 8 | `betaPracticeAllowed` |
| `realLondonPilotOverpass.json` | Real OSM | 559 | 26 | 0 | 0 | 0 | 26 | 0 | legacy route-runner fixture |
| `victoriaWestminsterVauxhallOverpass.json` + bounded building context | Real OSM | 64123 | 946 | 5970 | 165 | 3 | 9447 | 1540 | `visualQaOnly` |
| `waterlooBridgeOverpass.json` | Real OSM | 17367 | 196 | 15 | 13 | 1 | 748 | 36 | `betaPracticeAllowed` |

Synthetic controls are audited separately and excluded from real-geography
aggregate conclusions: `largeLondonOverpass.json`, `mediumLondonOverpass.json`,
`realLondonPilotTwoOverpass.json`, `syntheticPhase6VisualQaOverpassFixture`,
and `tinyLondonOverpass.json`.

The Central London stress fixture is source-audited and route-graph-counted
from current registry metadata, but full renderer preparation is intentionally
not run in normal test paths because the existing gate records it as a
dev-only stress fixture.

## Stage 8.8.3 Supplement Counts

Stage 8.8.3 leaves the route fixture rows above intact and adds separate
context supplements. Counts below are source-backed adapted features before and
after merging each supplement for rendering:

| Fixture | Supplement raw elements | Buildings before / after | Land-use before / after | Parks before / after | Water before / after | Rendered buildings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Piccadilly | 8,245 | 9 / 2,458 | 0 / 110 | 3 / 19 | 2 / 5 | 2,439 |
| Waterloo | 9,875 | 15 / 2,283 | 0 / 147 | 60 / 171 | 13 / 21 | 2,244 |
| King's Cross / Euston | 7,588 | 58 / 3,637 | 128 / 234 | 259 / 270 | 14 / 12 | 3,613 |
| One-way / restriction | 12,889 | 11 / 4,458 | 0 / 219 | 49 / 157 | 2 / 4 | 4,411 |
| Quiet residential | 5,994 | 3 / 4,302 | 0 / 73 | 19 / 128 | 4 / 22 | 4,297 |

The King's Cross / Euston supplement uses a tighter Euston Road / King's Cross
/ St Pancras visual corridor after the first wider pull proved too heavy for
browser QA. The optional `barrier=*` group was skipped there after Overpass
endpoint failures; all required visual context groups completed.

## Coverage Matrix

| Category | Current source evidence | Current render-ready status | Current implication |
| --- | --- | --- | --- |
| Dense road network | Present across curated and legacy real fixtures. | Road graph and current road rendering exist. | Preserve routing while adding atlas density rules later. |
| A/B road references | 8338 real source road-ref ways aggregate. | Typed context features now produce bounded red label candidates with source IDs and tags. | Verify placement and density through screenshots. |
| Buildings | 6666 usable closed building polygons aggregate. | 5772 typed source-backed footprints render in the explicit audit; normal learner gates remain fixture-specific. | Keep Central London performance-gated and verify fixture gaps visually. |
| Land use | 1691 real land-use source features aggregate. | 392 typed supported polygons render in the explicit audit; retained geometry remains fixture-specific. | Do not fabricate fields to fill source gaps. |
| Institutions | 929 civic/institutional source features aggregate. | 334 typed area polygons render in the explicit audit. Point landmarks remain separate. | Keep fills subordinate to roads and labels. |
| Places and estates | Supported `place=*` labels and named residential land-use polygons exist. | District labels render from supported places; estate labels require an explicitly named residential land-use feature. | Verify hierarchy and fixture gaps visually. |
| Parks and gardens | Present in several fixtures. | Supported closed polygons render with Stage 8.6 park/open-space styles. | Keep roads, labels and learner overlays dominant. |
| Water and river | Water polygons, waterways, relation rings and two named Waterloo pier ways are present. | Supported water geometry renders; the two named Waterloo piers reach the compact symbol pipeline. | Preserve multipolygon handling and reject unnamed or invalid pier geometry. |
| Rail and stations | Present in station-area and bridge fixtures. | Rail lines plus named `railway=station` and `public_transport=station` candidates can render as compact original marks. | Keep symbols bounded and subordinate to learner overlays. |
| Landmarks/facilities | Tourism, historic, hospital, religious, education, civic, named parking, market and museum/gallery candidates exist. | Supported named candidates retain source IDs, tags and geometry and render through category budgets. | Do not treat point symbols as areas or fabricate unsupported categories. |

## Aggregate Findings

The current real fixture set and Stage 8.3 adapter support road-network
hierarchy, local-road texture, building fabric, institutional and land-use
areas, genuine road-reference data, parks, water, rail, stations, area labels,
and point landmarks. Stage 8.5 now renders source-backed label candidates for
those supported names and prominent A/B references. Stage 8.6 now renders the
supported building fabric, institutional blocks, land-use fields, parks and
water with deterministic background order and semantic-zoom limits. Stage 8.7
adds source-backed compact symbols and class-aware A/B reference repetition
without enabling the Central London stress fixture on learner paths. Stage 8.8
keeps its 9.59 MiB route benchmark and 5.44 MiB bounded building-only context
source behind an explicit lazy selection boundary and uses their dense road,
reference, building, institution, land-use, park, water, rail, station and
public-feature coverage only for development visual QA. The supplement changes
context coverage only; route conversion remains based on the lightweight route
fixture. Stage 8.8.3 applies the same separation to non-Victoria fixtures:
Piccadilly, Waterloo, King's Cross/Euston, one-way/restriction and quiet
residential receive separate visual context supplements while their route graph
road counts and learner exercise behavior remain unchanged.

The approved visual master therefore remains an appearance target only. Stage
8.2 does not claim visual completion and does not change production map
styling.

## Pipeline Losses

- Valid A/B road `ref` tags become typed context features and bounded Stage 8.5
  label candidates.
- Building-tagged closed ways and complete multipolygon rings become typed
  footprints consumed by the Stage 8.6 background renderer.
- Complete inline Overpass way geometry can become a context polygon even when
  the response intentionally omits standalone route-node records.
- Public/civic buildings can become point landmarks when named and recognised;
  supported closed geometry separately becomes an institutional-area feature.
- Supported residential, retail/commercial, industrial and rail polygons become
  typed land-use blocks and render where retained fixture geometry is available.
- Named `man_made=pier` ways with usable geometry can become pier symbols;
  unnamed or invalid pier-like records remain rejected.
- Named `public_transport=station` features can become station candidates;
  duplicate nearby source records are suppressed deterministically.
- Source place labels are adapted only for selected `place` values; named
  residential polygons remain ambiguous estate candidates.

## Known Ambiguities

Named residential polygons are not classified as estates unless an explicit
estate-like source tag is present. The audit records them as ambiguous because
names alone are not a reliable estate classification.

Bridge-over-water relationships are counted conservatively as bridge-tagged
ways in fixtures with water context. The audit does not prove exact geometric
crossing without a later spatial relationship pass.

Central London renderer visibility remains a performance-gated manual item. The
fixture is valuable source evidence, but the current application records it as
too heavy for normal learner practice.

## Accuracy And Attribution

All real OSM fixture reports record OpenStreetMap attribution. Stage 8.7 does
not modify OSM names, road references, fixture geometry, attribution text,
route generation, legality, matching, scoring, hints, feedback, learner
progress, authentication, payments or deployment.

## Performance Considerations

The Central London fixture is 251273 elements and remains a dev-only stress
case. Stage 8.6 defines viewport filtering, minimum rendered area, bounded
screen-space simplification and semantic-zoom limits. The full extent still
requires its existing dev-only gate or a later loading/tiling strategy before
dense fabric is enabled for learner use.

The King's Cross / Euston fixture remains behind the existing lazy-loading
gate. The audit command can inspect it without running route-generation
preflights.

## Manual QA

Completed through Stage 8.7:

- Inspected the approved visual master for intended cartographic character.
- Read the Phase 8 README, cartography acceptance, baseline audit, and visual
  QA plan.
- Ran the deterministic audit command and required automated validation.
- Inspected Piccadilly, Waterloo Bridge, King's Cross / Euston, quiet
  residential and one-way fixtures at desktop and mobile sizes.
- Exercised pan, wheel zoom, mobile pinch, reset, route drawing, markers,
  restrictions, correct/incorrect review overlays and OSM attribution.
- Inspected Stage 8.7 King's Cross/Euston, Waterloo, Piccadilly, quiet
  residential and one-way states at lower, principal and higher zoom.
- Captured desktop and mobile active-route and submitted correct/incorrect
  review states through the production learner route.
- Inspected the Stage 8.8 Victoria / Westminster / Vauxhall benchmark at exact
  desktop, tablet and mobile viewports plus current active-route and submitted
  pass/fail states.

Later Phase 8 work includes overlay rebalance, mobile/accessibility,
performance and final acceptance
stages. The dev-only Central London fixture remains a manual performance item.

## Stage 8.3 Handoff Status

Stage 8.3 completed the building, supported land-use, institutional-area, road
reference, whitelist, outer-ring multipolygon, and traceability contracts while
preserving these audit distinctions. Remaining later-stage work includes:

- Place, neighbourhood, and estate-candidate data that does not silently
  promote ambiguous residential names to estates.
- Continued source-coverage review for categories absent from committed
  fixtures; unsupported categories must remain unrendered.
- Central London performance limits before dense fabric is enabled.

Stage 8.7 implements and visually accepts compact symbols and road-reference
refinement. Stage 8.8 implements and visually accepts the principal-scale
density rules and visual-QA benchmark. Stage 8.9 was not started.
