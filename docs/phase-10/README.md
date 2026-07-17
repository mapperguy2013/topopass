# TopoPass Phase 10.0 Planning Pack

Status: planning only

Prepared: 16 July 2026

Production UI changes: none

## Purpose

Phase 10 should make TopoPass feel like a serious, guided learning platform for
London private-hire learners. The product must present two distinct learning
journeys:

- Topographical: London knowledge, map reading, route planning, Training Mode,
  Exam Mode, review, and readiness.
- SERU: PHV handbook knowledge, English, reading and understanding, focused
  practice, review, and SERU mock testing.

The primary Phase 10 product decision is that **Topographical and SERU are
subjects, while Training Mode and Exam Mode are modes inside the
Topographical route-planning journey**. A generic "Practice" destination must
not be the only way learners discover that structure.

## Locked foundations and scope boundaries

The following are fixed inputs to Phase 10 planning:

- Phase 8 atlas cartography is accepted and closed. Its base-map appearance,
  source-backed geography, labels, density, road hierarchy, symbols,
  attribution, learner overlays and review overlays are protected.
- Phase 9 Exam Mode is complete and beta-ready. Its active-attempt rules,
  timer, no-hint state, submission lock, deterministic scoring, review,
  route pack, local history and readiness model are protected.
- Map rendering is not a Phase 10 redesign target. It may be revisited only
  when a proposed layout changes map visibility, control reachability,
  overlay behaviour or responsive behaviour, and only to the minimum extent
  required to preserve those behaviours.
- Route generation, route validation, legality, matching, snapping, scoring,
  exam behaviour, progress storage, authentication, admin access and
  deployment logic are outside Phase 10's redesign scope.
- TopoPass remains independent and must not imply TfL affiliation,
  endorsement, official questions, certification or a pass prediction.

Controlling evidence:

- [Phase 8 final acceptance](../phase-8/stage-8-13-final-acceptance-and-closure.md)
- [Phase 9 beta readiness](../phase-9/stage-9-7-final-exam-simulation-qa-and-beta-readiness.md)
- [Phase 9 focused Exam Mode review](../phase-9/stage-9-6-1-focused-exam-review.md)

## Repository snapshot

The audit found 61 page routes and 60 React component files. Of the page
routes, 45 are public, authentication, learner, beta or prototype screens; 9
are admin screens; and 7 are developer screens. The application uses Next.js
15, React 19, Tailwind CSS, Supabase, local browser persistence and a shared
route runner.

The worktree already contained changes in Exam Mode, route-runner and AppShell
files when this pack was created. Those changes were treated as existing work
and were not edited.

## 1. Raw feedback register structure

The working template is [raw-feedback-register.md](raw-feedback-register.md).
It keeps source evidence separate from interpretation and prioritisation.

Every feedback item must record:

1. Source and learner context, including subject, mode, task, route, device
   and sign-in state where known.
2. Verbatim feedback without rewriting or summarising the learner's words.
3. Observed behaviour and evidence, which may confirm or challenge the
   learner's interpretation.
4. Impact, frequency, accessibility relevance and confidence.
5. Whether the item touches the protected atlas, route engine, Exam Mode,
   persistence, authentication, admin or deployment boundaries.
6. A separate product interpretation, decision, owner, target stage and
   measurable acceptance check.

Feedback is not a backlog item until it has been triaged. Repeated feedback is
linked to the earliest item instead of erasing frequency evidence through
deduplication. Any item classified as map rendering must be held for explicit
scope review; map visibility, controls, overlays and responsive layout may be
considered within Phase 10.

## 2. Current route, screen and component audit

### Route audit

| Area | Current routes | Current role | Phase 10 disposition |
| --- | --- | --- | --- |
| Public website | `/`, `/topographical`, `/seru`, `/course`, `/demo`, `/demo/topographical`, `/demo/seru`, `/resources`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`, `/disclaimer` | Acquisition, explanation, public demo, pricing and trust content | Retain as the public website. Give it a public-only shell and clearer subject-led navigation. |
| Authentication | `/auth/log-in`, `/login`, `/auth/sign-up`, `/create-account`, `/register`, `/auth/callback` | Sign-in and account creation, with three legacy aliases | Preserve behaviour. Choose canonical labels and URLs later; do not alter auth actions or callback logic. |
| Learner home and guidance | `/dashboard`, `/learn`, `/practice` | Dashboard, mixed learning hub and a large practice choice page | Reframe as learner home, subject journeys and resume/next-action entry points. |
| Topographical focused practice | `/practice/topographical`, `/practice/knowledge`, `/practice/map-click`, `/practice/routes` | Topic selection plus knowledge, map-click and route-drawing sessions | Retain as focused practice within the Topographical journey. |
| Topographical route modes | `/practice/training`, `/practice/exam-mode` | Shared atlas route runner configured for guided training or independent exam rules | Protect. Make both first-class, side-by-side entry points from the Topographical journey. |
| Topographical mock assessment | `/mock-test` | Mixed topographical knowledge, map-click and route-planning mock | Retain, but label it "Topographical Mock Test" wherever the subject is otherwise ambiguous. |
| SERU journey | `/practice/seru`, `/practice/seru/phv-handbook`, `/practice/seru/phv-handbook/all`, `/practice/seru/phv-handbook/[sectionId]`, `/practice/seru/english-complete-sentence`, `/practice/seru/english-advanced`, `/practice/seru/reading-understanding`, `/practice/seru/mock-test` | Dedicated handbook, English, reading and mixed SERU mock flows | Retain as a separate learner journey. Surface a recommended order and resume state. |
| Review and progress | `/review`, `/progress`, `/progress/mistakes`, `/results/[attemptId]` | Account review history, local analytics, Exam Mode readiness, mistakes and a placeholder results route | Keep data contracts unchanged. Reorganise presentation by subject and next action. Audit the placeholder results route before including it in primary navigation. |
| Account | `/account` | Required-auth profile, plan and account progress summary | Retain. Keep authentication and entitlements unchanged. |
| Beta and prototypes | `/beta`, `/practice/real-london`, `/route-demo` | Feature-gated real-London beta and standalone route prototype | Keep outside the normal learner IA except for controlled beta entry. Do not promote prototype routes. |
| Admin | `/admin` and 8 question-management routes | Protected publishing and content operations | Exclude from the learner redesign. Preserve access and behaviour. |
| Developer | `/dev` and 6 developer/visual-QA routes | Route authoring, map QA, beta review and diagnostics | Exclude from the learner redesign. Preserve the Phase 8 evidence workflow. |
| API and operations | Health, auth callback, beta, admin export and developer endpoints | Data, auth and operational support | No Phase 10 behaviour changes. |

### Current screen findings

| Screen or pattern | What works now | Phase 10 planning issue |
| --- | --- | --- |
| Public home | Names both product areas, has demos and clear independence language | The main call to action enters a generic practice hub rather than a guided subject journey. Much of the value is repeated in card grids. |
| Public Topographical and SERU pages | Separate subject explanations and calls to action already exist | They use similar long marketing-page structures and abstract illustrations rather than consistently showing the real learning experience. |
| Standard AppShell | Desktop sidebar groups study, practice, review and account | Signed-out learner screens combine the public header with the learner sidebar. The sidebar disappears on smaller screens without an equivalent grouped learner navigation. |
| Dashboard | Provides a stable app entry route | The three headline values are static placeholders, while useful live progress exists elsewhere. There is no strong resume or recommended-next action. |
| Learn | Contains a beginner path and substantial guidance | It combines Topographical and SERU in one long page, weakening the subject separation already present in practice. |
| Practice hub | Exposes both subjects, Training Mode, Exam Mode, beta, mistakes, mock exam and demo | Subject choices and modes compete at the same hierarchy level. Training and Exam Mode appear after other topographical links and are easy to miss. |
| Topographical practice | Topic counts, weak-topic ordering and three focused question types are useful | The primary call to action starts mixed knowledge, so the protected atlas route-planning experience is not the defining entry point. |
| Training Mode | Reuses the validated atlas route runner with hints, scoring and feedback | The introductory shell consumes vertical space on desktop. The route runner is visually separate from the broader guided journey. |
| Exam Mode | Has a focused shell and clear exit, with the validated Phase 9 rules | Its entry point needs stronger contrast with Training Mode before the learner enters. The active workspace itself should remain focused. |
| SERU hub | Already keeps SERU separate and offers five clear practice types | Priority is communicated through several equal-weight cards and buttons; the recommended order and resume state are weak. |
| Progress and review | Rich progress, readiness, mistake and account history components already exist | Evidence is split across `/progress`, `/review`, `/progress/mistakes` and `/account`, and is not consistently partitioned into Topographical and SERU journeys. |
| Atlas workspace | Accepted dense cartography, clear learner overlays, labelled controls and OSM attribution | On desktop the public header and app sidebar reduce the usable workspace. On mobile the toolbar and long feedback stack can compete with map visibility. These are layout concerns only, not cartographic defects. |

### Component audit

| Component family | Current components | Audit conclusion |
| --- | --- | --- |
| Layout | `Navbar`, `AppShell`, `Sidebar`, `Footer`, `StatusPage` | Public and learner navigation are selected inside shared components. Phase 10 needs explicit public-shell, app-shell and focused-workspace responsibilities while preserving auth lookup and focus mode. |
| Public content | Mostly page-local arrays, sections and bespoke illustrations | Content is easy to edit but presentation is duplicated. Introduce reusable public content primitives only where they remove repeated structure. |
| Practice launchers | `PracticeTopicSelector`, page-local practice cards, tracked links | Existing destinations are sound. Replace the flat catalogue feeling with subject and mode hierarchy rather than replacing the flows. |
| Topographical practice | `KnowledgePracticeFlow`, `MapClickPracticeFlow`, `RoutePracticeFlow`, `RouteDrawingQuestion` | Retain. These are focused practice tools beneath the Topographical journey. |
| Atlas route planning | `RouteRunnerClient` plus route-runner helpers, map engine, renderer and atlas assets | Highest regression risk. The client is a large shared workspace used by Training Mode, Exam Mode and beta practice. Wrap and configure it; do not refactor its behaviour as part of shell work. |
| SERU | `SeruMockTestFlow`, reading, sentence-completion and handbook practice components | Strong domain separation already exists. Phase 10 should add guidance and shared SERU navigation around these components. |
| Mock assessment | `MockTestFlow` and its intro, selection, results and review components | Keep behaviour. Clarify whether a link is Topographical Mock Test, SERU Mock Test or route-planning Exam Mode. |
| Progress and review | `ExamReadinessDashboard`, `ProgressDashboard`, `MistakeReview`, `ReviewHistory`, charts and answer-review components | Recompose by subject and learner task. Do not change repositories, local-storage schemas or readiness calculations. |
| Account and plans | `AccountProgressSummary`, plan helpers and auth actions | Presentation may align with the app shell; auth, plan and persistence behaviour are protected. |
| Admin and developer | Admin question managers and dev route/map tools | Separate operational surface. No visual migration dependency should be introduced into learner components. |

### Structural risks to manage

- `RouteRunnerClient` contains both UI and high-value behavioural integration.
  New shells should pass existing configuration rather than move its internal
  state or logic.
- The design system currently exposes four custom colours and one shadow;
  most spacing, radius and state styling is repeated directly in class names.
- Public pages use large rounded content panels and bespoke SVG illustrations;
  the learner app uses similar visual language, so public and app surfaces do
  not yet feel operationally distinct.
- `/mock-test`, `/practice/exam-mode` and `/practice/seru/mock-test` use three
  assessment concepts whose labels need to carry their subject and rules.
- Authentication aliases and signed-out local practice are intentional current
  behaviours. A shell split must not silently become an access-control change.

## 3. Current learner journey map

```text
Public discovery
  -> Home / Topographical / SERU / Demo
  -> Start practising
  -> Generic Practice hub
       -> Topographical practice
            -> Knowledge / Map-click / Routes
            -> Topographical Mock Test
       -> SERU practice
            -> Handbook / English / Reading / SERU Mock Test
       -> Training Mode (separate lower-page entry)
       -> Exam Mode (separate lower-page entry)
       -> Beta / Mistakes / Demo
  -> Progress, Review or Mistakes after an attempt
  -> Optional account for account-backed history
```

The functional loops exist, but the learner must infer the curriculum. The
main breaks are:

- subject and mode are mixed on the practice hub;
- returning learners do not get a reliable resume point;
- the dashboard is not the source of truth for next action;
- Training Mode and Exam Mode are not framed as a deliberate progression;
- review evidence is spread across several destinations;
- signed-out learners see a hybrid public/app shell.

## 4. Proposed target learner journey

### First visit

```text
Public TopoPass website
  -> Choose Topographical or SERU
  -> See the subject outcome, learning sequence and real product evidence
  -> Try a subject demo or start learning
  -> Enter learner app with the chosen subject retained as context
```

### Topographical journey

```text
Topographical home
  -> Recommended next action or choose activity
       -> Learn: map knowledge and route-planning principles
       -> Focused practice: Knowledge / Map-click / Routes
       -> Training Mode: guided atlas route planning with hints and feedback
       -> Exam Mode: timed independent atlas route planning, review after submit
       -> Topographical Mock Test: mixed question assessment
  -> Subject-specific result and review
  -> One recommended next step
  -> Topographical progress and readiness
```

Training Mode should be the normal route-planning learning entry. Exam Mode
should be visibly independent and higher stakes, but not artificially locked
behind a score threshold. Readiness can recommend a path without changing
entitlements or exam behaviour.

### SERU journey

```text
SERU home
  -> Resume last activity or start recommended foundation
       -> PHV Driver Handbook sections
       -> Complete-the-sentence English
       -> Advanced English
       -> Reading and understanding
       -> SERU Mock Test
  -> Immediate explanation and mistake capture
  -> SERU review and recommended next topic
  -> SERU progress summary
```

### Returning learner

```text
Learner dashboard
  -> Resume last activity
  -> OR select Topographical / SERU
  -> Complete one clear task
  -> Review result
  -> Follow one evidence-backed next action
```

The target loop is `Choose subject -> Learn or practise -> Review -> Next
action`, with Training and Exam Mode clearly differentiated before entry.

## 5. Proposed information architecture

The separation should be implemented first through shells, navigation and
content hierarchy. Existing pathnames should remain stable during the initial
migration so Phase 10 does not become an authentication, persistence, SEO or
deployment rewrite.

### Public website

```text
TopoPass
  Home                         /
  Topographical preparation   /topographical
  SERU preparation            /seru
  How TopoPass works           /course
  Demo                         /demo
    Topographical demo         /demo/topographical
    SERU demo                  /demo/seru
  Resources                    /resources
  Pricing                      /pricing
  About and contact            /about, /contact
  Legal                        /privacy, /terms, /disclaimer
  Sign in / Create account     canonical auth pages plus retained aliases
```

Public navigation: `Topographical`, `SERU`, `How it works`, `Resources`,
`Pricing`, then `Sign in` and one primary `Start learning` action. Public pages
must not show the learner app sidebar.

### Learner app

```text
TopoPass learner app
  Home / Resume                /dashboard
  Topographical               /practice/topographical
    Learn                      existing /learn content, subject-filtered first
    Focused practice           /practice/knowledge, /practice/map-click,
                               /practice/routes
    Training Mode              /practice/training
    Exam Mode                  /practice/exam-mode
    Topographical Mock Test    /mock-test
  SERU                         /practice/seru
    Handbook                   /practice/seru/phv-handbook/**
    English                    /practice/seru/english-*
    Reading                    /practice/seru/reading-understanding
    SERU Mock Test             /practice/seru/mock-test
  Review                       /review, /progress/mistakes
  Progress                     /progress
  Account                      /account
```

Learner navigation: `Home`, `Topographical`, `SERU`, `Review`, `Progress`,
`Account`. "Practice" becomes an action within each subject, not the product's
primary taxonomy. On mobile, the first five items can form the persistent app
navigation while Account remains in the profile menu.

### Focused workspaces

Training Mode, Exam Mode, Topographical Mock Test and SERU Mock Test should use
focused workspace shells. They keep an obvious exit to the parent subject but
remove public marketing links and unrelated learner navigation during an
active attempt. Exam Mode's existing focused shell is the reference behaviour.

### Route cleanup candidates, not current commitments

- Select one canonical login route and one canonical create-account route,
  retaining aliases as redirects only after auth regression tests pass.
- Decide whether `/learn` should become two subject views before adding new
  URLs. A subject query or tab may be lower risk than an immediate route split.
- Validate whether `/results/[attemptId]` has a production role; it currently
  renders placeholder values and should not be promoted in navigation.
- Keep beta and developer paths out of the normal IA regardless of URL shape.

## 6. Low-fidelity wireframe descriptions

These are layout contracts, not visual designs.

### Desktop: public home

```text
+--------------------------------------------------------------------------+
| TopoPass | Topographical | SERU | How it works | Resources | Pricing     |
|                                                     Sign in [Start]       |
+--------------------------------------------------------------------------+
| Full-width real product scene: accepted atlas and learning UI in context  |
| TopoPass                                                                  |
| Guided preparation for London private-hire learners                       |
| [Start Topographical] [Start SERU]                                         |
| A visible edge of the next section remains below the fold                 |
+--------------------------------------------------------------------------+
| Topographical journey              | SERU journey                         |
| Learn -> Train -> Exam -> Review    | Learn -> Practise -> Mock -> Review  |
+--------------------------------------------------------------------------+
| How it works | Trust/independence | Demo evidence | Footer                |
+--------------------------------------------------------------------------+
```

The public hero should use real product evidence, not an abstract route SVG.
The atlas may be shown as an image, but the accepted production renderer is not
changed for this use.

### Desktop: learner dashboard

```text
+------------------+-------------------------------------------------------+
| TopoPass          | Home                                                  |
| Home              | Welcome / resume context                              |
| Topographical     | [Resume last activity..............................]  |
| SERU              |                                                       |
| Review            | Topographical progress | SERU progress                |
| Progress          | [Next action]          | [Next action]                 |
|                   |                                                       |
| Account           | Recent activity | Review due | Readiness note          |
+------------------+-------------------------------------------------------+
```

The dashboard is a working surface, not a hero. The first actionable element
is `Resume`, followed by one recommended action for each subject. No metric is
shown unless it is backed by existing stored evidence.

### Desktop: Topographical journey home

```text
+------------------+-------------------------------------------------------+
| App navigation   | Topographical                                          |
|                  | Progress summary and recommended next action            |
|                  +------------------------+------------------------------+ |
|                  | Training Mode          | Exam Mode                    | |
|                  | Guided, hints, review  | Timed, independent, locked   | |
|                  | [Start training]       | [Start exam practice]        | |
|                  +------------------------+------------------------------+ |
|                  | Focused practice: Knowledge | Map-click | Routes        |
|                  | Topographical Mock Test | Review mistakes               |
+------------------+-------------------------------------------------------+
```

Training and Exam Mode get equal structural visibility, with copy that states
their rule difference before entry. Exam Mode should not be styled as a
danger state.

### Desktop: SERU journey home

```text
+------------------+-------------------------------------------------------+
| App navigation   | SERU                                                   |
|                  | [Resume] Recommended foundation / progress              |
|                  | Learning sequence                                      |
|                  | 1 Handbook  2 English  3 Reading  4 Mixed review        |
|                  | Focus area rows with status and one action each         |
|                  | [Start SERU Mock Test] [Review SERU mistakes]           |
+------------------+-------------------------------------------------------+
```

The current SERU components remain intact. The new shell supplies order,
progress context and fewer competing calls to action.

### Desktop: atlas route-planning workspace

```text
+--------------------------------------------------------------------------+
| TP | Training Mode or Exam Mode | task timer/status             [Exit]     |
+--------------------------------------------------------------------------+
| Origin -> destination | checkpoint/task summary | [Submit route]           |
+--------------------------------------------------------------------------+
|                                                                          |
|                   ACCEPTED PHASE 8 ATLAS                                  |
|          Draw/Pan/Undo/Erase/Zoom controls remain reachable              |
|          Attribution, markers and overlays remain visible                |
|                                                                          |
+--------------------------------------------------------------------------+
| Collapsed guidance/review drawer; opens beside or below without           |
| permanently obscuring the map                                             |
+--------------------------------------------------------------------------+
```

The map remains the largest visual and interactive area. Phase 10 may reduce
surrounding shell chrome, but it may not restyle the map. Any side panel must
be collapsible and must not reduce the atlas below the Phase 8 readable
viewport without a new visual acceptance check.

### Mobile: learner app

```text
+--------------------------------------+
| TopoPass             [Profile/Menu]  |
| Page title / subject switch          |
+--------------------------------------+
| Resume last activity                 |
| Recommended next action              |
| Topographical summary                |
| SERU summary                         |
| Review due                           |
+--------------------------------------+
| Home | Topo | SERU | Review | Progress|
+--------------------------------------+
```

Content uses one column, a stable 16 px minimum page gutter and no horizontal
card carousels. Mode choices stack vertically with Training Mode first and
Exam Mode immediately after it.

### Mobile: atlas route-planning workspace

```text
+--------------------------------------+
| TP | Mode | timer/status      [Exit] |
+--------------------------------------+
| Origin -> destination | task details |
+--------------------------------------+
| Draw | Pan | Undo | Erase | Zoom     |
|                                      |
|         ACCEPTED PHASE 8 ATLAS       |
|         minimum 55dvh target         |
|                                      |
+--------------------------------------+
| [Submit route]                        |
| Guidance/review bottom sheet handle  |
+--------------------------------------+
```

The toolbar may wrap into two compact rows but must not overlap essential
markers or attribution. The collapsed feedback sheet must leave the map and
primary action usable. When expanded, it must scroll independently, return
focus on close and avoid trapping the user.

## 7. Visual design-system direction

### Character

TopoPass should feel authoritative, calm, practical and London-specific. It
is a repeated-use learning tool, not a generic SaaS dashboard or a promotional
course catalogue. The interface should favour clear hierarchy, dense but
readable study information and visible progress over decorative card grids.

### Existing foundations to retain

- `ink` `#172033` for primary text and focused workspace chrome.
- `road` `#1F6FEB` for primary actions and Topographical identity.
- `success` `#16854B` for successful outcomes, never as the only signal.
- `surface` `#F7F9FC` plus white and slate neutrals.
- Phase 8 atlas colours and tokens remain isolated and unchanged.

### Proposed semantic extension

| Role | Direction |
| --- | --- |
| Topographical | Road blue plus ink and neutral surfaces. Use an atlas thumbnail or route symbol as the subject signal. |
| SERU | Controlled amber/orange accent plus ink and neutral surfaces. Avoid turning whole pages orange. |
| Training Mode | Blue action, guidance icon and explicit "Hints and feedback available" label. |
| Exam Mode | Ink/white focused chrome, timer icon and explicit "No hints before submission" label. Do not use red as the mode identity. |
| Information | Blue-neutral surface and icon. |
| Warning | Amber with text and icon. |
| Error / needs practice | Red with text, icon and clear recovery action. |
| Success | Green with text, icon and evidence. |

### Typography and density

- Use one accessible humanist sans-serif family or the existing system stack;
  avoid introducing a font dependency until loading and deployment impact are
  accepted.
- Body text should normally be 16 px with comfortable line height. Compact
  metadata may be 13-14 px but must not carry primary instructions.
- Use tabular numerals for timers, scores and progress where supported.
- Keep app headings compact. Reserve large display type for public-page heroes.
- Letter spacing remains neutral; uppercase labels are short and secondary.

### Shape, layout and component rules

- Standard radius: 6-8 px. Larger radii are reserved for modal sheets or an
  established control need, not every page section.
- Use page bands and unframed layouts for major sections. Cards are for
  repeated selectable items, attempt summaries and modal tools.
- Avoid cards inside cards. Use dividers, rows and grouped headings for dense
  progress and lesson content.
- Define stable dimensions for toolbars, map controls, score summaries and
  mode selectors so labels and states do not shift the layout.
- Use a single recognised icon family if a dependency is approved. Icons must
  have accessible names where the symbol is not self-evident.
- Public Topographical imagery should show the accepted atlas or real learning
  state. Public SERU imagery should show actual question/handbook practice,
  not generic decorative illustrations.
- Motion is restrained and functional. No continuous decorative animation.

### Core Phase 10 UI primitives

- `PublicShell`
- `LearnerAppShell`
- `FocusedAttemptShell`
- `SubjectSwitcher`
- `ResumeAction`
- `RecommendedNextAction`
- `ModeChoice` for Training Mode and Exam Mode
- `JourneyProgressSummary`
- `AttemptStatus`
- `ReviewDrawer` shell around existing review content
- `EmptyState` with one primary recovery action

These are proposed ownership boundaries, not instructions to replace existing
domain components.

## 8. Migration and non-regression strategy

### Migration rules

1. Preserve paths and behaviour first. Separate public and learner shells
   before considering route renames.
2. Establish a visual baseline for every affected route before changing a
   shell. Record desktop, tablet, mobile and signed-in/signed-out states.
3. Add new layout primitives alongside existing ones, then migrate one route
   family at a time. Avoid a repository-wide class rewrite.
4. Keep domain components as children of the new shells. Do not move scoring,
   persistence, auth or route-runner state into layout components.
5. Use a release flag or route-family rollout switch for shell migrations if
   a single deployment would affect both public and learner surfaces.
6. Keep old shell composition available until the migrated route family passes
   automated, visual and manual checks.
7. Do not delete auth aliases, beta routes or old layout helpers in the same
   stage that introduces a new shell.

### Protected ownership matrix

| Capability | Protected implementation | Phase 10 permission | Required gate if layout touches it |
| --- | --- | --- | --- |
| Phase 8 cartography | Renderer, style tokens, source data, atlas assets, map transforms and overlay semantics | No visual restyling or data change | Phase 8 screenshot matrix, map tests, owner-review manifest and normal-size visual comparison |
| Map interaction | Draw, pan, zoom, pinch, snapping, matching, controls and feedback overlays | Layout may reposition surrounding UI only | Desktop and physical mobile interaction QA; control reachability; no marker/attribution obstruction |
| Route engine and scoring | `lib/map-engine/**`, route validation/scoring and shared submission | No change | Existing map, route-scoring, training and shared-submission suites |
| Exam Mode | Exam rules, route pack, timer semantics, submission lock, scoring, review and readiness | Entry framing and shell styling only | Full focused Exam Mode tests plus active/submitted desktop and mobile QA |
| Progress storage | Local and account repositories, schemas, migration and bounded Exam Mode history | Presentation only | Persistence and progress suites; reload and signed-in/signed-out checks |
| Authentication | Auth actions, session lookup, Supabase callback and access requirements | Shell may render existing auth state | Auth route/access tests; redirect and callback smoke tests |
| Admin | Admin layouts, roles, question management and import/export | None | Admin regression suite if shared tokens affect admin |
| Deployment | Next config, Docker, infrastructure, environment and monitoring | None | Build remains mandatory; no deployment-file diff |

### Baseline and validation matrix

Automated gates for any later production stage:

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:map`
- `npm run map:qa:phase8-owner-review`
- Focused Phase 9 tests in `app/practice/exam-mode/*.test.ts` and shared
  route-runner submission tests
- Auth and admin tests whenever a shared shell or token can reach those routes
- `git diff --check`

Visual/browser gates:

- Public and app shells at 1440 x 900, 1024 x 768, 768 x 1024, 390 x 844,
  360 x 800 and 844 x 390.
- Signed-out local-practice, signed-in learner and unavailable-auth-config
  states.
- Training Mode active, hint, submitted-pass and submitted-needs-practice.
- Exam Mode active, submitted-pass, submitted-needs-practice and progress
  reload.
- Dense Victoria atlas, active route, restriction context, review overlay,
  hint and attribution states from the accepted Phase 8 matrix.
- Public and learner navigation with long labels and 200% zoom.

Rollback should be shell-level: restore the prior route composition without
rolling back map, exam, storage, auth or deployment data.

## 9. Accessibility and responsive acceptance criteria

Phase 10 reworked UI should target WCAG 2.2 AA. This target applies to the new
or changed shell and content UI; existing canvas limitations must be recorded
truthfully rather than hidden by a Phase 10 claim.

### Structure and navigation

- One clear `h1` per screen and a logical heading order.
- Public header, learner navigation, main content and footer use explicit
  landmarks and accessible names.
- A keyboard user can reach all navigation, mode choices, controls, drawers
  and actions in visual order without a trap.
- Focus is always visible at a minimum 2 CSS px equivalent and is not hidden
  behind sticky headers, sheets or drawers.
- Focus moves into modal content only when appropriate and returns to the
  triggering control when the surface closes.
- Current subject and current navigation location are programmatically
  exposed, not shown by colour alone.

### Content and state

- Normal text contrast is at least 4.5:1; large text and meaningful UI graphics
  are at least 3:1.
- Training, Exam, Topographical, SERU, pass, needs-practice, warning and error
  states use text or icons in addition to colour.
- Instructions use plain English and consistent names: `Training Mode`, `Exam
  Mode`, `Topographical Mock Test` and `SERU Mock Test`.
- Validation errors identify the field, explain recovery and receive an
  appropriate announced status.
- The Exam Mode timer has an accessible name but is not announced every
  second. Critical state changes are announced once.
- Reduced-motion preferences remove non-essential transitions. Forced-colour
  mode keeps borders, focus and controls distinguishable.

### Controls and touch

- Primary interactive targets are at least 44 x 44 CSS px. Inline text links
  have sufficient spacing or an equivalent target area.
- Icon-only controls have an accessible name and visible tooltip where the
  meaning is not universal.
- No action depends on hover, multipoint touch or device orientation alone.
- Any current route-drawing gesture that lacks a keyboard or non-drag
  alternative must remain logged as a known accessibility gap; Phase 10 must
  not claim full conformance for that task until the gap is resolved in an
  explicitly scoped interaction stage.

### Reflow and responsive layout

- No horizontal page overflow at 320 CSS px, 200% browser zoom or the 400%
  reflow equivalent, excluding the intentionally pannable map surface itself.
- Text does not clip, overlap controls or require two-dimensional page
  scrolling.
- Public and app navigation remains usable from 320 px through wide desktop.
  Mobile learner navigation does not rely on the hidden desktop sidebar.
- Layout works in portrait and landscape. It does not lock orientation.
- Sticky controls respect safe-area insets and the on-screen keyboard.
- Loading, empty, error and long-content states retain the same stable layout
  dimensions as populated states where practical.

### Atlas-specific acceptance

- The atlas is the largest task surface in Training and Exam Mode and targets
  at least 55dvh visible map height on standard portrait mobile before a
  feedback sheet is expanded.
- Draw, Pan, Undo, Erase, Reset and Zoom controls remain reachable at all
  accepted widths. Wrapped controls do not cover required markers or OSM
  attribution.
- Map legend, attribution, route markers, learner route, restriction overlays,
  shortest-route comparison and post-submit feedback retain their Phase 8/9
  hierarchy.
- Opening a hint or review surface does not permanently hide the map or the
  exit action. The surface can be scrolled and dismissed with keyboard and
  touch.
- Pan, wheel zoom, pinch zoom, route drawing, pointer cancellation and
  orientation changes receive physical iOS and Android QA before a widened
  beta.

### Test assistive technology and device matrix

- Keyboard-only in Chromium and Firefox.
- NVDA with Chromium on Windows.
- VoiceOver with Safari on iOS for public navigation, learner navigation,
  mode entry, form flows and review drawers.
- iOS Safari and Android Chrome for touch drawing, pinch, safe areas,
  orientation and bottom-sheet behaviour.
- Windows forced colours and operating-system reduced motion.

## 10. Staged Phase 10 implementation roadmap

| Stage | Outcome | Planned scope | Exit gate |
| --- | --- | --- | --- |
| 10.0 Planning and intake | Approved journey, IA, wireframes, design direction and feedback structure | This documentation pack; no production UI changes | Owner approval of subject/mode taxonomy, shell separation and protected boundaries |
| 10.1 Feedback synthesis and baseline | Evidence-backed priorities and reproducible current-state baseline | Populate the register; tag feedback; capture current routes, auth states and accepted map/exam states; define analytics questions without changing storage contracts | Prioritised findings, baseline screenshot manifest and agreed success measures |
| 10.2 Design-system and shell prototypes | Tested foundations without domain behaviour changes | Tokens, typography, public shell, learner app shell, focused workspace shell and low-fidelity interactive prototypes in isolated stories/dev routes or a feature branch | Accessibility review, responsive review and zero domain-component changes |
| 10.3 Public website separation | A coherent public TopoPass website | Public navigation, home, Topographical, SERU, course, resources, pricing and trust content; real product imagery; canonical public calls to action | Public route smoke tests, SEO metadata check, signed-out responsive QA and no learner-route regression |
| 10.4 Learner app shell and dashboard | A clear home and navigation system for returning learners | Learner navigation, mobile app navigation, resume action, subject summaries and evidence-backed next actions using existing data only | Signed-in and signed-out local-practice QA, auth regression suite and no storage changes |
| 10.5 Topographical journey entry | Clear Learn, focused practice, Training Mode and Exam Mode choices | Recompose `/practice/topographical`; label `/mock-test`; add mode pre-entry framing; keep route runner and exam rules unchanged | Training/Exam entry usability, full Phase 9 suite and atlas baseline unchanged |
| 10.6 Atlas workspace layout hardening | More map visibility with less surrounding chrome | Apply focused shell to Training Mode only if evidence supports it; adjust drawers/toolbars around the map, not renderer styling | Full Phase 8 matrix, physical touch QA, overlay/focus QA and owner visual acceptance |
| 10.7 SERU guided journey | A separate, ordered SERU learning path | Recompose SERU hub, resume state, recommended order and subject-specific review links around existing SERU flows | SERU component tests, content/disclaimer review and mobile long-content QA |
| 10.8 Review and progress coherence | Review evidence organised by subject and next action | Present existing readiness, mistakes, history and progress through Topographical/SERU views without repository or schema changes | Persistence reload tests, sparse/empty-state QA and no change to readiness calculations |
| 10.9 Accessibility, responsive and beta acceptance | Release candidate for controlled Phase 10 beta | Cross-route WCAG audit, device matrix, browser QA, copy consistency, performance and regression closure | WCAG issues triaged, Phase 8/9 gates passed, owner sign-off and documented rollback |

### Stage ordering rules

- Stage 10.5 cannot alter Exam Mode internals.
- Stage 10.6 starts only if layout evidence shows a real visibility, control,
  overlay or responsive problem. It is not permission to reopen cartography.
- Stage 10.8 cannot introduce a new progress schema or sync model.
- Auth alias cleanup, admin redesign and deployment work remain separate from
  Phase 10 unless explicitly approved later.
- Each production stage ships as a narrow route-family migration with its own
  rollback, not as one whole-app visual replacement.

## Phase 10 success measures

The exact targets should be set after feedback intake, but Phase 10 should be
measured against these questions:

- Can a new learner identify Topographical and SERU as separate journeys
  without opening the generic practice catalogue?
- Can a learner explain the difference between Training Mode and Exam Mode
  before starting either one?
- Can a returning learner resume or choose a recommended next action from the
  dashboard in one decision?
- Does the atlas remain the primary, readable route-planning surface on every
  accepted viewport?
- Do learners reach review and then a specific next action without searching
  across Progress, Review and Mistakes?
- Do Phase 8 map evidence and Phase 9 exam behaviour remain unchanged?

## Decisions for owner approval before Stage 10.1 closes

1. Confirm that Training Mode and Exam Mode belong only to the
   Topographical route-planning journey.
2. Confirm that the initial IA migration keeps existing route paths and
   separates surfaces through shells and navigation first.
3. Confirm that `/mock-test` is labelled Topographical Mock Test and the SERU
   mock remains inside the SERU journey.
4. Confirm that signed-out local practice remains available; Phase 10 does not
   convert learner-app separation into a new authentication requirement.
5. Confirm that Stage 10.6 is conditional and cannot restyle accepted atlas
   cartography.
