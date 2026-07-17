# TopoPass Phase 10 Raw Feedback Register

Status: empty template

Purpose: preserve learner evidence before interpretation or backlog planning

## Register rule

The `Verbatim feedback` field is immutable after capture except for redacting
personal data. Corrections, interpretation, deduplication and decisions belong
in separate fields. Do not turn a comment into a solution request during
intake.

## Canonical field structure

| Field | Required | Values or format | Purpose |
| --- | --- | --- | --- |
| Feedback ID | Yes | `P10-FB-0001` | Stable reference used in decisions, commits and QA. |
| Captured at | Yes | ISO date/time with timezone | Establish sequence and beta context. |
| Source | Yes | Interview, observation, support, survey, analytics, QA, owner review | Distinguish reported and observed evidence. |
| Source reference | When available | Session, ticket, file or evidence link | Locate the original evidence without copying personal data. |
| Participant ID | When available | Anonymous research ID | Connect related comments without storing a name. |
| Learner segment | Yes | New, returning, pre-assessment, retaking, trainer, admin, unknown | Identify who experienced the issue. |
| Sign-in state | Yes | Signed out, signed in, auth unavailable, unknown | Protect current local/account behaviour distinctions. |
| Journey | Yes | Public, Topographical, SERU, Cross-app, Account, Admin | Place feedback in the target IA. |
| Mode | Yes | Learn, Focused practice, Training Mode, Exam Mode, Mock Test, Review, Progress, N/A | Separate subject from interaction mode. |
| Route or screen | Yes | Path plus screen/state | Make the feedback reproducible. |
| Task context | Yes | What the learner was trying to complete | Avoid interpreting isolated comments without intent. |
| Device and browser | When relevant | Viewport, device, OS, browser, zoom, orientation | Required for responsive, touch and accessibility items. |
| Assistive technology | When relevant | Keyboard, screen reader, magnification, voice, switch, forced colours | Required for accessibility evidence. |
| Verbatim feedback | Yes | Exact words, with personal data redacted | Preserve raw learner evidence. |
| Observed behaviour | When observed | Neutral description of actions and outcome | Separate behaviour from what the participant said. |
| Evidence | When available | Screenshot, recording timestamp, log or reproduction | Support validation without changing the raw comment. |
| Feedback type | Yes | Comprehension, navigation, content, visual, responsive, accessibility, performance, defect, trust | Support triage. |
| Map touchpoint | Yes | None, visibility, controls, overlays, responsive, rendering | Enforce the Phase 8 scope boundary. |
| Protected-system risk | Yes | None, map logic, route scoring, Exam Mode, progress storage, authentication, admin, deployment | Flag work that Phase 10 cannot absorb casually. |
| Impact | Yes | Blocked, severe friction, moderate friction, minor friction, positive | Describe task impact rather than implementation effort. |
| Frequency | Yes | One-off, repeated, common, unknown, plus count | Keep repeated evidence visible. |
| Confidence | Yes | High, medium, low | Reflect evidence quality and reproducibility. |
| Accessibility flag | Yes | Yes, no, unknown | Ensure access barriers are not averaged into general feedback. |
| Duplicate of | When applicable | Feedback ID | Preserve the occurrence while linking related evidence. |
| Product interpretation | After triage | Short problem statement | Derived view, kept separate from the raw comment. |
| Proposed response | After triage | Investigate, content, layout, defect, defer, no action | Classify response without preselecting a solution. |
| Decision reason | After decision | Evidence and boundary-based explanation | Make deferrals and rejections auditable. |
| Priority | After triage | P0, P1, P2, P3 | Order by learner harm, frequency and confidence. |
| Owner | After triage | Named role or owner | Assign responsibility. |
| Status | Yes | New, triaged, needs evidence, planned, validating, resolved, deferred, duplicate, no action | Track lifecycle. |
| Target stage | After planning | Phase 10 stage or later phase | Prevent scope drift. |
| Acceptance check | Before implementation | Observable pass/fail statement | Connect evidence to validation. |
| Outcome evidence | At closure | Test, screenshot, session or release reference | Close the loop without rewriting history. |

## Working register

Keep the working view compact. The canonical fields above may live in a
spreadsheet or issue system when volume grows, but the same field meanings
must be preserved.

| ID | Captured | Journey / mode | Route / task | Participant / device | Verbatim feedback | Observation / evidence | Impact / frequency | Map / protected risk | Interpretation / decision | Status / owner / stage | Acceptance / outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |

## Triage sequence

1. Redact personal data without paraphrasing the evidence.
2. Confirm subject, mode, route, task and state.
3. Reproduce where possible and attach evidence.
4. Classify map touchpoint and protected-system risk before discussing a fix.
5. Link duplicates while preserving every occurrence and frequency count.
6. Write the product interpretation in problem language.
7. Set priority using impact, frequency, confidence and accessibility harm.
8. Assign a target stage only after the acceptance check is measurable.

## Priority guide

| Priority | Use when |
| --- | --- |
| P0 | A safety, privacy, access-control or destructive-data issue blocks release. Phase 10 UI work pauses for the appropriate owner. |
| P1 | A learner cannot complete a primary journey, cannot access essential content, or loses essential atlas/exam controls. |
| P2 | A repeated issue creates substantial confusion or friction but has a workable recovery. |
| P3 | A minor, isolated or primarily cosmetic issue has low task impact. |

Accessibility barriers may be P0 or P1 even when frequency is unknown. A
single learner being blocked is not made low priority by a small sample.

## Phase 8 and Phase 9 handling

- `Map touchpoint = rendering` is outside the default Phase 10 scope and
  requires explicit owner review against Phase 8 acceptance.
- `visibility`, `controls`, `overlays` and `responsive` may enter Phase 10 only
  as layout issues and must carry the Phase 8 visual and interaction gates.
- Any item touching Exam Mode rules, scoring, submission locking, feedback
  timing, route pack, progress schema or readiness calculation is a protected
  Phase 9 item. Phase 10 may improve entry framing and surrounding layout, not
  the behaviour itself.

## Minimum evidence set for Phase 10.1

Collect feedback across:

- new and returning London private-hire learners;
- Topographical and SERU entry comprehension;
- Training Mode versus Exam Mode comprehension;
- desktop, mobile portrait and mobile landscape;
- active atlas attempts, hints, submission and post-submit review;
- SERU handbook, English, reading and mock-test sessions;
- signed-out local practice and signed-in account use;
- keyboard, screen reader, zoom/reflow and physical touch-device use.
