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
road-reference context features. The source totals below remain the Stage 8.2
baseline; adapter counts and pipeline-state output now reflect the current
Stage 8.3 code. Renderer-consumed counts remain unchanged.

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
| `waterlooBridgeOverpass.json` | Real OSM | 17367 | 196 | 15 | 13 | 1 | 748 | 36 | `betaPracticeAllowed` |

Synthetic controls are audited separately and excluded from real-geography
aggregate conclusions: `largeLondonOverpass.json`, `mediumLondonOverpass.json`,
`realLondonPilotTwoOverpass.json`, `syntheticPhase6VisualQaOverpassFixture`,
and `tinyLondonOverpass.json`.

The Central London stress fixture is source-audited and route-graph-counted
from current registry metadata, but full renderer preparation is intentionally
not run in normal test paths because the existing gate records it as a
dev-only stress fixture.

## Coverage Matrix

| Category | Current source evidence | Current render-ready status | Stage 8.3 implication |
| --- | --- | --- | --- |
| Dense road network | Present across curated and legacy real fixtures. | Road graph and current road rendering exist. | Preserve routing while adding atlas density rules later. |
| A/B road references | 7392 real source road-ref ways aggregate. | Typed context features exist; `0` displayed road references. | Add renderer placement and styling. |
| Buildings | 696 usable closed building polygons aggregate. | Typed context footprints exist where fixtures are converted; `0` rendered. | Add simplification and renderer consumption. |
| Land use | 1436 real land-use source features aggregate. | Typed supported polygons exist where geometry is retained; `0` rendered. | Add renderer consumption. |
| Institutions | 764 civic/institutional source features aggregate. | Typed area features are separate from point landmarks; `0` rendered polygons. | Add renderer consumption. |
| Places and estates | Supported `place=*` labels exist; named residential areas are ambiguous. | Area labels render where adapted. Estates are not safely classified. | Add explicit place/neighbourhood/estate-candidate contract. |
| Parks and gardens | Present in several fixtures. | Supported closed polygons can render as park/open-space backgrounds. | Restyle in later visual stages. |
| Water and river | Water polygons, waterways, and relation rings are present. | Supported water polygons and waterways render where adapted. | Preserve multipolygon handling and add pier support only where sourced. |
| Rail and stations | Present in station-area and bridge fixtures. | Rail lines and `railway=station` point visuals can render. | Review compact transport-symbol contracts. |
| Landmarks/facilities | Tourism, historic, hospital, public-building, market, museum/gallery candidates exist. | Current output is point-like landmark visuals. | Add atlas symbol contracts; do not treat these as areas. |

## Aggregate Findings

The current real fixture set and Stage 8.3 adapter can support road-network
hierarchy, local-road texture, building fabric, institutional and land-use
areas, genuine road-reference data, parks, water, rail, stations, area labels,
and point landmarks. The renderer still cannot display the approved visual
master's building fabric, institutional blocks, land-use fields, prominent A/B
references, estate treatment, or pier symbols.

The approved visual master therefore remains an appearance target only. Stage
8.2 does not claim visual completion and does not change production map
styling.

## Pipeline Losses

- Valid A/B road `ref` tags now become typed context features, but no current
  renderer path displays them.
- Building-tagged closed ways and multipolygon outer rings now become typed
  footprints, while the route graph and renderer still ignore them.
- Public/civic buildings can become point landmarks when named and recognised;
  supported closed geometry separately becomes an institutional-area feature.
- Supported residential, retail/commercial, and industrial polygons now become
  typed land-use blocks where fixture geometry is available, but are not drawn.
- Pier-like source features require whitelist and adapter work before any
  symbol can be claimed.
- `public_transport=station` without `railway=station` is source-present but
  not equivalent to the current station renderer path.
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

All real OSM fixture reports record OpenStreetMap attribution. The audit does
not modify OSM names, road references, fixture geometry, attribution text,
route generation, legality, matching, scoring, hints, feedback, learner
progress, authentication, payments, deployment, or production rendering.

## Performance Considerations

The Central London fixture is 251273 elements and remains a dev-only stress
case. A later renderer stage must define simplification, lazy loading, tiling,
or other limits before building/land-use/institutional fabric is rendered for
this extent.

The King's Cross / Euston fixture remains behind the existing lazy-loading
gate. The audit command can inspect it without running route-generation
preflights.

## Manual QA

Completed:

- Inspected the approved visual master for intended cartographic character.
- Read the Phase 8 README, cartography acceptance, baseline audit, and visual
  QA plan.
- Ran the deterministic audit command and focused automated tests.

Remaining:

- Run the application and visually inspect representative existing maps:
  Piccadilly/dense central, Waterloo Bridge, King's Cross / Euston, quiet
  residential roads, one-way system, and Central London only if it loads safely.
- Confirm existing production visuals are unchanged by screenshot or live
  browser inspection.
- Confirm route drawing, scoring, pan/zoom, learner overlays, route-review
  overlays, and OSM attribution remain visible in the live UI.

## Stage 8.3 Handoff Status

Stage 8.3 completed the building, supported land-use, institutional-area, road
reference, whitelist, outer-ring multipolygon, and traceability contracts while
preserving these audit distinctions. Remaining later-stage work includes:

- Place, neighbourhood, and estate-candidate data that does not silently
  promote ambiguous residential names to estates.
- Transport and public-feature candidates for compact atlas symbols.
- Pier whitelist, adapter, and symbol support only if committed source tags
  warrant it.
- Inner-ring multipolygon geometry where holes affect later fills.
- Renderer consumption, styling, and placement for each new feature type.
- Central London performance limits before dense fabric is enabled.
