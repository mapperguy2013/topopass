# Phase 8: Examination Atlas Cartography Redesign

Phase 8 changes the Real London map visual target from the first-generation
Phase 6 learner map into a denser printed examination-atlas style suitable for
TfL-style private-hire route-planning practice.

The educational purpose is independent map reading and route planning. Phase 8
must make learners practise scanning dense London examination mapping. It must
not train learners to follow a consumer turn-by-turn navigation interface.

## Controlling Visual Reference

The controlling Phase 8 visual master is:

`docs/phase-8/references/phase-8-approved-exam-atlas-visual-master.png`

The reference controls cartographic appearance only. It is not a geography
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
   places, transport context and road references.
4. Stage 8.4: Printed-atlas road hierarchy and major-road corridor system.
5. Stage 8.5: Buildings, built-up fabric, institutional areas, parks and water.
6. Stage 8.6: Compact atlas typography and dense road-label placement.
7. Stage 8.7: Road references and compact original symbols.
8. Stage 8.8: Principal examination-atlas scale and information-density rules.
9. Stage 8.9: Learner-route, marker, hint and review-overlay rebalance.
10. Stage 8.10: Mobile, tablet, accessibility and performance pass.
11. Stage 8.11: Deterministic visual-regression fixtures and screenshot
    evidence.
12. Stage 8.12: Final visual, functional, responsive, performance, accuracy and
    originality acceptance gate.

## Current Status

Stage 8.1 is complete as documentation and inspection only. Stage 8.2 is
complete as deterministic audit code, tests, command output, and evidence
documentation. The next stage is Stage 8.3: atlas render-data adapter work for
buildings, land use, institutions, places, transport context, piers where
sourced, and genuine road references.

Stages 8.1 and 8.2 do not intentionally change production map rendering, road
colours, widths, label logic, OSM conversion, route generation, scoring, hints,
feedback, learner progress, or deployment.

## Documents

- [Phase 8 cartography acceptance](phase-8-cartography-acceptance.md)
- [Phase 8 baseline audit](phase-8-baseline-audit.md)
- [Phase 8 geographic render-data audit](phase-8-geographic-render-data-audit.md)
- [Phase 8 visual QA plan](phase-8-visual-qa-plan.md)
