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
| `kingsCrossEustonOverpass.json` | Real OSM | 25746 | 830 | 56 | 66 | 1 | 835 | 228 | `betaPracticeAllowedWithLoading` |
| `oneWaySystemAreaOverpass.json` | Real OSM | 13404 | 268 | 11 | 32 | 0 | 623 | 61 | `betaPracticeAllowed` |
| `piccadillyCircusOverpass.json` | Real OSM | 5269 | 73 | 9 | 10 | 0 | 220 | 16 | `betaPracticeAllowed` |
| `quietResidentialRoadsOverpass.json` | Real OSM | 3339 | 39 | 3 | 8 | 0 | 69 | 8 | `betaPracticeAllowed` |
| `realLondonPilotOverpass.json` | Real OSM | 559 | 26 | 0 | 0 | 0 | 0 | 0 | legacy route-runner fixture |
| `waterlooBridgeOverpass.json` | Real OSM | 17367 | 196 | 15 | 13 | 1 | 528 | 36 | `betaPracticeAllowed` |

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
| A/B road references | 7392 real source road-ref ways aggregate. | `0` displayed road references. Raw refs survive as metadata only. | Add typed road-reference render data and renderer support. |
| Buildings | 696 usable closed building polygons aggregate. | `0` general building polygons rendered. | Add building polygon or simplified block adapter. |
| Land use | 1436 real land-use source features aggregate. | `0` land-use polygons rendered. | Add land-use polygon contracts. |
| Institutions | 764 civic/institutional source features aggregate. | Public buildings are point landmarks only; `0` institutional polygons. | Add institutional polygon adapter separate from landmarks. |
| Places and estates | Supported `place=*` labels exist; named residential areas are ambiguous. | Area labels render where adapted. Estates are not safely classified. | Add explicit place/neighbourhood/estate-candidate contract. |
| Parks and gardens | Present in several fixtures. | Supported closed polygons can render as park/open-space backgrounds. | Restyle in later visual stages. |
| Water and river | Water polygons, waterways, and relation rings are present. | Supported water polygons and waterways render where adapted. | Preserve multipolygon handling and add pier support only where sourced. |
| Rail and stations | Present in station-area and bridge fixtures. | Rail lines and `railway=station` point visuals can render. | Review compact transport-symbol contracts. |
| Landmarks/facilities | Tourism, historic, hospital, public-building, market, museum/gallery candidates exist. | Current output is point-like landmark visuals. | Add atlas symbol contracts; do not treat these as areas. |

## Aggregate Findings

The current real fixture set can support road-network hierarchy, local-road
texture, genuine road-reference source detection, parks, water, rail, stations,
area labels, and point landmarks. It cannot yet support the approved visual
master's building fabric, muted institutional blocks, land-use colour fields,
prominent A/B road references, estate treatment, or pier symbols.

The approved visual master therefore remains an appearance target only. Stage
8.2 does not claim visual completion and does not change production map
styling.

## Pipeline Losses

- Road `ref` tags are present and can survive route conversion as raw road
  metadata, but no current renderer path displays them.
- Building-tagged ways and relations are present, including closed polygons,
  but the route graph discards them and the context adapter has no general
  building polygon output.
- Public/civic buildings can become point landmarks when named and recognised;
  they do not become institutional polygons.
- Residential, retail/commercial, and industrial land-use tags are source
  evidence only today.
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
case. Stage 8.3 must define simplification, lazy loading, tiling, or other
limits before building/land-use/institutional fabric is rendered for this
extent.

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

## Stage 8.3 Handoff

Stage 8.3 should implement data contracts only after preserving these audit
distinctions:

- Typed building polygons or simplified building blocks.
- Land-use polygons for residential, retail/commercial, and industrial source
  data.
- Institutional polygons separate from public-building point landmarks.
- Place, neighbourhood, and estate-candidate data that does not silently
  promote ambiguous residential names to estates.
- Road-reference render data sourced only from genuine `ref` tags.
- Transport and public-feature candidates for compact atlas symbols.
- Pier whitelist, adapter, and symbol support only if committed source tags
  warrant it.
- Missing whitelist tags needed by regenerated atlas fixtures.
- Multipolygon and geometry-handling requirements.
- Renderer contracts for each new render-ready feature type.
- Central London performance limits before dense fabric is enabled.
