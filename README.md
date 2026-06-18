# TopoPass

TopoPass is a responsive web app that helps private hire driver applicants practise for the **TfL Private Hire Topographical Skills Assessment**.

The app focuses on interactive map-based practice, mock tests, and progress tracking to help learners improve their map reading, direction awareness, route-choice judgement, and knowledge of London points of interest.

## Project Status

Early MVP planning/build stage.

The first version will focus on:

* Responsive web app
* Desktop and mobile browser support
* Supabase authentication
* Practice questions
* Click-on-map questions using Mapbox
* Timed mock tests
* Score tracking
* Mistake review

Route drawing will be added in a later version.

## Tech Stack

* Next.js
* TypeScript
* Tailwind CSS
* Supabase
* Supabase Auth
* Supabase PostgreSQL
* Mapbox GL JS

## Core Features

### MVP v1

* Landing page
* Register and login
* User dashboard
* Practice mode
* Multiple choice questions
* Click-on-map questions
* Mock test mode
* Results page
* Review mistakes page

### Future Features

* Route drawing on the map
* Route snapping
* Route accuracy scoring
* More advanced progress analytics
* Admin dashboard for managing questions
* Subscription payments
* Progressive Web App support
* Native mobile apps

## Planned Routes

```txt
/
```

Landing page.

```txt
/register
```

User registration.

```txt
/login
```

User login.

```txt
/dashboard
```

User dashboard.

```txt
/practice
```

Practice mode.

```txt
/mock-test
```

Timed mock test.

```txt
/results/[attemptId]
```

Attempt results and review.

```txt
/review
```

Review previous mistakes.

## Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

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

```txt
http://localhost:3000
```

## Supabase Setup

The app will use Supabase for:

* User authentication
* User profiles
* Practice questions
* Test attempts
* User answers
* Progress history

Planned database tables:

* `profiles`
* `questions`
* `attempts`
* `answers`

Row Level Security should be enabled so users can only access their own attempts and answers.

## Mapbox Setup

TopoPass uses Mapbox for interactive London map practice.

The MVP map should:

* Default to London
* Support zoom and pan
* Allow click/tap answers
* Return selected latitude and longitude
* Display the user’s selected marker
* Compare selected location against the correct answer location

## Development Principles

Keep the first version simple.

Do not build the following in MVP v1:

* Route drawing
* Native iOS app
* Native Android app
* Windows desktop app
* Paid subscriptions
* Admin dashboard
* AI route scoring

The goal of MVP v1 is to prove the learning flow works before building more advanced route-drawing features.

## Product Vision

TopoPass aims to become an interactive practice platform for private hire applicants preparing for the TfL Topographical Skills Assessment.

Instead of only reading static study material, users will be able to practise with realistic test-style questions, receive instant feedback, track weaknesses, and build confidence before taking the assessment.
