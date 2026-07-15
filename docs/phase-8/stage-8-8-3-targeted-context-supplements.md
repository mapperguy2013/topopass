# Stage 8.8.3: Targeted Context Supplements

Stage 8.8.3 is a focused source-data correction for non-Victoria Phase 8 visual
fixtures that looked materially lighter than the Victoria / Westminster /
Vauxhall benchmark after Stage 8.8.2. It does not replace route, scoring,
snapping or restriction fixtures. It adds separate OSM-derived visual/context
supplements and wires them only through the renderer's `sourceOverpassFixture`
path.

The goal is stronger source-backed atlas density in representative fixtures
without fabricating geography, copying the approved visual master, or changing
learner route correctness.

## Source Pulls

All data was pulled from Overpass API on 15 July 2026 using
`scripts/maps/pull-stage-8-8-3-context.mjs`. Each fixture uses the route fixture
area plus a small practical margin. The King’s Cross / Euston first full-area
pull was discarded because it produced a 23.4 MB visual payload that could not
be browser-QA captured reliably; the committed pull is bounded to the actual
Euston Road / King’s Cross / St Pancras visual corridor.

The query shape for each group was:

```text
[out:json][timeout:60];
(
  <selector>(south,west,north,east);
  ...
);
out body geom;
```

Selectors covered source-backed visual context only:

`building=*`, `amenity=*`, `tourism=*`, `historic=*`, `leisure=*`,
`landuse=*`, `natural=*`, `waterway=*`, `railway=*`,
`public_transport=*`, `place=*`, `shop=*`, `office=*` and optional
`barrier=*`.

| Fixture | Bounds south, west, north, east | Supplement | Raw elements | File size |
| --- | --- | --- | ---: | ---: |
| Piccadilly | `51.5077287, -0.1402665, 51.5163823, -0.1218951` | `piccadillyCircusContextOverpass.json` | 8,245 | 7,904,231 bytes |
| Waterloo | `51.502404, -0.1261758, 51.515128, -0.0937449` | `waterlooBridgeContextOverpass.json` | 9,875 | 12,635,043 bytes |
| King’s Cross / Euston | `51.52325, -0.1425, 51.53525, -0.10975` | `kingsCrossEustonContextOverpass.json` | 7,588 | 8,365,606 bytes |
| One-way / restriction | `51.5168937, -0.1428499, 51.5292981, -0.1125334` | `oneWaySystemAreaContextOverpass.json` | 12,889 | 12,226,552 bytes |
| Quiet residential | `51.5527549, -0.2131413, 51.5723187, -0.1812709` | `quietResidentialRoadsContextOverpass.json` | 5,994 | 8,551,832 bytes |

King’s Cross / Euston optional `barrier=*` was skipped after Overpass returned
429, timeout, 504 and endpoint fetch failures. Buildings, land/water,
transport/place, amenities, tourism/history, shops and offices completed.

## Adapted And Rendered Counts

Route graph counts stayed unchanged. The supplement merge de-duplicates by OSM
`type:id`, keeps the original route fixture for route conversion and preflights,
and exposes the merged data only to visual context, landmarks, labels and
background rendering.

| Fixture | Route roads | Buildings before / after | Land-use before / after | Parks before / after | Water before / after | Rendered buildings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Piccadilly | 905 | 9 / 2,458 | 0 / 110 | 3 / 19 | 2 / 5 | 2,439 |
| Waterloo | 2,147 | 15 / 2,283 | 0 / 147 | 60 / 171 | 13 / 21 | 2,244 |
| King’s Cross / Euston | 7,838 | 58 / 3,637 | 128 / 234 | 259 / 270 | 14 / 12 | 3,613 |
| One-way / restriction | 2,662 | 11 / 4,458 | 0 / 219 | 49 / 157 | 2 / 4 | 4,411 |
| Quiet residential | 1,259 | 3 / 4,302 | 0 / 73 | 19 / 128 | 4 / 22 | 4,297 |

Renderer-consumed supplementary context also includes institutions, compact
public/transport symbols and pedestrian/land-use areas where source geometry is
complete and supported. Victoria is intentionally unchanged and remains the
Stage 8.8.2 benchmark.

## Visual Evidence

Stage 8.11 deterministic evidence was regenerated after the supplements were
wired. Screenshots remain under `docs/phase-8/screenshots/stage-8-11/`:

| Screenshot | SHA-256 |
| --- | --- |
| `victoria-neutral-desktop.png` | `b52ab03fe47497250ccd3883bdcce1521faaaffa21cddf20316ed83b2100fd06` |
| `kings-cross-correct-review-desktop.png` | `15e16de5c194b055974e0c7a50e3eb4d057d36ffef172327b5d307ecffd0eafc` |
| `piccadilly-active-route-desktop.png` | `32e639a12f7c75c754959d9610ce29b51b04bb30411f4a74d6406c7e27c8017e` |
| `waterloo-context-tablet.png` | `ee6a25537541b1cabc0f268b703a9f0a2bf486b179116d7eeb2f9bebc749b726` |
| `waterloo-incorrect-review-mobile.png` | `4454e9703635e9e7ae6ffe301d752bbabcb9eaa9b96712c535068319caf729ba` |
| `piccadilly-hint-mobile.png` | `8eec738e244f9beddaf3838c201c7a7df7b9ea748078b38b7f62d6e18399ae6e` |
| `quiet-residential-mobile.png` | `1288bc1b4996ce55db61a60e07cc4f4f351558c4f61ee8d7f9dede333b62c4be` |

Normal-size inspection found Piccadilly, Waterloo and quiet residential visibly
closer to the v2 master’s dense atlas fabric. King’s Cross / Euston remains
visually dense while retaining the A501/A4200 road-reference and submitted
review alignment. Quiet residential is denser than before but still quieter than
central London. Learner routes, markers, hints, review panels, restrictions,
attribution, pan/zoom framing and reset behavior remain above and aligned with
the base map.

The visual comparator now accepts exact byte matches or tiny PNG antialias
variance only. The retained repeat comparison had five exact screenshot matches,
Piccadilly active route at 5 differing pixels and Victoria neutral at 4
differing pixels, both with maximum combined channel delta of 2.

## Validation

Final Stage 8.8.3 validation completed on 15 July 2026:

- `npm.cmd run lint`: passed.
- `npm.cmd run test:map`: 1,230 passed, 0 failed, 0 skipped.
- `npm.cmd test`: all required constituent suites passed, 0 failed and 0 skipped.
- `npm.cmd run build`: passed after moving large visual context supplements out
  of the client/type-check import path and behind the selected-map runtime
  context-supplement endpoint.
- `npm.cmd run map:visual:compare:phase8 -- docs/phase-8/screenshots/stage-8-11 .tmp/stage-8-11-repeat`:
  passed.
- `npm.cmd run map:qa:phase8-owner-review`: passed.
- `git diff --check`: passed.

## Preserved Non-Goals

Stage 8.8.3 does not change route generation, legality, matching, snapping,
scoring, turn restrictions, learner progress, hints, submission/review behavior,
authentication, deployment, mobile QA toolbar behavior, or the approved visual
masters. The supplements are not beta map options, not scoreable route sources,
and not a Phase 8 completion declaration.

Owner visual acceptance and physical touch-device QA remain outside this stage.
