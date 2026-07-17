# Phase 6: Real London Learner Map and Cartography

Status: Complete

Phase 6 matured the first-generation Real London learner map after the Phase 5
route engine became beta-ready. It improved hierarchy, labels, context,
restrictions, learner overlays, responsive interaction, performance, visual
regression, and curated OSM fixture behaviour without changing route legality
or scoring rules.

## Steps

| Stage | Brief description | Status |
| --- | --- | --- |
| 141 | Define the Real London map styling acceptance contract. | Complete |
| 142 | Audit the existing map style and establish central cartography tokens. | Complete |
| 144 | Strengthen the major, secondary, and local road hierarchy. | Complete |
| 145-145.5 | Improve street-label typography, joins, casings, and dense geometry. | Complete |
| 146 | Add broader deterministic road and context label placement. | Complete |
| 147 | Add zoom-based decluttering and legal-restriction cartography. | Complete |
| 148 | Improve rail, station, park, water, and landmark context. | Complete |
| 149-150.5 | Improve orientation, one-way/restriction symbols, and context-coverage auditing. | Complete |
| 151 | Add a synthetic full-stack visual-QA scenario. | Complete |
| 152-152.5 | Add deterministic comparison fixtures and route-review styling tokens. | Complete |
| 153 | Unify start, destination, checkpoint, hint, and review overlays. | Complete |
| 154-155 | Integrate and formally audit the complete Phase 6 visual stack. | Complete |
| 156 | Improve phone/tablet layouts, touch targets, and responsive fixtures. | Complete |
| 157 | Add a map-rendering performance budget and cache static work. | Complete |
| 158-158.5 | Add release-candidate visual regression and fix mobile pinch zoom. | Complete |
| 159 | Close the Phase 6 readiness gate. | Complete |
| 160-160.5 | Add the TOPOPASS street-atlas identity pass and curated OSM context enrichment. | Complete |
| 161-161.4.1 | Refine curated fixtures and fix submitted-route matching/routability regressions. | Complete |
| 161.5 and 161.7 | Correct Waterloo/Thames water, rail, road, label, and viewport presentation. | Complete |
| 161.6 series | Polish learner beta layout, controls, zoom, markers, route choice, feedback, and mobile sizing. | Complete |
| 161.8 series | Add a dev-only Central London stress fixture and a lazy-loaded, budgeted King's Cross/Euston beta map. | Complete |

## Acceptance boundary

Phase 6 established the first-generation learner-map system. Phase 8 later
replaced its appearance target with the denser examination-atlas design while
protecting Phase 6 interaction, overlay, attribution, responsive, and
performance behaviour.

## Related documents

- [Map styling acceptance](phase-6-map-styling-acceptance.md)
- [Real London style audit](phase-6-real-london-map-style-audit.md)
- [Visual acceptance audit](phase-6-visual-acceptance-audit.md)
- [Curated fixture routability gate](phase-6-curated-fixture-routability-gate.md)
- [Map data guide](map-data.md)
- [Mobile and accessibility QA](mobile-accessibility-qa.md)
