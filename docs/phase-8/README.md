# Phase 8: Examination Atlas Cartography Redesign

Phase 8 changes the Real London map visual target from the first-generation
Phase 6 learner map into a denser printed examination-atlas style suitable for
TfL-style private-hire route-planning practice.

The educational purpose is independent map reading and route planning. Phase 8
must make learners practise scanning dense London examination mapping. It must
not train learners to follow a consumer turn-by-turn navigation interface.

## Controlling Visual Reference

The revised controlling Phase 8 visual master for Stage 8.8.2 and later
base-map visual alignment is:

`docs/phase-8/references/phase-8-approved-exam-atlas-visual-master-v2.png`

The original Phase 8 visual master remains preserved at:

`docs/phase-8/references/phase-8-approved-exam-atlas-visual-master.png`

These references control cartographic appearance only. They are not geography
source. Production roads, names, references, restrictions, buildings, stations,
estates, landmarks, public facilities, parks, water, and other geography must
come from permitted and attributed data. OSM-derived rendered data must keep
OpenStreetMap attribution visible.

The production implementation must remain original to TOPOPASS. Later Phase 8
work may study the approved visual master for the intended family of marks,
colour relationships, density, hierarchy, and label behaviour, but must not copy
or treat generated content in the image as authoritative geography.

## Non-Regression Requirements

Phase 5 Real London routing, legality, matching, snapping, scoring,
restrictions, and beta-readiness gates must not regress.

Phase 6 map rendering foundations, road hierarchy, labels, context layers,
learner overlays, route-review overlays, zoom behaviour, mobile interaction,
performance budgets, OSM attribution, and visual-QA infrastructure must not
regress while the visual target changes.

Phase 7 is paused, not complete. Its existing training, route generation,
validation, scoring, hints, feedback, progress, curated learner routes, and
route-management behaviour must keep their current status and must not be
weakened by Phase 8 visual setup work.

## Planned Stages

This sequence is the Phase 8 starting plan. It is not irreversible. Later
stages may be split if implementation audit shows that a stage is too large.

1. Stage 8.1: Visual-master lock and baseline setup. Completed.
2. Stage 8.2: Existing geographic and render-data coverage audit. Completed.
3. Stage 8.3: Atlas render-data adapter for buildings, land use, institutions,
   places, transport context and road references. Completed.
4. Stage 8.4: Printed-atlas road hierarchy and major-road corridor system.
   Implemented; manual visual acceptance pending.
5. Stage 8.5: Atlas label density and place-name pass. Completed.
6. Stage 8.6: Buildings, built-up fabric, institutional areas, parks and water.
   Completed.
7. Stage 8.7: Compact original symbols and road-reference refinement.
   Completed.
8. Stage 8.8: Principal examination-atlas scale and information-density rules.
   Completed.
   Stage 8.8.1 is the principal-scale near-master visual-acceptance correction.
   Completed and visually accepted.
   Stage 8.8.2 is the revised visual-master base-map alignment pass.
   Completed and visually accepted.
9. Stage 8.9: Learner-route, marker, hint and review-overlay rebalance.
   Completed and visually accepted.
10. Stage 8.10: Mobile, tablet, accessibility and performance pass.
11. Stage 8.11: Deterministic visual-regression fixtures and screenshot
    evidence.
12. Stage 8.12: Final visual, functional, responsive, performance, accuracy and
    originality acceptance gate.

## Current Status

Stages 8.1 through 8.3 are complete. Stages 8.4 and 8.5 are implemented in the production
renderer with typed road-hierarchy tokens, flat-yellow principal corridors,
dark casings, deterministic pass order, split-segment continuity metadata, and
bounded semantic zoom scaling. Stage 8.5 adds typed source-backed label
candidates, denser road-name placement, large district names, red A/B
references, place labels, deterministic collision rules, and category coverage
diagnostics. Stage 8.5 visual QA is accepted with committed desktop and mobile
screenshots. Stage 8.6 now renders source-backed buildings, institutional
areas, land use, parks and water with deterministic layer order, inner-ring
holes, viewport filtering and bounded semantic zoom. Its desktop/mobile visual
QA and full local validation are complete. Stage 8.4's independent manual
visual acceptance remains pending. Stage 8.7 now has a typed source-backed
symbol pipeline, original compact marks, deterministic coordinated symbol and
label placement, and class-aware A/B reference placement. Its focused visual-QA
correction strengthens genuine references and compact marks, selects distinct
references before controlled repeats, and suppresses clipped edge candidates.
Production evidence covers the required fixtures, zoom tiers, active learner
route and submitted correct/incorrect review states at desktop and mobile
sizes. Stage 8.8 adds a
lazy-loaded, source-backed Victoria / Westminster / Vauxhall visual-QA
benchmark and reusable principal-scale density rules. Stage 8.8.1 corrects its
manual acceptance failure by tightening the principal extent, admitting the
available building/context data at displayed 100%, darkening compact labels,
strengthening building fabric, symbols and flat-yellow road hierarchy, and
adding placement rejection diagnostics. Desktop, tablet and mobile map
evidence is materially closer to the approved master. Required active-route
and submitted passing/incorrect review evidence is complete at desktop and
mobile sizes. Stage 8.8.2 adopts the revised ChatGPT-generated appearance-only
visual master as the controlling base-map reference, widens the Victoria
principal reset to include Lambeth and Kennington context, strengthens the
yellow/orange road hierarchy, darkens casings, increases compact local labels,
preserves red A/B references and adds richer source-backed symbols without
changing source geography or overlays. The benchmark remains dev-only,
unscoreable and absent from learner beta map catalogues. Stage 8.9 now uses
typed learner/review route and marker tokens, compact visible markers with
separate interaction targets, deterministic overlay ownership and a stable
drawing order. Learner-facing active and submitted states suppress pipeline
diagnostics that competed with the route and atlas geography. Desktop and
mobile evidence covers active, correct, incorrect, mistake and hint states at
displayed 100%.

## Documents

- [Phase 8 cartography acceptance](phase-8-cartography-acceptance.md)
- [Phase 8 baseline audit](phase-8-baseline-audit.md)
- [Phase 8 geographic render-data audit](phase-8-geographic-render-data-audit.md)
- [Stage 8.3 render-data adapter](stage-8-3-render-data-adapter.md)
- [Stage 8.4 printed-atlas road hierarchy](stage-8-4-printed-atlas-road-hierarchy.md)
- [Stage 8.5 atlas label density](stage-8-5-atlas-label-density.md)
- [Stage 8.6 built-up context](stage-8-6-built-up-context.md)
- [Stage 8.7 compact symbols and road references](stage-8-7-compact-symbols-road-references.md)
- [Stage 8.8 principal scale and density](stage-8-8-principal-scale-and-density.md)
- [Stage 8.8.1 near-master visual correction](stage-8-8-1-visual-acceptance-correction.md)
- [Stage 8.8.2 revised visual-master alignment](stage-8-8-2-revised-visual-master-alignment.md)
- [Stage 8.9 learner and review overlay rebalance](stage-8-9-learner-review-overlay-rebalance.md)
- [Phase 8 visual QA plan](phase-8-visual-qa-plan.md)
