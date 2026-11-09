# Manual Test Cases (Frontend-only)

These 3 test cases from the Phase 2 SDS "Test Design" table have no backend
API of their own to call from Jest — they live entirely in the browser
(Web Speech API, `localStorage`). Run these manually before the FYP defense
and record the result.

| Test ID | Scenario | Steps | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|---|
| TC-16 | User provides a valid voice command | 1. Log in. 2. Click the mic icon in the navbar. 3. Say "search properties in Lahore" (or the Urdu equivalent). | The Voice Assistant recognizes the command and navigates to `/properties` with the location filter applied. | | |
| TC-17 | User provides an unclear voice command | 1. Click the mic icon. 2. Say something unrelated/mumbled, e.g. "banana weather rocket". | The assistant responds with a spoken/visual "Sorry, I didn't understand that" message instead of crashing or navigating incorrectly. | | |
| TC-24 | User logs out from the application | 1. While logged in, click "Logout" in the navbar. | The JWT token is cleared from `localStorage`, the user state resets, and the user is redirected to the `/login` screen. | | |

## Why these are manual and not in the Jest suite

- TC-16 / TC-17 depend on the browser's `SpeechRecognition` API, which does
  not exist in a Node.js/Jest test environment and cannot be meaningfully
  mocked without testing browser internals instead of the app's logic.
- TC-24 is a pure frontend state reset (clearing `localStorage` + a route
  change) — there is no `/api/auth/logout` endpoint by design, since the
  backend uses stateless JWTs.

If a frontend testing setup (e.g. Vitest + React Testing Library) is added
later, these three can be automated too.
