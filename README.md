# TopoPass

TopoPass is a responsive web app designed to help private hire driver applicants practise for the TfL Private Hire Topographical Skills Assessment.

The app focuses on interactive, exam-style practice using real map-based tasks. Learners can practise identifying locations, answering knowledge questions, drawing routes, and reviewing their performance.

TopoPass is currently in an MVP build phase. The project has moved beyond the initial landing-page and mock-test prototype and now includes the foundations for scalable map-click questions, route-drawing questions, practice integration, and reusable question data.

---

## Current Project Status

TopoPass has completed the first 10 development stages of the MVP roadmap.

The app currently includes:

* Responsive Next.js web app structure
* Landing page
* Login/register flow foundation
* Dashboard page
* Practice page
* Mock test page
* Mapbox-based click-on-map questions
* Multiple real map-click questions
* Route-demo page
* Real generated London map using OpenStreetMap/Mapbox/OSRM-style data
* Route drawing on the map
* Route scoring against an accepted route
* Route question bank separated from UI logic
* Practice integration for route questions
* Learn section entry for route-planning/map-skills practice

The app is still an MVP and some features are intentionally rough or incomplete. The current goal is to prove the learning and testing flow before building production-grade admin, analytics, payments, and full exam simulation.

---

## What TopoPass Does

TopoPass helps learners practise the types of skills needed for the TfL topographical assessment, including:

* Reading a London-style map
* Recognising roads, stations, and landmarks
* Choosing suitable routes
* Understanding direction and route logic
* Practising location-based questions
* Drawing routes on an interactive map
* Receiving feedback on map and route answers

The product vision is to move learners away from only reading static material and give them a realistic, interactive way to practise.

---

## Completed Development Stages

### Stage 1: Initial App Foundation

Created the initial TopoPass web app foundation.

Included:

* Next.js app setup
* TypeScript
* Tailwind CSS
* Basic routing structure
* Initial pages
* Early product structure

Main purpose:

Prove that the project could run locally and provide the base for future MVP features.

---

### Stage 2: Basic Mapbox Demo Map

Created `/demo`.

Included:

* Mapbox map loading
* London map default view
* A simple click-on-map question
* User click/tap capture
* Latitude and longitude capture
* Basic distance scoring

Example question:

> Click on King’s Cross Station.

Main purpose:

Prove that the app could support interactive map-based questions on desktop and mobile.

---

### Stage 3: Map Click Scoring Foundation

Added the basic logic needed to score user map clicks.

Included:

* Capturing the clicked coordinate
* Comparing it to the correct coordinate
* Showing whether the click was close enough
* Basic user feedback

Main purpose:

Prove that map-based answers could be judged automatically.

---

### Stage 4: Mock Test Flow

Created the early `/mock-test` flow.

Included:

* Mock-test page
* Question flow foundation
* Map-based question inside mock test
* Basic test-style interaction
* Build validation

Main purpose:

Prove that map questions could work inside a test-like environment, not only inside the demo page.

---

### Stage 5: Multiple Real Map-Click Questions

Expanded the app beyond one demo question.

Included:

* Multiple real map-click questions
* Reusable question data
* Different London locations
* Support for showing more than one map-click task

Main purpose:

Prove that the system was not a one-off demo and could support a bank of location-based questions.

---

### Stage 6: Improved Driver-Focused Map Styling

Improved the map so it was more useful for private hire/topographical practice.

Included:

* More driver-focused map styling
* Better road hierarchy
* Better road visibility
* Reduced unnecessary pedestrian-style clutter
* Focus on stations and relevant map information

Main purpose:

Move the map closer to the type of visual experience learners need for the assessment.

Known limitation:

The current generated map is good enough for prototype testing, but it is not yet a perfect recreation of the official TfL or A-to-Z style map.

---

### Stage 7: First Image/Generated Route Map Prototype

Built the first route-focused map prototype.

Included:

* A generated map view
* Real London road context
* Start and destination route task
* Early route drawing capability

Main purpose:

Prove that learners could be shown a map and asked to draw or choose a route.

---

### Stage 8: Route Scoring Engine

Added route scoring to `/route-demo`.

Included:

* User route drawing
* Accepted route geometry
* Comparison between drawn route and accepted route
* Route accuracy feedback
* Basic scoring result

Main purpose:

Prove that TopoPass could judge whether a learner’s drawn route roughly matches an accepted route.

Important note:

The goal of this stage was not to perfect route scoring. The goal was to prove that the scoring concept works.

---

### Stage 9: Route Question Engine / Data Scaling

Refactored route questions into a cleaner, scalable structure.

Included:

* Route question data separated from UI logic
* Reusable route-question bank
* Support for multiple route tasks
* Cleaner structure for future expansion
* Preparation for using route questions across:

  * `/route-demo`
  * `/practice`
  * `/mock-test`

Main purpose:

Move from a small demo set of route questions to a scalable route-question system.

---

### Stage 10: Connect Route Question Bank to Practice

Connected route questions into the main practice flow.

Included:

* Practice mode can now direct learners into route-based tasks
* Route question data reused from the question bank
* Practice page can offer different question types
* Learn section includes a professional entry point for route/map-skill practice

Main purpose:

Make route questions part of the real learning experience, not just an isolated demo.

---

## Current Routes

### `/`

Landing page.

Introduces TopoPass and explains the product.

### `/register`

User registration page.

### `/login`

User login page.

### `/dashboard`

User dashboard.

Currently acts as a learner home area.

### `/practice`

Practice mode.

Supports entry points for different types of practice, including route-based practice.

### `/mock-test`

Timed/mock-test style flow.

Currently supports the foundations for map-based test questions.

### `/demo`

Mapbox click-on-map demo.

Used to prove and test basic interactive map questions.

### `/route-demo`

Route drawing and route scoring prototype.

Used to test route-question rendering, user drawing, accepted route comparison, and scoring.

### `/learn`

Learning/support area.

Includes a section for route-planning and map-skill development.

---

## Tech Stack

* Next.js
* TypeScript
* Tailwind CSS
* Mapbox GL JS
* Supabase
* Supabase Auth
* Supabase PostgreSQL
* OSRM/OpenStreetMap-style route data for accepted route generation/prototyping

---

## Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

Do not commit real API keys or tokens.

---

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

Build the project:

```bash
npm run build
```

---

## Supabase Plan

TopoPass will use Supabase for:

* User authentication
* User profiles
* Question storage
* Practice attempts
* Mock test attempts
* User answers
* Progress tracking
* Mistake review

Planned database tables:

* `profiles`
* `questions`
* `route_questions`
* `attempts`
* `answers`
* `progress`
* `mistakes`

Row Level Security should be enabled so users can only access their own attempts, answers, progress, and review history.

---

## Mapbox Usage

TopoPass uses Mapbox for interactive map practice.

Current map functionality includes:

* London default view
* Zoom and pan
* Click/tap answers
* Latitude and longitude capture
* User-selected marker
* Distance-based scoring for location questions
* Route drawing support
* Route-demo scoring support

The map is currently good enough for MVP testing but still needs production refinement.

---

## Route Question System

The route-question system is being designed to support many route questions without hardcoding each one directly into the UI.

A route question should include:

* Question ID
* Start location
* Destination location
* Start coordinate
* Destination coordinate
* Accepted route geometry
* Prompt text
* Difficulty level
* Optional explanation
* Optional tags or category
* Scoring tolerance

This makes route data reusable across practice, route demo, and mock test flows.

---

## Technical Debt

The project has moved quickly from Stage 1 to Stage 10, so some technical debt is expected.

Current technical debt includes:

### 1. Route Scoring Needs Refinement

The route scoring engine currently proves the concept, but it is not yet exam-grade.

Needs improvement:

* Better tolerance handling
* Better off-route detection
* Better partial credit
* Better route similarity comparison
* Clearer user feedback
* Better handling of small drawing mistakes

---

### 2. Map Styling Is Still Prototype-Level

The map has improved, but it is not yet a perfect driver-focused test-preparation map.

Needs improvement:

* More consistent road hierarchy
* Clearer main roads
* Clearer side roads
* Better station styling
* Better one-way/no-entry visual hints
* Less irrelevant clutter
* More consistent zoom behaviour

---

### 3. Question Data Should Move Toward Database Storage

Some question data is currently local/static for speed of development.

Needs improvement:

* Store question banks in Supabase
* Add database schema
* Add seed data
* Add validation rules
* Add admin editing later
* Keep UI separate from question content

---

### 4. Practice and Mock Test Need Stronger Shared Logic

Practice, mock test, map-click questions, and route questions should eventually share more reusable logic.

Needs improvement:

* Shared question renderer
* Shared scoring interface
* Shared answer-saving format
* Shared attempt/session model
* Shared results model

---

### 5. Authentication Is Not Yet Fully Connected to Learning Data

Supabase Auth is part of the tech stack, but the learning flow still needs deeper user-data integration.

Needs improvement:

* Save attempts per user
* Save route answers
* Save map-click answers
* Save scores
* Save mistakes
* Show progress history on dashboard

---

### 6. Admin Tools Are Not Built Yet

Admin tooling is the next major stage.

Needs improvement:

* Create questions without editing code
* Edit existing questions
* Validate route question data
* Preview questions
* Check accepted route geometry
* Enable/disable questions
* Add difficulty and category labels

---

### 7. Mobile UX Needs More Testing

The app is intended to work on desktop and mobile browsers, but route drawing may need extra mobile refinement.

Needs improvement:

* Touch drawing comfort
* Map zoom controls
* Button spacing
* Drawing reset/undo
* Full-screen route practice mode
* Small-screen instructions

---

## Next Stage

### Stage 11: Admin Tools to Create, Edit, and Validate Questions

The next stage should focus on admin tools.

Goal:

Allow questions to be created, edited, previewed, and validated without touching code.

Stage 11 should include:

* Admin question list
* Create route question form
* Edit route question form
* Create map-click question form
* Question validation
* Route preview
* Accepted route geometry preview
* Enable/disable question status
* Difficulty/category fields
* Basic admin-only access protection

Important:

Stage 11 should not refactor the whole app. It should build on the existing route question bank and question-rendering work from Stages 9 and 10.

---

## Future Roadmap

### Stage 12: Full Mock Exam System

Create a full exam-style mock test that mixes:

* Map-click questions
* Route-drawing questions
* Knowledge questions
* Timed sections
* Scoring
* Results
* Mistake review

---

### Stage 13: Analytics and Progress Tracking

Add learner progress features.

Possible features:

* Score history
* Weakness tracking
* Mistake categories
* Best/worst question types
* Route accuracy trends
* Dashboard progress cards

---

### Stage 14: Subscription and Payments

Add paid access features.

Possible features:

* Free tier
* Paid question bank
* Stripe integration
* Subscription status
* Locked premium questions
* Account billing page

---

### Stage 15: PWA and Mobile Improvements

Improve mobile access.

Possible features:

* Progressive Web App support
* Better mobile map controls
* Offline-friendly study pages
* Installable app experience

---

## Development Principles

Keep the MVP focused.

Do not overbuild before the learning flow is proven.

Current priorities:

1. Make the question system scalable.
2. Keep map and route practice usable.
3. Avoid hardcoding too much into UI components.
4. Separate question data from rendering logic.
5. Build admin tools before adding hundreds of questions.
6. Build real progress tracking after the question and attempt model is stable.

Avoid for now:

* Native iOS app
* Native Android app
* Advanced payments
* Complex AI scoring
* Overly detailed map styling
* Full production analytics before the core flow is stable

---

## Product Vision

TopoPass aims to become an interactive practice platform for private hire applicants preparing for the TfL Topographical Skills Assessment.

The long-term goal is to help learners practise in a more realistic way by combining:

* Interactive maps
* Route-planning practice
* Location recognition
* Mock tests
* Mistake review
* Progress tracking
* Driver-focused London map skills

The MVP is currently focused on proving the core learning loop:

```text
Practise question → interact with map → submit answer → receive feedback → improve
```

Once this loop is stable, the project can scale into a larger question bank, full mock exams, analytics, and paid learning plans.
