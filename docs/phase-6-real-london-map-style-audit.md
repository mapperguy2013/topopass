# Phase 6 Real London Map Style Audit

Stage 142 audits the current Real London map rendering state and introduces
central TOPOPASS street-atlas style tokens. It is audit/tokenisation work only:
it does not intentionally redesign the map or change routing, scoring,
snapping, legality, exercise generation, beta gating, persistence, auth,
analytics, OSM conversion, map fixtures, production exposure, or Marlowe/default
map behavior.

This audit should be read with the Phase 6 acceptance contract in
[docs/phase-6-map-styling-acceptance.md](phase-6-map-styling-acceptance.md).

## Stage 160 TOPOPASS London Street Atlas Identity Pass

Stage 160 extends Phase 6 after the original Stage 159 readiness gate. It is a
cartographic refinement pass only: route logic, legality checks, scoring,
exercise generation, beta gates, feedback tooling, OSM conversion behaviour,
auth, subscriptions, product flow, and Phase 7 learning features are unchanged.

The pass strengthens the original TOPOPASS street-atlas identity without
copying A-Z, Google, OS, or any other proprietary map tiles, screenshots,
colours, icons, fonts, label placement, or cartographic artwork. The design
uses general street-atlas principles only: cased roads, clear hierarchy,
quiet land/context washes, readable label halos, and deterministic
decluttering.

Cartographic changes are central-token driven. The land background is calmer,
primary and secondary roads have warmer but less muddy casing/fill contrast,
local streets are slightly quieter, service/pedestrian/inactive roads recede
more at low zoom, major labels get stronger halos and wider repeat spacing,
minor/service labels require more zoom and screen length, context labels use
softer halos, water/park washes are clearer, rail/bridge context is restrained,
and station markers no longer share the same strong red as restriction and
review warnings.

The Stage 160 QA catalogue `STAGE_160_TOPOPASS_ATLAS_IDENTITY_FIXTURES` maps
the existing deterministic visual scenarios to the requested inspection areas:
dense central streets, major-road/side-street hierarchy, high street,
suburban estate, park edge, Thames-bridge-style crossing proxy, rail/station
heavy context, awkward junction, one-way system, learner review with mistakes,
and mobile viewport readability. The Thames entry is a fixture-backed
water/bridge proxy; no Thames feature or proprietary reference is invented.

## Stage 160.5 Curated Real London OSM Data Enrichment

Stage 160.5 keeps Phase 6 in visual/data-fixture scope. It adds a controlled
curated OSM enrichment script for small bounded Real London fixture zones and
does not change routing, legality checks, scoring, exercise generation, beta
gates, OSM conversion behaviour, feedback tooling, auth, subscriptions,
product flow, or Phase 7 learning features.

The source path is the committed local OSM-derived GeoJSON cache at
`public/maps/kings-cross-euston/osm-raw.geojson`. The script
`scripts/maps/enrich-curated-london-osm.ts` writes deterministic Overpass-like
fixture data to
`lib/map-engine/osm/fixtures/curatedLondonStage1605Overpass.json` using named
bounded zones, a tag whitelist, stable synthetic element ids, source metadata,
import timestamp metadata, and OSM attribution. It is a manual dev/test data
preparation tool; the app does not call Overpass at runtime.

The Stage 160.5 curated fixture currently audits as:

- Elements: `6,014`
- Ways: `1,111`
- Nodes: `4,903`
- Road-class ways: `671`
- Named road ways: `609`
- One-way tagged ways: `346`
- Access-restriction tagged ways: `143`
- Bridge tagged ways: `13`
- Tunnel tagged ways: `11`
- Rail features: `387`
- Station features: `12`
- Park/open-space features: `26`
- Water features: `7`
- Landmark-like features: `2`
- Area-name candidates: `1`
- Public-building features: `1`
- Turn-restriction relations: `0`
- Crossing features: `0`
- Traffic-signal features: `0`

The intended render category audit covers `majorRoad`, `secondaryRoad`,
`localRoad`, `serviceRoad`, `nonDrivingPath`, `bridgeRoad`, `tunnelRoad`,
`oneWaySegment`, `restrictedTurn`, `park`, `water`, `rail`, `station`,
`landmark`, `areaLabel`, and `learnerOverlay`. The current fixture has no
turn-restriction relations and no learner overlay data because it is base-map
OSM fixture data only.

Known limitations: the local cached extract is central/north-central London,
not all London; the defined Thames bridge zone needs a wider future cached
source; crossings and traffic signals are absent from the generated fixture;
and OSM access, maxspeed, lane, landmark, public-building, and restriction tags
depend on source coverage quality. Future broader coverage should use a
cached/offline OSM source such as a bounded Geofabrik-derived extract through
the same whitelist and fixture-output path rather than live runtime fetching.

Follow-up Stage 160.5 fixture ingestion adds four manual Overpass JSON exports
as committed dev-only map fixtures:

- `piccadillyCircusOverpass.json`: dense Central London readability, with
  3,855 nodes, 1,401 ways, 13 relations, 418 named road ways, 204 one-way ways,
  and 12 turn-restriction relations.
- `waterlooBridgeOverpass.json`: Thames/bridge/rail/station context, with
  14,286 nodes, 3,037 ways, 44 relations, 784 named road ways, 455 one-way
  ways, 41 turn-restriction relations, 14 water features, 89 rail features,
  and 3 stations.
- `oneWaySystemAreaOverpass.json`: one-way and restriction cartography, with
  9,635 nodes, 3,719 ways, 50 relations, 1,104 named road ways, 632 one-way
  ways, and 50 turn-restriction relations.
- `quietResidentialRoadsOverpass.json`: suburban learner-driver readability,
  with 2,859 nodes, 468 ways, 12 relations, 177 named road ways, 35 one-way
  ways, 19 park/open-space features, and 4 water features.

These fixtures are selectable in dev/visual QA through converted OSM map
options and fixed visual comparison scenarios. They preserve OSM attribution
and raw OSM-derived data boundaries. They do not overwrite
`realLondonPilotOverpass.json`, import all London, call Overpass at runtime,
copy proprietary map artwork, change route logic, change legality checks,
change scoring, or start Phase 7 learning features.

## Stage 161 TOPOPASS Atlas-Style Visual Refinement

Stage 161 uses the four manual curated Overpass fixtures as visual QA inputs
for a cartography tuning pass. The work is visual only and keeps TOPOPASS as an
original design. General printed London street-atlas principles are used as
inspiration, but no A-Z, Google, Apple, Ordnance Survey, proprietary tiles,
screenshots, colours, icons, typography, label placement, or cartographic
artwork are copied.

Implementation changes:

- Road tokens now give primary and secondary roads a calmer but clearer cased
  hierarchy, keep residential roads readable, and further quiet service,
  pedestrian, inactive, and restricted context roads.
- Normal atlas rendering no longer draws every route-graph node as a base-map
  dot. That graph-like marker layer is disabled by token, while matched-route
  nodes and the explicit OSM debug overlay remain available for diagnostics.
- Junction radii and low-zoom width/alpha multipliers reduce visual mud in
  dense Central London fixture views.
- Converted OSM road labels now use the total deterministic length of the
  named OSM road group for fit checks. The label point remains deterministic,
  but real street names are no longer hidden just because the OSM graph split a
  named way into short routing segments.
- Station, bridge, park, water, public-building, landmark, learner-reference,
  and area label thresholds are tuned to appear at useful learner zoom while
  overview zoom still keeps road labels sparse.
- Rail, bridge, one-way, and restriction overlay tokens are quieter so learner
  route lines, checkpoints, hints, and review warnings stay visually dominant.
- Waterloo-specific QA confirms Thames water context, Waterloo Bridge and
  Blackfriars Bridge bridge features, and the important road labels around the
  bridge corridor remain available.

The Stage 161 renderer test checks all four curated fixtures at a mobile-sized
learner viewport for real road hierarchy, background context, linear context,
landmark markers, visible road labels, visible context labels, and overview
decluttering. It also checks the Waterloo/Thames bridge corridor labels
directly.

## Stage 161.8 Central London Stress Fixture

Stage 161.8 adds `centralLondonOverpass.json` as a larger controlled
OSM-derived Central London fixture. The code id is `centralLondon`, and the
display label is `Central London curated OSM - Stress test`.

The fixture is used to test whether the map-engine, converted OSM graph,
renderer inputs, labels, overlays, desktop sizing, mobile layout, beta map
selector, and fixture diagnostics can tolerate a larger real London extract. It
contains 251,273 OSM elements, including 16,783 named road ways, 8,373 one-way
tagged ways, 1,032 raw turn-restriction relations, relation-backed water
multipolygons, rail/station context, parks, landmarks, bridges, and tunnels.

The converted graph succeeds but is not yet appropriate for scored beta
practice. Diagnostics report 67,216 routable nodes, 119,024 directed edges, 277
routable components, and a largest component of 62,152 nodes. A generated
perfect-route matching stress probe over approximately 6.5 km took about 80
seconds, so the fixture is registered as `visualQaOnly` with zero exercises.
This keeps larger-area visual QA available without weakening route matching,
legality checks, scoring, or exercise validation.

Stage 161.6.9 makes Central London visible in `/practice/real-london` again,
but only as an explicitly marked `Stress test / slow` preview. It remains
`devOnlyStressTest`, `visualQaOnly`, `betaPracticeAllowed=false`, and
`scoreable=false`; no scored exercises or Submit target are offered. The beta
catalogue uses a lightweight placeholder and lazy-loads the full fixture only
after selection, so the default learner page does not eagerly import the large
Overpass JSON. Known limitation before larger scripted imports: the engine can
convert and inspect this bounded extract, but learner-facing loading and scored
route matching need performance work before similarly large fixtures should be
offered as scored practice.

Future large imports should use controlled scripted import, simplification,
lazy loading, tiling, or a Geofabrik-based pipeline, and must pass fixture
budget checks before beta exposure.

## Stage 161.6.10 Beta Practice Cleanup and Submit

Stage 161.6.10 keeps the Real London beta page learner-facing while preserving
the dev route-runner toolchain. `/practice/real-london` now hides Converted
OSM QA, Real London Pilot QA, manual route input, graph and exercise QA
overlays, raw node/road/route graph IDs, blocked-way diagnostics, internal
fixture labels, and pipeline warning groups. Those diagnostics remain
available in `/dev/route-runner`.

Learner status text now uses plain route-attempt language such as "No route
drawn", "Ready to submit", and "Submitted"; OSM attribution stays visible in
the small map attribution area rather than the main status block. Submit is a
real attempt action: it is enabled only when a scoreable map, valid exercise,
and drawn route are ready, records the current drawn attempt, reveals the
score/review after successful matching and scoring, and shows a friendly
matching failure when the drawn route cannot be matched. Visual-only maps stay
preview-only and do not expose scored Submit or matching errors.

## Stage 161.6.11 Beta Header, Controls, and Feedback Simplification

Stage 161.6.11 removes the remaining dev-runner feel from
`/practice/real-london`. The beta page now relies on one route header for the
selected exercise and status badges; the separate page current-task card and
visible "Route map workspace" heading are removed from the learner-facing flow.
Submit appears once as the primary route-attempt action. Draw/Pan, Undo, Erase
route, and Reset view appear once in the map toolbar.

Erase route clears the drawing, submitted result, and matching/error messages
while preserving the selected map, selected exercise, current zoom/pan, and
current Draw/Pan mode. Reset view clears the attempt, resets the route view,
and returns to Draw mode without changing the selected map or exercise.

Post-submit feedback is consolidated into one Route feedback panel. The beta
UI hides duplicate drawn-score summaries, route replay controls, local attempt
IDs, raw OSM/graph/road IDs, fixture IDs, and technical per-leg labels. Those
details remain dev-only in `/dev/route-runner` or explicit dev QA mode.

## Stage 161.6.12 Learner-Facing Restriction Cartography

Stage 161.6.12 turns the beta restriction layer back on for
`/practice/real-london` and keeps it learner-facing. One-way arrows,
no-entry/blocked symbols, turn-ban symbols, restricted-road symbols, and
route-review issue symbols continue to use the existing zoom-aware
decluttering, alpha, scale, and collision rules. Beta learners get a single
`Show restrictions` / `Hide restrictions` toolbar toggle; dev-only Converted
OSM QA, graph overlays, node/segment IDs, manual route input, and raw
diagnostics remain hidden.

The legend now separates no-left-turn, no-right-turn, and no-U-turn entries
instead of presenting one generic restricted-turn item. It also labels
attempted route, correct route, start, checkpoint, destination, one-way,
no-entry, and restricted-road symbols with learner text and no raw OSM,
relation, way, node, road, or graph IDs.

Restriction data audit:

- Converted OSM beta maps expose one-way road geometry: pilot `202`,
  Piccadilly Circus `616`, Waterloo Bridge `905`, one-way system `919`, quiet
  residential `53`, and the current King's Cross placeholder `0`.
- Converted no-entry, road-closed, and prohibited-turn `MapRestriction` counts
  are currently `0` for those scored curated OSM maps.
- The raw curated Overpass files do contain richer source tags. Piccadilly has
  12 restriction relations, Waterloo 41, the one-way system 50, quiet
  residential 12, and King's Cross / Euston 112, plus access-restricted ways.

Known limitation: Stage 161.6.12 does not convert new OSM relation/access data
and does not invent restrictions. No-entry and turn-ban learner symbols appear
where existing converted `MapRestriction` data exists; otherwise the stage
documents the raw data gap for a later controlled conversion pass.

## Stage 161.6.13 Final Beta Practice UI Polish

Stage 161.6.13 reduces the final learner-facing repetition on
`/practice/real-london`. The beta page now uses one route-header instruction:
draw from the start marker to the destination marker, visit checkpoints in
order, and follow road restrictions. The map workspace no longer repeats
"Draw your route, then submit it for feedback", and it no longer shows a second
route-state badge. Pan mode still shows one contextual hint explaining how to
drag the map and return to Draw mode.

Route state is intentionally constrained to one learner badge: `Not started`,
`Drawing`, `Ready to submit`, or `Submitted`. The large Route feedback panel is
not rendered before Submit, so beta testers no longer see a large "No route
drawn" feedback card. After Submit, the existing review panel appears with
score, distance, extra distance, pass/fail state, legal feedback, and
learner-friendly restriction comments.

The in-map learner legend is collapsed by default, uses a smaller 144 px scroll
cap, and switches to the compact learner label set: Start, Destination,
Checkpoint, Your route, Correct route, Accepted alternative, Illegal / wrong
way, Missed checkpoint, One-way, No entry, Restricted turn, Major road,
Secondary road, Local street, Park / open space, Water, and Rail / station.
The full dev/QA legend and raw diagnostics remain outside the beta practice
surface.

## Stage 161.6.14 Modern Map-App Beta Practice UI Shell

Stage 161.6.14 keeps the TOPOPASS London street-atlas cartography intact but
refines the learner shell around it. `/practice/real-london` now treats the map
as the primary workspace, uses a compact route header above the map, keeps
Submit as the single primary route action, and keeps Draw/Pan, Undo, Erase
route, restriction visibility, and Reset view together in one floating map
toolbar.

Map and exercise selection are presented as a compact collapsible Route setup
panel rather than a large debug-style side panel. The Route feedback panel still
does not render before Submit, and after Submit it remains the single learner
feedback surface for pass/fail state, score, distance, shortest legal route,
extra distance, missed checkpoints, illegal movement feedback, and the current
coaching note. The map legend is treated as a compact collapsible layer/legend
control with learner language such as One-way, No entry, and Restricted turn.

This stage intentionally borrows only broad interaction expectations from
modern map apps: map-first layout, compact floating controls, collapsible
panels, and a simple route header. It does not use or copy Google, Apple, A-Z,
Ordnance Survey, or other proprietary cartographic styling, UI assets, icons,
fonts, colours, tiles, screenshots, or symbols. Dev QA controls, manual route
input, raw IDs, fixture filenames, and blocked-way diagnostics remain outside
the beta practice surface.

## Stage 161.8.3 King's Cross / Euston Beta Fixture Check

Stage 161.8.3 adds `kingsCrossEustonOverpass.json` as a controlled
OSM-derived beta fixture candidate for the King's Cross / Euston station area.
The code id is `kingsCrossEuston`, the display label is
`King's Cross / Euston curated OSM`, and route ids use
`osm-curated-kings-cross-euston`.

The fixture is 4,679,303 bytes with 25,746 OSM elements. It includes 1,977
named road ways, 1,002 one-way tagged ways, 112 raw turn-restriction
relations, 621 access-restricted ways, bridge and tunnel tags, water and park
context, 365 rail features, 11 station features, and station-area
landmark/amenity/place labels.

The conversion and render-preparation budget is acceptable for Phase 6 beta
practice: 6,963 road segments, 12,062 directed edges, 64 routable components,
a 5,390-node largest drivable component, 835 context features, and 649 label
candidates. Local probe timing was about 83 ms for conversion, 48 ms for graph
build, 24 ms for diagnostics, and 531 ms for label preparation.

The fixture is `betaPracticeAllowed=true` and `devOnlyStressTest=false`.
Three scored route exercises are registered and all pass preflight plus
synthetic perfect drawn-route matching/scoring at 100%. The main known
limitation is route length: generated safe routes are roughly 4.0-4.7 km
station-corridor exercises, not short local hops. Raw OSM turn restriction
relations remain source context until the converter exposes them as scored
route-engine restrictions.

## Stage 161.6.7 Consistent Exponential Zoom

Stage 161.6.7 changes the shared Real London route-runner viewport from
additive zoom steps to multiplicative/exponential zoom. Zoom buttons use the
central `stepRatio`, wheel and trackpad deltas use an exponential sensitivity,
and pinch zoom continues to use the two-finger distance ratio. The maximum zoom
is now 5000% (`50x`) for learner inspection, with the existing minimum overview
zoom preserved.

The audit rule is that all zoom paths preserve one isotropic map scale. Wheel
and pinch zoom should keep the cursor or pinch-centre map point stable where
possible, button zoom should use the viewport centre, and drawing, route
overlays, start/checkpoint/finish markers, labels, and submit matching must
remain aligned after high zoom. High zoom does not change fixture budgets or
force extra labels/features beyond the existing Phase 6 decluttering rules.

## Stage 161.6.8 Explicit Zoom-Adaptive Symbol Scaling

Stage 161.6.8 fixes the case where the exponential viewport zoom reached
5000% but road strokes and labels still felt close to their 100% screen-space
sizes. The renderer now passes the current route-runner zoom into the shared
cartographic scale helpers, so fixed-viewport high zoom still increases road
strokes, casings, street-label font sizes, label halos, context markers,
one-way/restriction symbols, snap hints, learner route drawing, and
start/checkpoint/finish markers.

The correction keeps geometry and symbol sizing separate. Map projection,
pan/zoom alignment, drawing coordinates, route matching, scoring, legality,
and fixture data are unchanged. Symbol scaling remains capped by
`zoom.cartographicScale` tokens: local roads and minor labels gain the most
high-zoom readability, major roads grow modestly, and learner overlays use
smaller caps so they remain above the base map without overpowering it.

## Stage 161.6.9 Zoom-Aware Road And Label Scaling

Stage 161.6.9 makes high zoom useful for learner inspection by scaling
cartographic symbols separately from geometry. The map still uses one
isotropic viewport transform, but road strokes, casings, street-label font
sizes, label halos, context markers, one-way arrows, and restriction icons now
receive capped damped multipliers from `zoom.cartographicScale` tokens.

The rule is intentionally asymmetric: major roads grow modestly so they keep
hierarchy without looking like learner route overlays, while local and service
roads gain more readability at high zoom. Minor-road labels scale more than
major-road labels and high-zoom thresholds relax enough for useful local
street labels to appear when collision filtering allows them. Restriction and
one-way symbols also scale at very high zoom, while route-review issue symbols
and learner overlays stay above the base map and do not lose priority.

High zoom therefore has two separate meanings: geometry zoom selects a closer
area, and cartographic symbol scaling makes that closer area readable. The
renderer must preserve drawing alignment, marker alignment, and submit
matching after zooming; it must not stretch X/Y differently or scale symbols
linearly to 5000%.

## Stage 161.6.8.1 Strong High-Zoom Road Scaling

Stage 161.6.8.1 tightens the high-zoom visual contract after the first
zoom-adaptive pass still felt too close to fixed screen-space styling. The
renderer continues to pass the explicit route-runner zoom into the shared
cartographic helpers, but the helpers now use capped power curves rather than
the earlier subtle logarithmic gain.

At 5000% (`50x`) zoom, normal drivable road strokes and casings target about
10x their 100% visual width. Service and restricted roads use lower caps, so
they become easier to draw against without overtaking primary, secondary, and
local streets. Labels use a separate capped scale of up to about 6x, with
halos and collision boxes derived from the scaled label size. Restriction
symbols and learner markers keep their own lower caps, and raw drawing/snap
affordances scale visually so high zoom gives learners a wider target.

This remains a Phase 6 readability-only change. Geometry zoom stays isotropic;
CSS/image stretching is not used; scoring, route matching, legality checks,
OSM conversion, fixture data, beta gates, feedback tooling, auth,
subscriptions, product flow, and Phase 7 scope are unchanged.

## Stage 161.6.8.2 Stronger High-Zoom Road Corridor Scaling

Stage 161.6.8.2 raises the high-zoom visual target after learner review still
found 2500%-5000% roads too narrow for comfortable drawing. The road scale curve
now uses a stronger capped semantic multiplier: major and secondary roads cap at
about 16x, local roads at about 17x, and service/restricted roads at about 9x so
minor access roads do not overpower the primary road hierarchy.

Labels use their own high-zoom curve and cap around 9x for road names, with
halo and collision boxes scaled from the same label multiplier. Stage 161.6.8.3
rebalances the overlay part of this rule: learner freehand/drawn-attempt strokes
now use a much lower cap, correct/expected route overlays use a moderate cap,
and mistake/review overlays plus review text use stronger caps for inspection.
Start/checkpoint/finish markers, restriction symbols, and one-way arrows keep
smaller caps so they remain readable without dominating junctions.

This is still a Phase 6 visual-readability refinement only. The map projection
remains isotropic; no CSS/image stretching is introduced; route matching,
scoring, legality checks, OSM data, runtime Overpass access, beta QA visibility,
and Phase 7 scope are unchanged.

## Stage 161.6.8.3 High-Zoom Overlay Balance

Stage 161.6.8.3 separates learner overlay scaling from base-road scaling after
the stronger high-zoom road pass made drawn attempt lines too visually heavy.
At 5000% zoom, base roads can still use the stronger road corridor caps, but
raw drawn routes and snap-preview strokes use a lower drawn-attempt cap so they
stay visible without hiding street labels, junctions, or mistake markers.

Correct/expected route overlays use a slightly stronger but still controlled
cap. Mistake overlays, matched-movement review lines, illegal-section
highlights, selected restriction focus, review issue markers, and route-review
callout text use stronger review-specific caps so learners can inspect exactly
what went wrong when zoomed in. Callout padding, border, connector width, and
font size scale together. Marker scaling is capped separately so
start/destination/checkpoint markers remain usable without covering review
feedback.

This remains visual-only. Exponential zoom, the 5000% maximum, map projection,
pinch/wheel anchors, route matching, scoring, legality checks, route
generation, OSM data, runtime Overpass access, beta QA visibility, and Phase 7
scope are unchanged.

## Stage 161.5 Waterloo / Thames Atlas Readability Correction

Stage 161.5 corrects the Waterloo Bridge / Blackfriars / Thames corridor after
visual screenshot review. The work stays Phase 6 visual-only and uses only the
committed OSM-derived fixture data.

Implementation changes:

- Existing closed water features render as more legible filled Thames context,
  and OSM waterway lines use a wider calm river corridor when polygon coverage
  is incomplete.
- Major base-road tokens are calmer and slightly narrower so Victoria
  Embankment, Strand, Waterloo Bridge, Blackfriars Bridge, Southwark Street,
  and Upper Thames Street remain readable without looking like learner routes.
- Residential/local roads gain slightly stronger low/medium-zoom visibility,
  while service/access roads remain quiet.
- Rail line opacity and station density are reduced near dense bridge context.
  Repeated rail/context labels are deduplicated before collision filtering, so
  repeated Thameslink labels no longer clutter the corridor.
- Destination marker halo/radius is reduced so the finish marker appears
  visually attached to the road/route rather than floating above it.

The Stage 161.5 renderer test checks Waterloo water polygons, widened waterway
corridor styling, bridge labels, key corridor road labels, deduplicated
Thameslink labels, the calmer major-road relationship to learner route tokens,
minor-road visibility, and destination marker attachment tokens.

## Stage 143 Styling Application

Stage 143 applies the first TOPOPASS street-atlas base map styling pass. The
canvas now uses a warmer paper-like land colour, OSM road hierarchy tokens have
stronger primary/secondary/local/service contrast, and Marlowe context colours
were moved into the same warmer atlas palette. The route, legality, scoring,
exercise, beta-gate, fixture, and OSM conversion behavior is unchanged.

The renderer can now draw non-routable OSM context polygons and lines directly
from a map option's raw Overpass fixture when those tags are present: parks,
gardens, open space, pedestrian areas, water polygons, waterway lines, and rail
lines render below roads and learner overlays. The current Real London pilot
fixtures remain road-only, so Stage 143 does not fabricate parks, water, rail,
stations, landmarks, or new roads for those maps.

## Stage 144 Road Hierarchy

Stage 144 strengthens the Real London road hierarchy only. The canvas renderer
now draws base-road casings in hierarchy order, then base-road fills in the
same order, so service, restricted, inactive, pedestrian, and local roads sit
below tertiary, secondary, and primary roads. Major and minor roads now use
more differentiated widths, casing colours, fill colours, opacity, and dash
treatments through the central TOPOPASS cartography tokens. Route overlays,
restriction symbols, hints, start/destination/checkpoint markers, review
overlays, snapping, scoring, legality, exercise generation, OSM conversion,
beta gating, feedback, and persistence are unchanged.

## Stage 145 Street Label Readability

Stage 145 makes street labels follow the strengthened road hierarchy without
changing routing behavior. Road-label typography now uses central TOPOPASS
tokens for major, secondary, minor, restricted, and service labels. The label
layout pass filters labels by viewport scale, road-segment screen length, text
fit, repeated-name spacing, and reserved screen areas around active route
overlays, snapped hints, review lines, checkpoints, starts, and destinations.
Converted OSM street labels are now allowed into the learner renderer, with the
decluttering pass deciding which labels are readable enough to draw.

## Stage 145.5 Junction Clarity

Stage 145.5 improves dense Real London road geometry only. Road render passes
are now explicit and deterministic: all hierarchy-sorted casings draw before
all hierarchy-sorted fills, using rounded caps, rounded joins, and small
same-colour endpoint blends to reduce graph-segment seams at junctions. Minor,
service, restricted, and inactive roads are thinned or quieted at low zoom so
primary, secondary, and tertiary roads remain visually dominant. Existing
matched and snap-preview road ids can draw a subtle selected/candidate focus
below labels and learner route overlays. Routing, snapping, scoring, legality,
exercise generation, OSM conversion, beta gating, feedback, and persistence are
unchanged.

## Stage 146 Label Rendering System

Stage 146 expands the learner Canvas label system beyond road labels while
leaving routing behavior unchanged. Labels now have explicit categories for
roads, stations, landmarks, parks, water, and general area/context names.
Category-specific TOPOPASS tokens define text size, colour, halo, collision
padding, priority, and zoom visibility. The same deterministic layout pass
handles road-aligned labels, repeated street-name spacing, collision winners,
reserved route/marker/review areas, and context-label decluttering.

Context labels are generated only from data the current visual model already
has: synthetic Marlowe background polygons and landmarks, converted OSM context
polygons/lines when a fixture contains supported tags, and map landmarks where
present. The current Real London pilot fixtures remain mostly road-only, so
Stage 146 adds hooks and tests for parks, water, rail-line context, stations,
and landmarks without inventing unavailable Real London places.

## Stage 147 Zoom And Restriction Decluttering

Stage 147 adds central zoom-decluttering rules and legal-restriction
cartography without changing routing, legality, scoring, exercise generation,
OSM conversion, beta behaviour, feedback, or persistence. Viewport scale now
maps to deterministic low, medium, and high detail tiers. Low zoom keeps major
roads, area orientation, route overlays, and route-review issue symbols
dominant while suppressing base one-way/restriction symbols. Medium zoom brings
back useful no-entry, restricted-road, prohibited-turn, and long-road one-way
symbols with reduced alpha/scale. High zoom reveals residential/local road
detail, one-way arrows, no-entry markers, restricted-road signs, and turn-ban
markers.

Restriction rendering continues to use only existing road restriction overlays,
turn restriction visuals, and route issue overlays. If turn-restriction render
data is unavailable, the restriction helper returns no visuals instead of
fabricating junction rules. Route-review issue symbols remain visible across
zoom tiers so one-way, no-entry, restricted-road, disconnected, and turn-rule
mistakes can still be explained visually.

## Stage 148 Landmarks Stations Bridges Rail And Area Context

Stage 148 strengthens non-routable London context rendering without changing
routing, legality, scoring, snapping, exercise generation, beta behaviour,
feedback, or persistence. Central TOPOPASS tokens now cover rail/crossing line
styles, bridge labels, context-line zoom alpha, station marker visibility, and
landmark marker visibility. Rail and bridge/crossing context lines fade or
filter by viewport scale, while station and landmark markers are filtered by
zoom and by the same reserved screen boxes used for learner route overlays,
hints, review issue lines, starts, checkpoints, and destinations.

Converted OSM maps can now draw bridge/crossing indicators from the selected
map option's raw committed Overpass fixture when supported tags are present:
`bridge=*` values other than `no`, or `man_made=bridge`, on highway ways. Named
bridges use `name` or `bridge:name` where available; unnamed bridge context can
draw without a fabricated label. Rail context supports `railway=rail`,
`railway=light_rail`, and `railway=subway` when those raw tags exist, but the
renderer does not create a separate Underground visual distinction because the
current visual model has no safe mode-specific styling contract. Missing raw
fixture data, unsupported tags, or unknown fields remain safe no-ops.

## Stage 149 Landmarks Area Names And Learner Overlay Readability

Stage 149 extends the same fixture-backed context model to named orientation
features without changing routing, legality, scoring, snapping, exercise
generation, beta behaviour, feedback, or persistence. The renderer now reads
supported named OSM nodes and closed ways from the selected committed raw
Overpass fixture for area labels, public buildings, open spaces, important
landmarks, learner-reference landmarks, and station markers. It also continues
to classify existing map landmarks into tokenised visual categories.

All new context categories use central TOPOPASS tokens for label typography,
priority, zoom visibility, marker visibility, collision padding, and reserved
learner-overlay avoidance. Route-review issue markers now use tokenised marker
radius, stroke, halo, and reservation padding, and exercise markers have a
separate reservation token so base-map labels do not crowd start, checkpoint,
destination, or review cues. Unnamed features, unsupported tags, and missing
fixture data are still ignored instead of creating inferred landmarks.

## Stage 150 One-Way And Restriction Cartography

Stage 150 improves learner-readable restriction cartography without changing
routing, legality, scoring, snapping, exercise generation, OSM conversion, beta
behaviour, feedback, or persistence. One-way arrows now use central TOPOPASS
tokens for halo styling, line width, decision-point ratios, minimum spacing,
and zoom-tier spacing multipliers. Long one-way segments place arrows closer to
meaningful decision ends instead of the segment centre, and medium zoom spaces
arrows more aggressively than high zoom.

Base restriction symbols now pass through a deterministic viewport collision
filter. The filter keeps route-review issue symbols visible across zoom tiers,
removes base symbols that would collide with learner route/hint/review/stop
reservations, and suppresses lower-priority overlapping base symbols. Symbols
near route-review issue locations receive higher collision priority so they can
help explain a learner mistake when they do not sit directly under the review
warning. Missing restriction overlays, turn visuals, or review issue data still
produce no symbols rather than inferred restrictions.

## Stage 149.5/150.5 Context Coverage Audit And Adapter

Stage 149.5/150.5 adds a fixture-only Real London context audit and a typed
normalisation adapter for context rendering. The audit is pure and
deterministic: it inspects committed Overpass-style fixture/source elements and
reports counts for rail, subway rail, stations, named stations, bridges, named
bridges, crossings, landmark-like features, park/open-space features, water,
named water, and area/context label candidates. It ignores malformed optional
fields and unsupported relation-style data instead of guessing.

The adapter converts supported fixture nodes and ways into render-ready context
features for rail, stations, bridges, crossings, landmarks, parks/open spaces,
water, pedestrian areas, and area labels. `syntheticStreetMapRenderer.ts` now
consumes that adapter for OSM context labels, landmark visuals, background
polygons, and linear context features, preserving the existing visual-only
behaviour. It returns no features when fixture data is absent, malformed, lacks
usable geometry, or belongs to a map without an OSM projection.

Earlier committed pilot fixture coverage is intentionally recorded as a
limitation:
`tinyLondonOverpass.json`, `realLondonPilotOverpass.json`,
`realLondonPilotTwoOverpass.json`, `mediumLondonOverpass.json`, and
`largeLondonOverpass.json` all audit to zero for the audited non-road context
categories. The benefit is a reliable coverage baseline and a single typed
adapter path for future fixture-backed context data; the renderer still does
not invent landmarks, stations, bridges, water, area names, or restrictions.
The later Stage 160.5 manual curated exports provide richer dev-only context
fixtures where the selected OSM data contains those tags.

## Stage 151 Visual QA And Objective Overlay Pass

Stage 151 adds a dev-only synthetic Phase 6 visual QA scenario under
`osm-phase-6-real-london-visual-qa`. The scenario is explicitly marked as
synthetic TOPOPASS QA fixture data, not real-world OSM data. It is registered
only for dev QA map selection and is filtered out of non-dev/student map
visibility and direct student map resolution.

The scenario gives reviewers one inspectable map that combines dense
London-like streets, major/secondary/residential/service hierarchy, a park,
water basin, canal, rail line, station, landmarks, an area label, a pedestrian
square, a one-way route, a prohibited-turn warning, route start/destination,
the first required via point, and checkpoints. This makes Phase 6 readability
easier to judge without relying on live APIs or inventing data inside the real
pilot fixtures.

Objective overlays now use stronger central tokens: start markers read
`START`, destination markers read `END`, the first intermediate objective uses
a `VIA` treatment, later checkpoints retain compact `CP` labels, optional snap
hints use quieter teal dashed styling with small haloed points, and
selected/matched route nodes now use tokenised halo and stroke styling. Canvas
draw order keeps optional hints and raw route strokes below objective markers
and stop labels, so learner-critical stops remain visible above context,
restrictions, one-way arrows, roads, and labels.

Known limitations remain: the QA scenario is synthetic and is for visual
inspection only; real pilot context still depends on committed fixture tags;
mobile visual QA still needs manual device review; and dense overlapping review
states may need future non-colour cues. This stage does not change routing,
legality, scoring, exercise generation, beta gates, feedback tooling, or OSM
conversion behaviour.

## Stage 152 Visual Comparison And Readability Fixtures

Stage 152 adds deterministic visual comparison fixture metadata for the Phase 6
Real London QA map. The comparison modes are `plain-route-graph`,
`phase-6-street-atlas`, `learner-route-overlay`, and
`route-review-readability`; they give reviewers controlled states for judging
the same London-like area before and after Phase 6 styling and with learner or
review overlays present.

The fixed scenario IDs are `dense-central-readability`,
`major-road-side-street-hierarchy`, `park-water-rail-station-context`,
`bridge-crossing-context`, `landmark-area-orientation`,
`learner-route-overlay-review`, and `one-way-restriction-declutter`. Each
scenario records a stable viewport, decluttering tier, comparison modes, and
expected rendered categories such as roads by hierarchy, labels, context
features, route overlays, start/destination/checkpoints, hints, one-way symbols,
and restriction/review-warning symbols.

The implementation is non-invasive fixture data plus regression tests. It does
not rewrite the renderer, add a map provider, expose comparison modes in the
main learner experience, alter routing, alter legality checks, change scoring,
change exercise generation, affect beta gates, modify feedback tooling, or
change OSM conversion. It also does not invent restrictions or landmarks in real
pilot fixtures; visibility still depends on fixture/source data.

## Stage 152.5 Route Review Overlay Styling

Stage 152.5 improves the visual language for learner route review. Attempted
routes now use a stronger orange cased learner line; correct/reference routes
use a quieter blue dashed line; accepted-alternative fixture support uses a teal
dotted line; illegal route segments use the most prominent red warning style;
inefficient and backtrack sections use softer amber and purple warning styles;
and checkpoint markers can show completed or missed review rings.

The canvas renderer now uses the central route overlay tokens for attempted and
correct route strokes, accounts for route casing in label reservation boxes, and
draws missed/completed checkpoint states from existing required-stop visit
status data. Route issue overlays remain deterministic and continue to draw
above attempted route geometry but below objective markers and selected review
focus callouts.

Stage 152 comparison fixtures now include accepted-alternative,
inefficient-section, and backtrack-section expected categories in the
route-review scenarios. These are visual QA categories only unless existing
review data supplies the classification. No accepted-alternative route-engine
behaviour, route-analysis logic, legality rule, scoring rule, exercise
generation, beta gate, feedback workflow, or OSM conversion behaviour is added
or changed.

## Stage 153 Learner Overlay Markers And Callouts

Stage 153 extends the Phase 6 cartography tokens with a learner overlay layer:
start/destination marker styles, required checkpoint and checkpoint marker
styles, checkpoint visual states, hint available/revealed states, next-road
suggestion styling, warning line styles, review callout styles, selected-focus
tokens, and an explicit intended canvas draw order.

The route-runner canvas now draws objective markers and missed/completed
checkpoint review rings from those learner overlay tokens. Hint preview paths
and snapped hint points also use learner overlay tokens so hints read as
assistance, not route errors. Review-critical restriction items keep their
existing issue symbols and gain compact callouts for learner explanation without
changing the underlying review, restriction, scoring, legality, exercise, beta,
feedback, or OSM conversion logic.

The Stage 152 comparison scenario metadata now records expected learner overlay
states such as start marker, destination marker, required checkpoint, checkpoint
state variants, hint available/revealed, next-road suggestion, wrong turn,
restricted manoeuvre, illegal segment, inefficient/backtrack callouts, accepted
alternative callout, checkpoint reached, route completed, and selected focus.
Those categories are visual QA metadata only; they do not create new fixture
restrictions or landmarks.

## Stage 154 Final Visual Integration Pass

Stage 154 audits the Phase 6 visual stack as a complete map system rather than
as individual layer changes. The fixed comparison metadata now exports
`FINAL_PHASE_6_REAL_LONDON_LAYER_STACK` and a
`complete-phase-6-stack-integration` scenario that represents land, water,
parks, rail, bridges, stations, landmarks, area names, road casing/fill
hierarchy, street labels, one-way arrows, restriction symbols, reference and
attempted routes, warning overlays, objective markers, checkpoints, hints,
review callouts, and selected/focused overlays.

The selected/focused review highlight now draws from
`TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.selectedFocus`, so the final
learner overlay drawn last uses the same central token family as markers,
hints, warnings, and callouts. Base restriction overlays are quiet by default in
student beta mode; route-review issue symbols and selected issue focus remain
available from existing review data after submission.

Stage 154.5 keeps the Real London practice screen map-first: the beta map
workspace has a taller preferred minimum, the instruction strip is less dense,
map control labels are shorter, and the beta practice screen model records
map-first layout, compact controls, and quiet base restriction overlays. These
layout changes are local presentation changes and do not alter route logic,
legality checks, scoring, exercise generation, beta gates, feedback tooling, or
OSM conversion.

Known limitations remain data-driven. The committed pilot fixtures may not
contain every useful landmark, bridge name, area label, restriction, hint, or
review state a real learner would benefit from. The QA fixture demonstrates the
visual system where those categories exist; it does not invent real pilot OSM
data or begin Phase 7 product-flow work.

## Stage 155 Visual Acceptance, Legend, And Attribution

Stage 155 adds the final visual acceptance record in
`docs/phase-6-visual-acceptance-audit.md`. The audit marks the Phase 6 map
styling as accepted with non-blocking visual limitations: dense high-zoom
side-street labels can still compete with review callouts, station and landmark
markers may need stronger distinction in later polish, and some bridge/context
or review states depend on committed fixture data.

The route-runner legend is now learner-facing rather than restriction-only. It
covers road hierarchy, one-way and restriction symbols, start/destination,
checkpoints, attempted/correct/accepted-alternative routes, illegal segments,
missed checkpoints, parks, water, rail, and stations. The legend is rendered as
a compact collapsed panel inside the map frame and reuses the existing legend
item model and TOPOPASS tone classes.

OSM attribution remains in the beta screen model and is additionally visible in
the lower-left of the map frame whenever the selected map option provides
attribution. The attribution sits away from the top-right drawing controls and
bottom-right zoom badge.

No route logic, legality checks, scoring, exercise generation, beta gates,
feedback tooling, OSM conversion behaviour, or route-engine behaviour changes
were made.

## Stage 156 Mobile And Tablet Readability

Stage 156 extends the Phase 6 visual audit to phone and tablet map use. The
student beta route map remains map-first, but the canvas controls now use
larger tap targets, touch/pen drawing prevents native page gestures while the
pointer is captured, and marker/review issue reservations account for
finger-sized targets before labels are placed.

The mobile behaviour is driven by `topopassCartographyStyle.ts` tokens:
minimum 44 px tap targets, compact control height, legend maximum height,
mobile/tablet map minimum heights, review issue hit radius, hint hit radius,
and callout minimum height. The Real London beta practice screen model records
the same contract for tests and future audit.

`realLondonVisualComparisonScenarios.ts` now also exports responsive visual QA
viewports and scenarios for small phone portrait, large phone portrait, phone
landscape, tablet portrait, tablet landscape, and a narrow embedded map. These
scenarios document the intended inspection states for mobile route drawing,
mobile review, one-way/restriction decluttering, marker/hint collision, and
tablet context orientation.

Known limitations remain data-driven. Stage 156 does not add device screenshot
automation, live OSM fetching, new restrictions, new landmarks, or route-engine
behaviour. Restrictions and context labels still depend on available committed
fixture data.

## Stage 157 Rendering Performance Budget

Stage 157 audits the Phase 6 renderer for repeated work during pan, zoom, route
drawing, and route review. It keeps the existing visual stack intact while
reducing unnecessary recalculation.

The main optimisation is moving static base-map candidate generation out of the
canvas draw pass. `RouteRunnerClient.tsx` now memoizes synthetic road visuals,
context features, landmark visuals, full map labels, and stop labels from the
current map/exercise/fixture inputs, then passes those candidates into the draw
loop. The draw loop still filters by the current viewport and reserved learner
overlay boxes, preserving zoom decluttering and collision behaviour.

`syntheticStreetMapRenderer.ts` now caches approximate label text widths and
parsed font sizes, and skips road label width calculations when zoom or road
length already hides the candidate. `restrictionMapVisuals.ts` can build
restriction visual candidates from a zoom tier, avoiding full restriction item
rebuilds when panning inside the same tier.

Work intentionally left uncached includes current viewport collision boxes,
route-draft overlays, review issue overlays, selected restriction focus, and
learner marker/callout reservations. Those are tied to live pan/zoom or attempt
state and must be recalculated to preserve Phase 6 readability.

Manual review should use Real London practice plus the Phase 6 visual QA
scenarios: inspect dense central labels, context layers, one-way/restriction
decluttering, route drawing, and route review while panning and zooming.

## Stage 158 Final Visual Regression Gate

Stage 158 adds the Phase 6 release-candidate visual QA gate. The change is
limited to fixture metadata, tests, and documentation for Real London
readability inspection; it does not alter routing, legality checks, scoring,
exercise generation, beta gates, feedback tooling, OSM conversion behaviour, or
route-engine behaviour.

`realLondonVisualComparisonScenarios.ts` now includes additional fixed
readability scenarios for low-zoom dense central streets, high-street/side
street hierarchy, estate and residential blocks, park/open-space edges, bridge
and river review, awkward junction restrictions, rail/station interchange
context, and high-zoom landmark/area labels.

The exported `phase-6-final-visual-rc-gate` records the required visual
contexts, low/medium/high decluttering tiers, responsive phone/tablet scenario
coverage, final Phase 6 layer stack, validation commands, behaviours to
preserve, and behaviours that must not change. This makes the release-candidate
check repeatable without introducing pixel-perfect screenshot infrastructure.

Known limitations remain data-driven. Stage 158 does not invent restrictions,
landmarks, stations, bridges, water, or area names. Those contexts render only
when the selected committed fixture supplies usable data. After lint,
`test:map`, build, and `git diff --check` pass, the Phase 6 map styling work is
ready for final learner-facing visual review.

## Stage 158.5 Mobile Pinch-Zoom Interaction

Stage 158.5 adds custom two-finger pinch handling to the route-runner canvas so
mobile learners can zoom the Real London map directly. The interaction layer
tracks active touch pointers, treats two touch/pen pointers as a pinch gesture,
cancels any active one-finger draft stroke when a second finger joins, and
applies the same clamped viewport zoom used by wheel and button zoom.

This preserves Phase 6 rendering behaviour: learner markers, route overlays,
review callouts, street labels, and zoom decluttering are redrawn from the
updated viewport. It also keeps one-finger drawing, pan mode, middle-mouse pan,
wheel zoom, zoom buttons, and route review behaviour separate from the pinch
gesture.

Manual QA should use a real phone on the Real London practice map: pinch out,
pinch in, pan, draw a route, verify pinch does not draw route points, and check
that start/destination/checkpoint markers plus labels remain aligned after
zooming. Automated coverage is unit-level because this project does not yet
have browser-level pinch screenshot automation.

## Stage 159 Phase 6 Readiness Gate

Stage 159 closes the Phase 6 Real London map styling audit. The final review
confirms that the current renderer, scenario metadata, responsive fixtures, and
documentation cover the completed Phase 6 visual scope: street-atlas base
styling, land/water/park context, road hierarchy, junction clarity, labels,
stations, landmarks, bridges, rail, area names, one-way and restriction
cartography, learner route overlays, hint/review callouts, legend,
attribution, mobile/tablet readability, and pinch-to-zoom usability.

The final draw stack remains token-driven and matches the exported
`FINAL_PHASE_6_REAL_LONDON_LAYER_STACK`. Base context draws below road casings
and fills, labels and context draw before restrictions, route/review overlays
draw above the base map, learner markers and callouts remain top-level
interaction aids, and attribution stays visible when OSM-derived data is in
use.

No Phase 7, routing, legality, scoring, exercise generation, beta gate,
feedback, OSM conversion, auth, subscription, or product-flow changes are part
of this gate. Remaining limitations are data and QA-infrastructure limits:
fixture-backed context appears only where committed data provides it, no
restrictions or landmarks are invented, and visual regression checks remain
scenario/configuration based until a future screenshot-baseline system exists.

With lint, `test:map`, build, and `git diff --check` passing, Phase 6 is ready
to close.

## Current Rendering Entry Points

- `app/practice/real-london/page.tsx` is the student-facing beta page. It
  mounts the shared route-runner client in student beta mode and keeps beta
  access behind `NEXT_PUBLIC_REAL_LONDON_BETA`.
- `app/practice/real-london/realLondonBetaPracticeScreen.ts` builds the
  student-facing screen model, legend, known limitations, attribution, exercise
  labels, and compact beta diagnostics.
- `app/dev/route-runner/RouteRunnerClient.tsx` owns the canvas rendering loop,
  map controls, route drawing interaction, route/review overlays, learner
  objective markers, hint overlays, compact review callouts, restriction
  overlays, mobile pinch-to-zoom handling, missed/completed checkpoint review
  markers, memoized base-map candidate inputs, OSM debug overlays, replay
  markers, and compact/dev panels.
- `app/dev/route-runner/syntheticStreetMapRenderer.ts` builds visual models for
  roads, OSM road hierarchy metadata, optional OSM road labels, synthetic
  parks/water/land blocks, fixture-derived OSM context where available,
  synthetic rail, landmarks, road/station/landmark/context labels, route
  overlays, and the route-runner legend.
- `app/dev/route-runner/realLondonContextData.ts` audits committed Real London
  context coverage and normalises fixture/source OSM context into typed
  render-ready features for the synthetic street-map renderer.
- `app/dev/route-runner/realLondonVisualQaScenario.ts` defines the dev-only
  synthetic Phase 6 visual QA scenario for combined readability inspection.
- `app/dev/route-runner/realLondonVisualComparisonScenarios.ts` defines the
  Stage 152 fixed visual comparison modes, viewports, expected readability
  categories, Stage 154 final Phase 6 layer-stack metadata, Stage 156
  responsive mobile/tablet visual QA viewports, and the Stage 158 final visual
  release-candidate gate for dev/test inspection.
- `docs/phase-6-visual-acceptance-audit.md` records the Stage 155 final visual
  acceptance scenarios, non-blocking remaining issues, and deferrals.
- `app/dev/route-runner/restrictionMapVisuals.ts` converts no-entry, one-way,
  restricted-road, prohibited-turn, illegal-movement, and missed-restriction
  data into map symbols and legend entries.
- `app/dev/route-runner/routeRunnerDisplay.ts` builds road restriction
  overlays, route issue overlays, required-stop review state, and pipeline
  display helpers.
- `app/dev/route-runner/mapViewport.ts` controls pan/zoom limits, wheel zoom,
  pan clamping, and screen-to-map viewport derivation.
- `app/dev/route-runner/routeRunnerMaps.ts` registers Marlowe, converted OSM,
  and Real London pilot map options. Real London maps use committed Overpass
  fixtures converted through the existing OSM pipeline.
- `lib/map-engine/osm/osmToRouteGraph.ts` preserves OSM highway, way id, and
  metadata that the renderer uses for visual hierarchy. Stage 142 does not
  change this conversion.
- `app/dev/route-runner/topopassCartographyStyle.ts` centralises the TOPOPASS
  cartography tokens, including the Stage 143 base-map colour and hierarchy
  changes.

## Current Layer Inventory

Current canvas layer order in `RouteRunnerClient.tsx` is:

1. Canvas background fill.
2. Synthetic background polygons for Marlowe and fixture-derived OSM context
   polygons where the selected fixture contains supported non-road tags.
3. Synthetic rail/context lines for Marlowe and fixture-derived OSM rail,
   subway, waterway, bridge, or crossing lines where available. Rail and
   bridge/crossing context uses central zoom alpha and visibility tokens.
4. Road casing visuals from `buildSyntheticRoadVisuals`, sorted by hierarchy.
   Real London roads are straight graph-segment lines derived from OSM route
   graph nodes.
5. Road casing junction blends at road segment endpoints, using the same
   hierarchy order and casing colours.
6. Road fill visuals from `buildSyntheticRoadVisuals`, sorted by hierarchy.
   Service, restricted, inactive, pedestrian, and local roads draw before
   tertiary, secondary, and primary roads.
7. Road fill junction blends at road segment endpoints, using the same
   hierarchy order and fill colours.
8. Selected/candidate road focus strokes for existing matched route and
   snap-preview road ids.
9. Station and landmark visuals from map landmarks plus named supported raw OSM
   fixture features, filtered by zoom and reserved learner-overlay areas.
10. Base labels. Synthetic and converted OSM road labels, stations, landmarks,
   public buildings, open spaces, learner-reference landmarks, parks, water,
   rail-line context, bridge/crossing names, and area names are filtered by
   category priority, zoom scale, road segment fit, repeated-name spacing,
   collisions, and reserved overlay/marker areas before drawing.
11. Road restriction overlays, when enabled. Their alpha is reduced at lower
   zoom tiers by central decluttering tokens.
12. OSM debug directed-edge overlays, when enabled.
13. Fastest/shortest legal route overlay, when revealed.
14. OSM exercise debug route and blocked-edge overlays, when enabled.
15. Matched attempted movement overlay from the drawn pipeline.
16. Route issue overlays for illegal, disconnected, prohibited-turn, and
    no-U-turn review state.
17. Restriction map symbols for one-way arrows, no-entry signs, restricted
    road signs, turn-ban signs, and route issue symbols. Base restriction
    symbols are filtered by zoom tier; route-review issue symbols remain visible.
18. Selected restriction/review focus highlight.
19. Small graph node dots.
20. Matched route node markers.
21. Exercise stop markers for start, destination, and checkpoints.
22. Exercise stop labels.
23. Snapped route preview line.
24. Raw drawn route strokes.
25. Snapped original-point dots.
26. Route replay markers.

## Current Styling Source Inventory

- `topopassCartographyStyle.ts` contains named tokens for current road colours,
  road casing colours, widths, road geometry, junction blends, road interaction
  focus, hierarchy-specific road label fonts/colours/halos, context label
  fonts/colours/halos, label visibility thresholds, label collision spacing,
  background features, rail, bridge/crossing context, station/landmark/context
  marker visibility, route overlays, exercise markers, hints, restrictions,
  review overlays, replay markers, node markers, zoom thresholds, and zoom
  decluttering thresholds for roads, labels, one-way arrows, restriction
  overlays, and restriction symbols.
- `syntheticStreetMapRenderer.ts` now reads road hierarchy, synthetic road
  styles, OSM road styles, background feature colours, rail styling, landmark
  styling, road/context label priorities, label visibility, and route overlay
  styles from the token object.
- `RouteRunnerClient.tsx` now reads active canvas map styling, exercise marker
  styling, label text/halo styling, restriction overlay/symbol styling, review
  overlay styling, fastest route styling, replay markers, node markers, raw
  route, and snap-preview values from the token object where extraction was
  safe.
- `restrictionMapVisuals.ts` now reads one-way arrow density thresholds from
  the token object.
- `mapViewport.ts` now reads route-runner zoom thresholds from the token object.
- Tailwind class names still control surrounding panels, forms, buttons,
  mobile layout, and non-canvas page chrome.
- OSM QA/debug overlay styles from `routeRunnerOsmDebug.ts` remain separate
  dev/debug styling and were not folded into the learner cartography token set
  in this stage.

## Road Style Handling

- OSM road hierarchy is derived from preserved `highway` metadata:
  `primary`, `secondary`, `tertiary`, `residential`, `service`, `pedestrian`,
  `inactive`, and `unknown`.
- `primary` roads render as the strongest warm yellow/orange roads with the
  widest casing and fill. Secondary and tertiary roads use progressively
  lighter warm treatments. Residential and unknown roads render as pale local
  streets with quieter grey casings. Service, pedestrian, restricted, and
  inactive roads render thinner and more subdued.
- At low zoom, residential and unknown roads are slightly thinned and quieted;
  service, pedestrian, restricted, and inactive roads are thinned or faded more
  aggressively. Primary, secondary, and tertiary hierarchy remains unchanged at
  those zoom levels.
- Junction clarity uses deterministic casing/fill passes plus same-colour
  endpoint blends, so graph-segment endpoints read more like continuous streets
  without modifying the route graph.
- Zoom decluttering thins and quiets minor road geometry at lower viewport
  scales and restores residential/local road detail at higher viewport scales.
- No-entry and road-closed restrictions override the general road class for
  visual modelling.
- Real London road geometry is graph-segment based, so long real-world OSM ways
  appear as multiple rendered segments. Group ids are used for one-way arrow
  decluttering on the same OSM way where available.

## Labels

- Real London/OSM road labels are learner-visible through the Stage 145
  hierarchy and decluttering pass instead of being limited to OSM QA/debug
  overlays.
- Major road labels use the strongest type treatment and lower visibility
  threshold. Secondary and tertiary labels are smaller. Minor street labels
  require more zoom and enough segment length. Service, restricted, and inactive
  labels are heavily limited.
- Station labels are stronger than generic landmark labels. Public-building,
  open-space, learner-reference, park, water, rail, bridge/crossing, and
  area/context labels are quieter and require enough zoom before they enter the
  collision pass.
- Labels are skipped when text would not fit the visible road segment, when the
  same road name was already placed nearby, when their category is below the
  current zoom threshold, or when their screen box intersects reserved route,
  hint, review, start, checkpoint, or destination areas.
- Synthetic Marlowe labels remain available for non-service roads, stations,
  landmarks, parks, water, area polygons, rail context, and exercise stops.
  Converted OSM context labels are available only where the selected fixture has
  supported raw tags, including named area features, public buildings, open
  spaces, important landmarks, learner-reference landmarks, parks, water,
  waterways, rail/subway lines, and named bridge/crossing ways.
- Stop labels are drawn after markers, keeping start/destination/checkpoint
  labels above the base map.

## Route and Learner Overlays

- Raw drawing is orange.
- Snapped preview is green dashed.
- Matched route and attempted movements are purple when matched and red when
  unresolved/illegal.
- The revealed shortest legal route is blue dashed with a white halo.
- Route issue overlays use red or rose styling, with dashed treatment for
  disconnected gaps.
- Start markers are green and labelled `START`; destinations are rose and
  labelled `END`; the first required intermediate objective uses a `VIA`
  marker; later checkpoints are orange `CP` markers. They draw above the base
  map, optional hints, raw route strokes, one-way arrows, restriction symbols,
  and context labels.
- Optional hints are represented by the snap preview, haloed snap points,
  correction panels, fastest-route reveal, and review text rather than a large
  dedicated hint layer.

## Restriction Cartography

- One-way arrows are generated from existing one-way road overlay geometry and
  continue to follow the road direction where direction data is available.
  Placement is deterministic, biased toward decision-point positions, and
  spaced by zoom tier on the same rendered road group.
- Low zoom hides base one-way, no-entry, restricted-road, and turn-ban symbols
  so the map does not become symbol-heavy. Route-review issue symbols remain
  visible even at low zoom.
- Medium zoom shows no-entry, restricted-road, prohibited-turn, and long one-way
  indicators with reduced alpha, scale, and wider one-way spacing.
- High zoom shows the full legal-restriction symbol layer, including one-way
  arrows, no-entry signs, restricted-road signs, and turn-ban signs where the
  current data already exposes them.
- Base restriction symbols are collision-filtered against each other and
  learner overlay reservations; route-review issue symbols are preserved.
- Road restriction overlay lines are not legal logic; they are visual hints
  derived from existing overlays and are faded at lower zoom tiers.
- Missing turn-restriction visual data is a safe no-op; the renderer does not
  invent banned turns or access rules.

## Restrictions and One-Way Rendering

- Road restriction overlays can show no-entry, one-way, and restricted-road
  line treatments.
- Restriction map symbols include red no-entry signs, blue one-way arrows,
  amber restricted-road diamonds, rose turn-ban symbols, and route issue
  symbols.
- Stage 150 one-way decluttering is active: arrows on the same rendered road
  group are spaced by at least 56 metres at high detail, medium detail uses a
  wider tokenised multiplier, and longer roads can receive two arrows.
- In student Real London beta mode, road restriction overlays are enabled and
  turn restriction overlays are collapsed/hidden by default outside internal QA
  surfaces.

## Context Features

- Synthetic Marlowe has parks, water, land-blocks, rail, landmarks, and area
  labels.
- Real London converted OSM maps can render OSM-derived parks, water, rail,
  subway, waterways, open-space context, bridge/crossing indicators, named area
  labels, public buildings, important landmarks, learner-reference landmarks,
  and station markers when the selected raw fixture includes those tags. If a
  fixture does not include those tags, the renderer returns no context feature
  instead of inventing one.
- OSM attribution is shown in the beta page and route-runner panels where
  OSM-derived Real London data is presented.

## Mobile and Zoom Behavior

- Mobile layout improvements from Phase 5 keep the student beta screen compact,
  collapse detailed instructions/limitations, and use a smaller mobile map
  height.
- Pan, zoom, draw, and scroll behavior are controlled by `mapViewport.ts` and
  `RouteRunnerClient.tsx`. The current zoom thresholds are default `1`, min
  `0.75`, max `10`, step `0.25`, and pan margin `80`.
- Base-map zoom decluttering now covers minor road quieting, road/context label
  thresholds, rail and bridge/crossing line visibility, station/landmark/context
  marker visibility, one-way arrow spacing, restriction symbol tiers,
  restriction-symbol collision filtering, and restriction overlay alpha.
- Repeated one-way arrows are thinned, road and context labels use category
  thresholds/collisions, and context markers avoid reserved learner overlay
  boxes.

## Current Strengths

- Real London route practice uses one shared route-runner canvas path, so dev
  and beta views share rendering, drawing, snapping, scoring, review, and QA
  overlay behavior.
- Road hierarchy metadata from OSM is preserved and already feeds visual road
  classes.
- Active learner overlays are generally drawn above base roads and context.
- Context labels and markers now reserve around route-review and exercise
  marker areas before drawing.
- Base restriction symbols now avoid learner overlay reservations and
  lower-priority symbol collisions while preserving route-review warnings.
- One-way arrows already have deterministic density suppression.
- Stage 151 adds a dev-only combined visual QA scenario so roads, labels,
  context, restrictions, objective markers, hints, and selected-route overlays
  can be judged together.
- OSM attribution is surfaced in the beta practice page and related panel
  models.
- Stage 142 centralises current style values into named tokens, making future
  changes easier to review against the Stage 141 checklist.

## Current Weaknesses Against Stage 141

- Road hierarchy: Stage 144 and Stage 145.5 distinguish major, secondary,
  residential, service, one-way, no-entry, restricted, inactive, and selected
  candidate roads with explicit pass ordering, junction blends, low-zoom
  quieting, and focus strokes. Future work still needs fully generalized
  cartographic generalisation for long OSM ways and merged multi-segment roads.
- Label readability: Stage 145 and Stage 146 add learner-visible OSM road
  labels plus station, landmark, park, water, rail-line, and area/context label
  hooks with hierarchy, zoom, fit, repeat, priority, collision, and
  reserved-area rules. Future work still needs full curved placement and richer
  collision handling for dense parallel roads.
- Zoom decluttering: road labels, minor road detail, one-way arrows,
  restriction overlays, and restriction symbols now respond to central
  decluttering tiers and collision rules. Some non-label context layers still
  have limited zoom behaviour.
- Parks/water/rail/stations/bridges/landmarks/area names: the renderer now has
  category-specific label and marker hooks for available named context data,
  but any individual Real London pilot map still depends on what its committed
  fixture actually contains.
- Learner overlays: start, destination, required via, checkpoint, route,
  optional hint, selected-node, restriction, and review overlays are visible
  above the base map, and base restriction symbols now avoid their
  reservations. Some meanings still rely on compact text and colour, so future
  manual QA should continue checking non-colour cues.
- Route review clarity: route review overlays and route issue symbols now stay
  visible through zoom decluttering and reserve label space, but overlapping
  route geometries and dense central London streets still need clearer
  non-colour cues and review-state composition.
- Mobile map usability: mobile layout is practical for beta testing, but dense
  map symbols and hidden labels limit learner orientation on small screens.
- Performance: current fixture-backed rendering is stable, but future labels
  and context layers will need explicit density and redraw checks.
- Attribution: attribution exists, but future overlay and mobile layout changes
  must continue to verify that it remains visible.

## Recommended Next Styling Stages

1. Add curved/along-road label placement and junction-name support once the
   base label hierarchy has been validated in learner QA.
2. Expand fixture coverage for broader non-road context where future committed
   OSM extracts safely include it.
3. Strengthen route review cartography with non-colour cues for missed,
   illegal, correct, and user-drawn sections.
4. Run a mobile-specific Real London readability pass after labels and context
   features exist.
5. Add performance checks for large Real London fixtures after any new
   label/context layer is introduced.

## Stage 142 Scope Confirmation

Stage 142 documents the current state and centralises existing style values.
Renderer values were migrated to tokens only where that was safe and intended
to preserve the current appearance. This stage does not intentionally redesign
the map, expose new Real London data, alter beta gating, or change any route
engine, scoring, snapping, legality, OSM conversion, fixture, persistence, auth,
analytics, production, or Marlowe/default behavior.
