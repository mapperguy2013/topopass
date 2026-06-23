# Manual QA Checklist

Use this checklist after running the app locally. A non-technical reviewer can
complete it in a normal browser.

## Before You Start

- [ ] Run `npm.cmd install`.
- [ ] Add a valid `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`.
- [ ] Run `npm.cmd run dev`.
- [ ] Open `http://localhost:3000`.
- [ ] Open the browser developer tools Console and keep it visible during QA.
- [ ] Test once on a desktop-sized window and once at a mobile width.

## Homepage

- [ ] The TopoPass name and main headline are visible without scrolling.
- [ ] The page clearly says it is for London private hire applicants.
- [ ] No Uber, Bolt, FREENOW, or TfL logos are displayed.
- [ ] `Start Practising` opens `/practice`.
- [ ] `Explore Resources` opens `/resources`.
- [ ] The text-only audience badges are readable and do not resemble official
      brand styling.
- [ ] The independence disclaimer appears in the footer.
- [ ] No text overlaps or extends outside its container on mobile.

## Navigation

- [ ] The TopoPass logo returns to `/`.
- [ ] Learn opens `/learn`.
- [ ] Practice opens `/practice`.
- [ ] Mock Test opens `/mock-test`.
- [ ] Resources opens `/resources`.
- [ ] Pricing opens `/pricing`.
- [ ] Login opens `/login` and clearly explains that Phase 1 auth is not
      connected.
- [ ] Sidebar links work on desktop layouts.

## Learn Page

- [ ] The Route Planning Skills section is visible.
- [ ] The explanation is professional and exam-focused.
- [ ] `Start Route Planning Practice` opens `/practice/routes`.
- [ ] `View all practice areas` returns to `/practice`.

## Practice Selection

- [ ] `/practice` shows the available Route Planning option.
- [ ] Future practice areas are clearly marked `Coming soon` and are not
      clickable.
- [ ] Route Planning opens `/practice/routes`.

## Knowledge Questions

Knowledge questions currently appear in the mock exam and admin tools.

- [ ] Start a mock exam and navigate until a Knowledge question appears.
- [ ] Select an answer.
- [ ] Move to another question and return.
- [ ] The selected answer is still shown.
- [ ] The question navigator marks it as answered.
- [ ] In `/admin/questions/knowledge`, the knowledge bank loads without errors.

## Map-Click Questions

- [ ] Open `/demo`.
- [ ] A Mapbox map loads. If not, confirm the token in `.env.local`.
- [ ] Click or tap a location.
- [ ] A marker appears at the selected point.
- [ ] Submit is disabled before selection and enabled after selection.
- [ ] Submitting shows coordinates, distance, and Correct or Try again.
- [ ] Next question changes the target and clears the previous marker/result.
- [ ] Finish shows a final demo score and question summary.
- [ ] Try again resets the demo.
- [ ] Repeat a map-click question inside `/mock-test`.

## Route-Drawing Questions

- [ ] Open `/practice/routes`.
- [ ] The real OSM-derived map image loads.
- [ ] Pickup/start and destination/end labels are clear.
- [ ] Draw a route with a mouse.
- [ ] Clear Route removes the drawing and result.
- [ ] Submit is disabled until a route has been drawn.
- [ ] Submit produces a score and route feedback.
- [ ] Zoom in, zoom out, and reset/fit controls work.
- [ ] Pan mode moves the map without drawing.
- [ ] Drawing remains aligned after zooming or panning.
- [ ] Previous route and Next route change the question and reset the attempt.
- [ ] On a touch device, drawing and panning are usable.

## Route Demo

- [ ] Open `/route-demo`.
- [ ] Route selection updates the prompt and accepted route.
- [ ] The developer accepted-route toggle shows only the selected route.
- [ ] The accepted overlay remains aligned while zooming and panning.
- [ ] The map attribution is visible.

## Mock Test Start

- [ ] Open `/mock-test`.
- [ ] The intro explains question types, duration, and pass mark.
- [ ] Starting the test creates a mixed exam.
- [ ] The page shows the current question number and total.
- [ ] The navigator distinguishes current, answered, and unanswered questions.

## Mock Test Timer

- [ ] The timer counts down once per second.
- [ ] Refresh the page during the exam.
- [ ] The active attempt and remaining time are restored.
- [ ] Restart exam asks for confirmation and starts a new attempt.
- [ ] Timer warning styles can be checked by temporarily reducing the configured
      duration in a development branch only.

## Unanswered Questions

- [ ] Move between questions without answering some of them.
- [ ] Answered selections remain stored.
- [ ] Unanswered questions remain visibly marked.
- [ ] The final submit dialog reports the correct answered/unanswered count.
- [ ] Choosing Continue exam closes the dialog without losing answers.

## Final Submission and Results

- [ ] Submit the mock exam.
- [ ] The result page shows percentage, pass/fail, pass mark, and total score.
- [ ] Answered and passed-question counts are shown.
- [ ] Knowledge, Map click, and Route drawing breakdown cards are shown.
- [ ] Restart mock exam starts a fresh randomized attempt.

## Result Review

- [ ] Choose Review answers.
- [ ] Every exam question is listed.
- [ ] Each item shows the question type, user answer, accepted answer, and result.
- [ ] Map-click review shows distance from target and tolerance.
- [ ] Route review shows start/end distance, length ratio, score, and any
      penalties or warnings.
- [ ] Back to results returns to the final result summary.

## Admin Dashboard

- [ ] Open `/admin`.
- [ ] Knowledge, Map click, Route, and Active/Inactive totals are shown.
- [ ] Bank validation reports no hard errors for the committed source banks.
- [ ] All manager links open the correct admin page.
- [ ] The browser-local persistence warning is visible.

## Admin Question Creation and Editing

Repeat the following in the Knowledge, Map-click, and Route managers:

- [ ] The committed source bank loads.
- [ ] Create new opens a blank/inactive or draft record.
- [ ] Required-field validation appears for incomplete data.
- [ ] Invalid or duplicate IDs are rejected or clearly reported.
- [ ] Editing an existing item updates the browser draft list.
- [ ] Preview reflects the current draft.
- [ ] Activate/deactivate or status controls update the browser draft only.
- [ ] Delete asks for confirmation.
- [ ] Reset browser drafts returns to the committed source bank.
- [ ] Reloading the page restores browser-local drafts.
- [ ] `/practice` and `/mock-test` do not silently consume those local drafts.

## Export Tools

- [ ] Export JSON downloads the full current browser draft bank.
- [ ] The downloaded filename identifies the question type.
- [ ] Open the JSON and confirm it contains every item currently shown in the
      manager.
- [ ] The admin text clearly says export and source review are required for
      permanent content.

## Mobile Layout

- [ ] Test the homepage at approximately 375px width.
- [ ] Navigation remains usable and does not overlap.
- [ ] Practice cards fit without horizontal scrolling.
- [ ] Mock question controls and timer remain readable.
- [ ] Mapbox controls do not cover essential instructions.
- [ ] Route drawing has enough vertical space to use accurately.
- [ ] Admin tables can scroll horizontally without breaking the page.
- [ ] Buttons and form controls are large enough to tap.

## Browser Console

- [ ] No uncaught errors appear while visiting the public pages.
- [ ] No errors appear while selecting and submitting Mapbox answers.
- [ ] No errors appear while drawing, clearing, zooming, or submitting routes.
- [ ] No errors appear during mock-exam start, refresh recovery, submission, or
      review.
- [ ] No errors appear while creating, editing, previewing, resetting, or
      exporting admin drafts.
- [ ] Expected Mapbox token/network errors are investigated rather than ignored.

## Completion Record

- [ ] Record browser and version.
- [ ] Record desktop operating system.
- [ ] Record tested mobile device or emulator size.
- [ ] Record any failed checklist item with page URL and reproduction steps.
- [ ] Attach a screenshot and console error text for each defect.
