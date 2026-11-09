# SmartRent AI — Backend Test Suite

Automated tests for the backend API, written with **Jest** + **Supertest**,
mapped directly to the 24 test cases (TC-01 to TC-24) defined in the
Phase 2 SDS document ("Test Design" section).

## How to run

```bash
cd smartrent-backend
npm install
npm test
```

No real database connection is required — Mongoose models are mocked with
`jest.mock()`, so the tests run the actual route → middleware → controller
logic without touching MongoDB Atlas.

## Test files → Test Case mapping

| File | Test Cases Covered | Module |
|---|---|---|
| `auth.test.js` | TC-01, TC-02, TC-03, TC-04, TC-05 | Authentication |
| `property.test.js` | TC-06, TC-07, TC-08, TC-09, TC-10 | Property Management / Search |
| `recommendation.test.js` | TC-11 | AI Recommendation Engine |
| `rentPrediction.test.js` | TC-12 | Rent Prediction |
| `messaging.test.js` | TC-13, TC-14, TC-15 | Real-time Messaging |
| `profile.test.js` | TC-18 | Profile Management |
| `notification.test.js` | TC-19 | Notifications |
| `admin.test.js` | TC-20, TC-21, TC-22, TC-23 | Admin Management |

**TC-16, TC-17 (Voice Assistant) and TC-24 (Logout)** are frontend-only
behaviours (Web Speech API in the browser, and clearing the token from
`localStorage`) with no dedicated backend endpoint to call, so they are
covered instead in `MANUAL_TEST_CASES.md` as manual/UI test steps.

## Notes on the refactor

`server.js` used to build the Express app, connect to MongoDB, and start
listening all in one file — which made it impossible to import the app in a
test without also opening a real DB connection and a real port. It's now
split in two:

- **`app.js`** — builds and exports the Express app (routes, middleware,
  Socket.io wiring). No side effects. This is what the tests import.
- **`server.js`** — imports `app.js`, connects to MongoDB, and calls
  `server.listen()`. This is what `npm start` / `npm run dev` still run,
  completely unchanged in behaviour.
