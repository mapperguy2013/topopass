# Mobile Accessibility QA Checklist

Stage 25 focuses on interaction quality for the existing local-first TopoPass
app. This checklist is for manual QA before shipping map, practice, mock exam,
progress, mistake review, learn, and admin-facing changes.

## Scope

- No backend, Supabase, online map API, or tile-service changes are required by
  this stage.
- Keep the current practice, scoring, route drawing, review, and local
  persistence behaviour intact.
- Verify the existing desktop layout and a narrow mobile viewport such as
  390 x 844.

## Global Navigation

- Header links can be reached with Tab.
- Focus is visible on the logo, main nav links, Login, and Start Practising.
- Header navigation remains usable when the mobile nav scrolls horizontally.
- Tap targets are comfortable on mobile and do not overlap.
- Page content is not hidden behind the sticky header after navigation.

## Home, Learn, And Practice Landing

- Primary action links have visible focus states.
- Action links have at least a 44 px visual/touch height.
- Lesson and practice cards are readable at mobile width.
- Text does not overflow or become clipped in cards.
- Disabled or coming-soon content is labelled with text, not only colour.

## Knowledge Practice

- Answer options show a clear selected state.
- The status message announces whether an answer is selected, checked, or still
  needed.
- Check answer is disabled before selection and its label explains what is
  needed.
- Try again clears the selected answer and result state.
- Previous and Next buttons are reachable and focus-visible.
- The result uses text such as Correct or Incorrect, not colour alone.

## Map-Click Practice

- Instructions say that mouse, pen, and touch are supported.
- The selected point marker appears after a click or tap.
- Tapping the map again moves the selected point before submission.
- The answer panel says whether a point is selected.
- Submit is disabled until a valid selected point exists.
- Submit has visible focus and references the selected-point status.
- The map remains tall enough to use at mobile width.
- If the map provider token is unavailable, the fallback message is readable.

## Route Drawing Practice

- Instructions explain Draw route and Move map modes.
- The learner can draw a continuous route line with mouse or touch.
- The page does not scroll while drawing on the map.
- Move map pans without adding route points.
- Draw route resumes drawing after switching back from Move map.
- Zoom out, zoom in, and Fit are large enough to tap.
- Undo last point removes the latest segment cleanly.
- Clear route removes the whole route.
- Reset view restores the full map extent.
- Finish / Submit is disabled until at least two route points exist.
- The route status message updates as points are captured.
- Start and destination markers remain visible above the route line.

## Mock Exam

- Question navigator buttons are large enough to tap.
- The current question, answered questions, and unanswered questions are
  distinguishable by text and labels, not colour alone.
- Restart exam and Change mode are reachable by keyboard.
- Map-click and route-drawing questions inside the mock exam keep their practice
  interaction behaviour.
- The submit confirmation dialog has a clear title, clear consequence text, and
  focus-visible action buttons.

## Results And Review

- Results display Pass or Not passed in text.
- Question review displays Passed or Not passed in text.
- Map-click review legends explain user marker versus correct marker.
- Route review legends explain user route versus accepted route.
- Review content remains readable at mobile width.
- Review action buttons are focus-visible and at least 44 px high.

## Progress And Mistakes

- Progress quick actions are focus-visible and easy to tap.
- Progress export, import, download, reset, and file choose controls are
  focus-visible.
- Mistake filters have visible labels.
- Mistake search, type, reviewed, and sort controls are usable on mobile.
- Selected mistake cards have an obvious selected state and `aria-pressed`.
- Mark as reviewed, Retry this question, Show Answer, and Try This Question
  Again are reachable and large enough to tap.
- Visual answer reviews include text legends and do not rely on colour alone.

## Keyboard Pass

- Tab through the main pages without losing the focus indicator.
- Shift+Tab moves backwards through controls predictably.
- Enter or Space activates buttons.
- Links open the expected pages with Enter.
- Disabled controls are skipped or announced as disabled by the browser.

## Screen Reader Smoke Check

- Status messages for selected answers, selected map points, and captured route
  points are announced when they change.
- Map-click submit describes the current selected-point status.
- Route submit describes the current route status.
- Toggle buttons expose pressed state where applicable.
- Dialog title and modal state are exposed for mock exam submission.

## Manual Browser Checks

- Complete a map-click practice question on desktop.
- Complete a map-click practice question on mobile width.
- Draw a route with a mouse.
- Draw a route with touch or mobile simulation.
- Use undo, clear, reset view, and submit on a route question.
- Review a failed route answer.
- Open `/progress/mistakes` and inspect a map-related mistake.
- Tab through `/learn`, `/practice`, `/mock-test`, `/progress`, and
  `/progress/mistakes`.
- Confirm no text overlaps or controls obscure the map on mobile.
