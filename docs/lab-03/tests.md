# Lab 3 Test Plan

## 1. Test Strategy

Lab 3 uses automated API, UI component, and Playwright end-to-end tests to verify authentication, authorization, Requester regression, IT Staff workflows, Administrator user management, and preservation of Lab 2 behavior.

Testing is derived from:

* `docs/lab-03/specification.md`
* `docs/lab-03/api-spec.md`
* `docs/lab-03/ui-spec.md`
* completed Lab 2 behavior that must not regress

The final verification uses the actual test files present in the repository.

---

## 2. Actual Automated Test Suite

### 2.1 Backend API Tests

| Test File                                              | Test Area                              | Tests |
| ------------------------------------------------------ | -------------------------------------- | ----: |
| `server/tests/lab-01/categories.test.ts`               | Lab 1 category regression              |     1 |
| `server/tests/lab-01/health.test.ts`                   | Health check regression                |     1 |
| `server/tests/lab-02/attachments.api.test.ts`          | Attachment lifecycle                   |    10 |
| `server/tests/lab-02/create-ticket.api.test.ts`        | Ticket creation                        |     4 |
| `server/tests/lab-02/my-tickets.api.test.ts`           | My Tickets                             |     5 |
| `server/tests/lab-02/reference-data.api.test.ts`       | Reference data                         |     2 |
| `server/tests/lab-02/requesters.api.test.ts`           | Requester data                         |     1 |
| `server/tests/lab-02/ticket-detail.api.test.ts`        | Ticket detail                          |     2 |
| `server/tests/lab-03/auth.api.test.ts`                 | Authentication and password change     |     7 |
| `server/tests/lab-03/authorization.api.test.ts`        | Authentication/authorization isolation |     8 |
| `server/tests/lab-03/comments-notes.api.test.ts`       | Public comments/internal notes         |     2 |
| `server/tests/lab-03/staff-queue.api.test.ts`          | IT Staff queue                         |     3 |
| `server/tests/lab-03/staff-ticket-actions.api.test.ts` | Staff ticket actions                   |     2 |
| `server/tests/lab-03/staff-ticket-detail.api.test.ts`  | Staff ticket detail                    |     2 |
| `server/tests/lab-03/users-admin.api.test.ts`          | Administrator user management          |     7 |

**Final backend result: 15 test files passed, 57 tests passed.**

### 2.2 Authentication and Authorization Coverage

`server/tests/lab-03/auth.api.test.ts` verifies:

* active-user login;
* invalid credential handling;
* inactive-user login rejection;
* authenticated current-user access;
* password change;
* password validation;
* logout/session invalidation.

`server/tests/lab-03/authorization.api.test.ts` verifies:

* unauthenticated API protection;
* wrong-role rejection;
* Requester ticket ownership isolation;
* protection against development-header bypass;
* Requester attachment ownership isolation;
* internal-note protection;
* IT Staff access to staff APIs;
* Administrator access to safe user records.

### 2.3 Requester and Lab 2 Regression Coverage

The Lab 2 regression suite remains active and is included in final verification.

Relevant API tests:

* `server/tests/lab-02/create-ticket.api.test.ts`
* `server/tests/lab-02/my-tickets.api.test.ts`
* `server/tests/lab-02/ticket-detail.api.test.ts`
* `server/tests/lab-02/attachments.api.test.ts`
* `server/tests/lab-02/requesters.api.test.ts`
* `server/tests/lab-02/reference-data.api.test.ts`

These cover authenticated Requester ticket creation, ownership isolation, My Tickets behavior, ticket detail, reference data, and attachment lifecycle behavior.

### 2.4 IT Staff Coverage

`server/tests/lab-03/staff-queue.api.test.ts` verifies:

* queue search/filter/sort/pagination;
* validation errors;
* Requester denial of staff queue/assignment access.

`server/tests/lab-03/staff-ticket-detail.api.test.ts` verifies:

* complete staff ticket detail;
* requester information;
* assignment;
* IT Priority;
* status/history information.

`server/tests/lab-03/staff-ticket-actions.api.test.ts` verifies:

* claim/reassignment;
* IT Priority;
* status changes/history;
* public comments;
* internal-note restrictions.

`server/tests/lab-03/comments-notes.api.test.ts` verifies:

* staff public comments;
* internal notes;
* Requester public-comment access;
* Requester denial of internal notes.

### 2.5 Administrator Coverage

`server/tests/lab-03/users-admin.api.test.ts` verifies:

* `API-ADMIN-01` user listing with active/inactive and role filters;
* `API-ADMIN-02` user creation;
* `API-ADMIN-03` duplicate-email rejection;
* `API-ADMIN-04` profile, role, and active-state updates;
* `API-ADMIN-05` self-deactivation and last-active-Administrator protection;
* `API-ADMIN-06` preservation of historical ticket references after deactivation;
* `API-ADMIN-07` non-Administrator API denial.

---

## 3. Client UI Tests

The final client suite contains 12 test files and 38 passing tests.

Lab 3 UI tests include:

| Test File                                        | Coverage                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `client/tests/lab-03/Login.test.tsx`             | Login validation, successful login, safe login errors                |
| `client/tests/lab-03/ChangePassword.test.tsx`    | Password confirmation, validation, safe errors                       |
| `client/tests/lab-03/StaffQueue.test.tsx`        | Staff queue rendering, filters, states                               |
| `client/tests/lab-03/StaffTicketDetail.test.tsx` | Staff ticket controls, history, priority/comment actions             |
| `client/tests/lab-03/UserManagement.test.tsx`    | Admin user list, search, filters, create/edit callbacks, safe errors |

The Lab 3 UI tests verify the implemented components directly. There are no separate automated `RoleNavigation.test.tsx`, `Forbidden.test.tsx`, `UserForm.test.tsx`, or `UiStyle.test.tsx` files in the final repository.

**Final client result: 12 test files passed, 38 tests passed.**

---

## 4. Playwright End-to-End Tests

The final Playwright suite contains eight passing tests.

| Test                                      | Coverage                                                  |
| ----------------------------------------- | --------------------------------------------------------- |
| `e2e/authentication.spec.ts`              | Successful login/logout                                   |
| `e2e/authentication.spec.ts`              | Invalid login safe error                                  |
| `e2e/lab-02/attachment-lifecycle.spec.ts` | Attachment upload/download/soft-removal/download blocking |
| `e2e/lab-02/create-ticket.spec.ts`        | Requester Ticket creation and opening from My Tickets     |
| `e2e/staff-ticket-flow.spec.ts`           | IT Staff queue and filtering                              |
| `e2e/staff-ticket-flow.spec.ts`           | IT Staff ticket detail and controls                       |
| `e2e/user-administration.spec.ts`         | Administrator user management and filtering               |
| `e2e/user-administration.spec.ts`         | Administrator create-user workflow                        |

**Final E2E result: 8 tests passed.**

The final E2E suite does not contain separate `e2e/lab-03/requester-regression.spec.ts`, `staff-workflow.spec.ts`, `admin-users.spec.ts`, `responsive.spec.ts`, or `accessibility.spec.ts` files.

---

## 5. Acceptance-Criterion Traceability

| Acceptance Criterion | Final Evidence                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------- |
| AC-01                | `auth.api.test.ts`, `Login.test.tsx`, authentication E2E                                      |
| AC-02                | `auth.api.test.ts`, `Login.test.tsx`                                                          |
| AC-03                | `auth.api.test.ts`, `Login.test.tsx`                                                          |
| AC-04                | `auth.api.test.ts`, `ChangePassword.test.tsx`, authentication E2E                             |
| AC-05                | `authorization.api.test.ts`                                                                   |
| AC-06                | `authorization.api.test.ts`                                                                   |
| AC-07–AC-09          | Implemented role-based navigation verified through final UI/E2E flows and authorization tests |
| AC-10–AC-13          | Lab 2 API regression tests and requester E2E                                                  |
| AC-14–AC-23          | Staff queue/detail/action API tests, staff UI tests, and staff E2E                            |
| AC-24–AC-28          | Administrator API tests, `UserManagement.test.tsx`, and Administrator E2E                     |
| AC-29                | UI specification and responsive implementation; manual screenshot evidence required           |
| AC-30                | UI specification and implemented accessibility behavior; manual evidence required             |

All implemented automated test areas have corresponding final test files. AC-29 and AC-30 require separate visual/manual evidence rather than being falsely reported as automated Playwright tests.

---

## 6. Regression Checklist

The final automated regression suite covers:

* Requester Ticket creation;
* backend-generated Ticket Number;
* duplicate client request protection;
* authenticated My Tickets ownership;
* My Tickets search/filter/sort/pagination;
* requester Ticket Detail;
* cross-requester Ticket isolation;
* Attachment upload;
* Attachment validation;
* Attachment active-count limit;
* Attachment download;
* Attachment soft removal;
* removed Attachment download blocking;
* authentication/session behavior.

The final Lab 2 API and E2E regression tests passed.

Responsive and accessibility checks require additional manual evidence and are not claimed as automated test results in this document.

---

## 7. Final Verification Commands

### Backend tests

```bash
cd server
npm test
```

Result:

```text
15 test files passed
57 tests passed
```

### Client tests

```bash
cd client
npm test
```

Result:

```text
12 test files passed
38 tests passed
```

### End-to-end tests

From the repository root:

```bash
npm run test:e2e
```

Result:

```text
8 passed
```

### Backend production build

```bash
cd server
npm run build
```

Result:

```text
PASS
```

### Client production build

```bash
cd client
npm run build
```

Result:

```text
PASS
```

---

## 8. Final Verification Status

| Verification               | Result                   |
| -------------------------- | ------------------------ |
| Backend API tests          | PASS — 57/57             |
| Client UI tests            | PASS — 38/38             |
| Playwright E2E             | PASS — 8/8               |
| Backend TypeScript build   | PASS                     |
| Client production build    | PASS                     |
| Lab 2 API regression       | PASS                     |
| Lab 2 E2E regression       | PASS                     |
| Responsive visual evidence | Manual evidence required |
| Accessibility evidence     | Manual evidence required |

No required automated test is skipped or disabled in the final verification suite.

---

## 9. Documentation Review Checklist

* [x] `specification.md` defines Lab 3 scope, business rules, and acceptance criteria.
* [x] `api-spec.md` defines authentication, authorization, Requester, Staff, and Administrator APIs.
* [x] `ui-spec.md` defines required screens, states, responsive behavior, and accessibility expectations.
* [x] `tests.md` maps implemented test coverage to Lab 3 acceptance criteria.
* [x] Lab 2 preservation is documented.
* [x] Final automated verification results are recorded.
* [x] Responsive screenshots/evidence are added.
* [x] Accessibility evidence is added.
* [x] Reviewer evidence is added.
* [x] AI-use reflection is added.
* [x] Final documentation is committed on `lab3-staging`.
* [x] Final staging PR is reviewed and merged to `main`.
