# Lab 4 — Test Plan and Acceptance-Criterion Traceability

## 1. Purpose

This document defines the tests required to verify Lab 4 Actions Taken,
Ticket workflow, Requester Dashboard, IT Staff Dashboard, security,
regression behavior, and final application quality.

Tests must be planned before or alongside implementation. A test must
not be marked Passed until it has actually been executed successfully.

## 2. Test Strategy

Testing includes:

- Unit and validation tests.
- Backend API and integration tests.
- Authorization and ownership tests.
- Database migration and seed tests.
- Frontend component and UI-style tests.
- Ticket workflow and concurrency tests.
- Responsive and accessibility checks.
- Performance-smoke tests.
- Playwright end-to-end tests.
- Full regression testing for Labs 1–3.

## 3. Planned Test Files

### Backend

- `server/tests/lab-04/actions-taken.api.test.ts`
- `server/tests/lab-04/ticket-workflow.api.test.ts`
- `server/tests/lab-04/requester-dashboard.api.test.ts`
- `server/tests/lab-04/staff-dashboard.api.test.ts`

### Frontend

Use the existing client test conventions when creating these files.

- `client/src/components/StaffDashboard.test.tsx`
- `client/src/components/RequesterDashboard.test.tsx`
- `client/src/components/ActionsTaken.test.tsx`
- `client/src/components/TicketWorkflow.test.tsx`

### End-to-End

- `e2e/lab-04/actions-taken-flow.spec.ts`
- `e2e/lab-04/ticket-resolution.spec.ts`
- `e2e/lab-04/dashboards.spec.ts`

### Additional Coverage

Database migration, seed, accessibility, responsive layout, and
performance-smoke tests will use the existing project test conventions
where appropriate.

If implementation reveals that an existing test file is a better fit,
update this plan to record the actual path.

## 4. Backend API and Authorization Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| API-01 | AC-01 | Create Action Taken with valid data | Action is saved under the correct Ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-02 | AC-02 | Create an action while authenticated as a staff user | Performer is derived from authenticated identity | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-03 | AC-03 | Submit an action requiring follow-up without a follow-up note | Request is rejected with a safe validation error | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-04 | AC-03 | Submit an action with follow-up information | Valid follow-up note is saved | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-05 | AC-01 | Create an action with missing required fields or invalid values | Request is rejected without creating an invalid record | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-06 | AC-04 | Requester retrieves actions for an owned Ticket | Permitted Action Taken information is returned | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-07 | AC-04 | Requester attempts to create or edit an action | Request is forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-08 | AC-04 | Requester attempts to access another Requester's Ticket actions | Access is denied without leaking private information | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-09 | AC-01 | IT Staff or Administrator accesses a permitted Ticket | Authorized create and update operations succeed | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-10 | AC-05 | Retrieve a Ticket containing multiple actions | All actions are returned in stable order | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-11 | AC-01 | Reference a nonexistent or inaccessible Ticket | Safe not-found or forbidden response is returned | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-12 | AC-01 | Repeat a submission or retry a request | Duplicate or conflicting behavior is handled safely | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |

## 5. Ticket Workflow Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| WF-01 | AC-07 | Execute each permitted status transition | Status changes according to the approved matrix | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-02 | AC-07 | Attempt a transition not permitted by the matrix | Backend rejects the transition | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-03 | AC-06 | Resolve a Ticket without any Action Taken | Resolution is rejected | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-04 | AC-06 | Resolve a Ticket when its most recent action requires follow-up | Resolution is rejected | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-05 | AC-06 | Resolve a Ticket when the resolution requirements are satisfied | Resolution succeeds for an authorized user | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-06 | AC-06 | Requester submits “Problem Appears Resolved” feedback | Feedback does not automatically change Ticket status | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-07 | AC-07 | Attempt a status change without required authorization | Backend rejects the operation | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-08 | AC-07 | Attempt to transition a Cancelled Ticket | Backend rejects the transition | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-09 | AC-07 | Two users attempt conflicting or stale Ticket updates | Stale changes are detected or safely rejected | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-10 | AC-07 | Complete a successful status change | Ticket summary refreshes with the saved status | `client/src/components/TicketWorkflow.test.tsx` | Planned |

The transition tests must follow the approved matrix in
`docs/lab-04/specification.md`. If the matrix changes, update both
documents and the relevant tests.

## 6. Dashboard API Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| DASH-01 | AC-08 | Retrieve Requester Dashboard data | Only the authenticated Requester's data is included | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| DASH-02 | AC-08 | Request dashboard data with no matching Tickets | Counts are zero and lists are empty | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| DASH-03 | AC-08 | Verify open, waiting, recent-update, and recent-resolution metrics | Values match the documented calculations | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| DASH-04 | AC-08 | Request another Requester's dashboard information | Unauthorized data is not returned | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| DASH-05 | AC-09 | Retrieve IT Staff Dashboard data | Only approved operational metrics are returned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| DASH-06 | AC-09 | Verify unassigned and current-user-owned Ticket counts | Counts match authoritative database queries | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| DASH-07 | AC-09 | Verify status and IT Priority summaries | Counts match the documented grouping rules | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| DASH-08 | AC-09 | Access the Staff Dashboard as Administrator | Approved Administrator access succeeds | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| DASH-09 | AC-09 | Access the Staff Dashboard as an unauthorized role | Access is denied | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| DASH-10 | AC-10 | Inspect dashboard response structure | Response contains concise summaries rather than full Ticket collections | `server/tests/lab-04/requester-dashboard.api.test.ts` and `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |

Dashboard calculations, date boundaries, and time-zone handling must
match the engineering specification.

## 7. Database Migration and Regression Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| DB-01 | AC-11 | Apply the Lab 4 migration to a Lab 3 database | Migration completes without discarding existing data | Existing project migration-test conventions | Planned |
| DB-02 | AC-11 | Inspect existing Users, Tickets, Attachments, Comments, and Notes after migration | Existing records remain valid | Existing project migration-test conventions | Planned |
| DB-03 | AC-11 | Run the seed operation more than once | No unintended duplicate seed records are created | Existing project seed-test conventions | Planned |
| DB-04 | AC-05 | Retrieve a Ticket without Actions Taken | Ticket remains accessible and its action list is empty | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| REG-01 | AC-12 | Run existing Lab 1 API and client regression tests | Previously approved behavior continues to work | Existing Lab 1 test files | Planned |
| REG-02 | AC-12 | Run existing Lab 2 requester ticket and attachment tests | Ticket creation, listing, details, and attachments continue to work | Existing Lab 2 test files | Planned |
| REG-03 | AC-12 | Run existing Lab 3 authentication and authorization tests | Roles, sessions, ownership, and protected operations continue to work | Existing Lab 3 test files | Planned |
| REG-04 | AC-12 | Run IT Staff, Internal Notes, and Administrator user-management regression tests | Existing authorized workflows continue to work | Existing Lab 3 test files | Planned |

Database tests must use a controlled test database and must not reset
or destroy real project data.

## 8. Frontend Component and UI-Style Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| UI-01 | AC-05 | Render Actions Taken with multiple records | Each action is displayed in stable order | `client/src/components/ActionsTaken.test.tsx` | Planned |
| UI-02 | AC-03 | Submit incomplete Action Taken form data | Appropriate validation messages appear | `client/src/components/ActionsTaken.test.tsx` | Planned |
| UI-03 | AC-04 | Render Actions Taken as Requester | Actions are read-only and no write controls are offered | `client/src/components/ActionsTaken.test.tsx` | Planned |
| UI-04 | AC-01 | Submit a valid create or edit form | Saved action information appears after success | `client/src/components/ActionsTaken.test.tsx` | Planned |
| UI-05 | AC-08 | Render Requester Dashboard metrics and Ticket links | Correct labels, values, and destinations appear | `client/src/components/RequesterDashboard.test.tsx` | Planned |
| UI-06 | AC-09 | Render Staff Dashboard metrics and Ticket links | Correct operational information and destinations appear | `client/src/components/StaffDashboard.test.tsx` | Planned |
| UI-07 | AC-10 | Select an actionable dashboard metric | Correct filtered view or Ticket Detail is opened | Dashboard component tests | Planned |
| UI-08 | AC-13 | Inspect loading, empty, validation, and failure states | Feedback is visible and understandable | Relevant component tests | Planned |
| UI-09 | AC-13 | Inspect keyboard focus and form labels | Controls are labelled and keyboard-operable | Relevant component and accessibility tests | Planned |
| UI-10 | AC-13 | Inspect badges, cards, tables, and responsive layouts | Components retain consistent Zen Green styling | Existing UI-style test conventions | Planned |

## 9. Responsive and Accessibility Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| A11Y-01 | AC-13 | Test keyboard navigation through new forms and dashboard actions | Focus is visible and keyboard operation works | Relevant frontend test files | Planned |
| A11Y-02 | AC-13 | Inspect labels and validation messages | Form fields and errors are accessible | Relevant frontend test files | Planned |
| RESP-01 | AC-13 | Inspect desktop layout | No clipped or overlapping major content | UI-style and visual inspection | Planned |
| RESP-02 | AC-13 | Inspect tablet layout | Dashboard cards and tables remain usable | UI-style and visual inspection | Planned |
| RESP-03 | AC-13 | Inspect mobile layout | Forms and dashboard actions remain usable without page-level horizontal overflow | UI-style and visual inspection | Planned |
| RESP-04 | AC-13 | Inspect status and priority indicators | Information is distinguishable without relying on color alone | UI-style and visual inspection | Planned |

## 10. Performance-Smoke and Safe-Failure Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| PERF-01 | AC-09 | Load dashboard metrics with representative seeded data | Dashboard returns correctly without an unexpected error | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| PERF-02 | AC-08 | Load Requester metrics with representative data | Dashboard returns promptly under the local test environment | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| SAFE-01 | AC-14 | Simulate recoverable API failure during form submission | Safe error is shown and entered data is retained | `client/src/components/ActionsTaken.test.tsx` | Planned |
| SAFE-02 | AC-14 | Submit invalid or stale workflow updates | A safe validation or conflict response is returned | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| SAFE-03 | AC-14 | Inspect API error responses | Secrets, password hashes, private notes, and unauthorized information are not exposed | Relevant server API tests | Planned |

Performance-smoke results must record the environment, dataset size,
observed behavior, and any unexpected bottlenecks. Do not claim a
performance target has been met unless it has been measured.

## 11. End-to-End Tests

| Test ID | Requirement / AC | Test | Expected Result | Test File | Status |
|---|---|---|---|---|---|
| E2E-01 | AC-01, AC-02, AC-03, AC-05 | Authorized staff creates and edits multiple Actions Taken on one Ticket | Correct actions and authenticated performer are displayed | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| E2E-02 | AC-04 | Requester opens an owned Ticket with existing Actions Taken | Requester can view actions but cannot modify them | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| E2E-03 | AC-06, AC-07 | Exercise permitted and rejected Ticket transitions | Workflow rules are enforced and status is refreshed | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| E2E-04 | AC-08, AC-10 | Open Requester Dashboard and select an actionable metric | Only the Requester's data appears and drill-down works | `e2e/lab-04/dashboards.spec.ts` | Planned |
| E2E-05 | AC-09, AC-10 | Open Staff Dashboard and select an actionable metric | Operational metrics and drill-down work correctly | `e2e/lab-04/dashboards.spec.ts` | Planned |
| E2E-06 | AC-12, AC-14 | Exercise representative earlier-lab workflows and recoverable failures | Regression behavior remains correct and failures are safe | Existing E2E tests plus Lab 4 regression coverage | Planned |

## 12. Acceptance-Criterion Traceability

| Acceptance Criterion | Planned Test IDs |
|---|---|
| AC-01 — Create Action Taken | API-01, API-05, API-09, E2E-01 |
| AC-02 — Performer Identity | API-02, E2E-01 |
| AC-03 — Follow-Up Validation | API-03, API-04, UI-02, E2E-01 |
| AC-04 — Action Visibility | API-06, API-07, API-08, UI-03, E2E-02 |
| AC-05 — Multiple Actions | API-10, DB-04, UI-01, E2E-01 |
| AC-06 — Ticket Resolution | WF-03, WF-04, WF-05, WF-06, E2E-03 |
| AC-07 — Status Authorization | WF-01, WF-02, WF-07, WF-08, WF-09, WF-10, E2E-03 |
| AC-08 — Requester Dashboard | DASH-01, DASH-02, DASH-03, DASH-04, UI-05, E2E-04 |
| AC-09 — Staff Dashboard | DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, PERF-01, UI-06, E2E-05 |
| AC-10 — Drill-Down | DASH-10, UI-07, E2E-04, E2E-05 |
| AC-11 — Migration Preservation | DB-01, DB-02, DB-03, DB-04 |
| AC-12 — Regression | REG-01, REG-02, REG-03, REG-04, E2E-06 |
| AC-13 — Responsive and Accessible UI | UI-09, UI-10, A11Y-01, A11Y-02, RESP-01, RESP-02, RESP-03, RESP-04 |
| AC-14 — Final Verification | SAFE-01, SAFE-02, SAFE-03, PERF-01, PERF-02, E2E-06 |

## 13. Final Test Execution Record

All statuses remain Planned until the tests are actually executed.

| Test Group | Planned | Passed | Failed | Not Run |
|---|---:|---:|---:|---:|
| API and Authorization | 12 | 0 | 0 | 12 |
| Ticket Workflow | 10 | 0 | 0 | 10 |
| Dashboard API | 10 | 0 | 0 | 10 |
| Database and Regression | 8 | 0 | 0 | 8 |
| Frontend and UI Style | 10 | 0 | 0 | 10 |
| Responsive and Accessibility | 6 | 0 | 0 | 6 |
| Performance and Safe Failure | 5 | 0 | 0 | 5 |
| End-to-End | 6 | 0 | 0 | 6 |

Update this table using actual results after execution.

## 14. Test Completion Criteria

- [ ] All planned tests have been implemented or their approved alternatives documented.
- [ ] Every acceptance criterion maps to one or more tests.
- [ ] API and authorization tests pass.
- [ ] Database migration and seed tests pass.
- [ ] Ticket workflow and conflict tests pass.
- [ ] Dashboard calculations match authoritative database data.
- [ ] Frontend, responsive, and accessibility checks are completed.
- [ ] End-to-end tests pass.
- [ ] Labs 1–3 regression suites pass.
- [ ] Production builds succeed.
- [ ] Actual test output and results are recorded accurately.
- [ ] Final verification is performed on the integrated main branch.