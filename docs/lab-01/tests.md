# Lab 1 — Test Plan and Evidence

All test files are located under `server/tests/lab-01/` and `client/tests/lab-01/`.

| Test ID | Tool | Test Description | Result |
|---|---|---|---|
| API-01 | Supertest + Vitest | `GET /api/health` returns HTTP 200 and the expected JSON response | Passed |
| API-02 | Supertest + Vitest | `GET /api/categories` returns the four seeded IT request categories | Passed |
| UI-01 | Vitest + React Testing Library | TokTickIT heading renders correctly | Passed |
| UI-02 | Vitest + React Testing Library | Successful API response displays Online status and the seeded category list | Passed |
| UI-03 | Vitest + React Testing Library | API failure displays Offline status and a useful error message | Passed |

## Test Results

### Backend Tests

- `server/tests/lab-01/health.test.ts` — Passed
- `server/tests/lab-01/categories.test.ts` — Passed
- Test Files: **2 passed**
- Tests: **2 passed**

### Frontend Tests

- `client/tests/lab-01/App.test.ts` — Passed
- Test Files: **1 passed**
- Tests: **3 passed**

### Final Result

All **5 Lab 1 tests passed successfully on the `main` branch**.