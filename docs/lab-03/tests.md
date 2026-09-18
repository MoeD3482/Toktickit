# Lab 3 Test Plan

## 1. Test Strategy

Lab 3 uses traceable automated testing to verify authentication, authorization, Requester regression, IT Staff workflows, Administrator user management, and responsive UI behavior.

Testing is derived from:

- `docs/lab-03/specification.md`
- `docs/lab-03/api-spec.md`
- `docs/lab-03/ui-spec.md`
- completed Lab 2 behavior that must not regress

No Acceptance Criterion is considered complete without planned test evidence.

---

## 2. Planned Tests

### 2.1 Authentication Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Planned Test File |
|---|---|---|---|---|---|
| API-AUTH-01 | API | FR-01, AC-01 | Valid login | Active user signs in and receives current-user response | `server/tests/lab-03/auth.api.test.ts` |
| API-AUTH-02 | API | FR-02, BR-10, AC-02 | Invalid login | Safe generic error and no session | `server/tests/lab-03/auth.api.test.ts` |
| API-AUTH-03 | API | FR-03, BR-09 | Password storage | Stored password is hashed and plain text is never returned | `server/tests/lab-03/auth.api.test.ts` |
| API-AUTH-04 | API | FR-07, BR-07, AC-03 | Inactive login | Inactive user cannot sign in | `server/tests/lab-03/auth.api.test.ts` |
| API-AUTH-05 | API | FR-05, AC-04 | Logout | Session is invalidated and protected endpoint fails afterward | `server/tests/lab-03/auth.api.test.ts` |
| API-AUTH-06 | API | FR-06, AC-01 | Current user | Authenticated user can retrieve session user | `server/tests/lab-03/auth.api.test.ts` |
| UI-AUTH-01 | UI | AC-01 | Login success UI | Current user appears after sign-in | `client/tests/lab-03/Login.test.tsx` |
| UI-AUTH-02 | UI | AC-02, AC-03 | Login failure UI | Generic failure appears for invalid or inactive login | `client/tests/lab-03/Login.test.tsx` |
| UI-AUTH-03 | UI | AC-04 | Sign out UI | Sign out returns user to login and hides protected screens | `client/tests/lab-03/AppShell.test.tsx` |

### 2.2 Authorization Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Planned Test File |
|---|---|---|---|---|---|
| API-AUTHZ-01 | API | FR-11, AC-05 | Unauthenticated protected access | Protected endpoint returns 401 | `server/tests/lab-03/authorization.api.test.ts` |
| API-AUTHZ-02 | API | FR-08, FR-10, AC-06 | Wrong role protected access | Restricted endpoint returns 403 | `server/tests/lab-03/authorization.api.test.ts` |
| UI-AUTHZ-01 | UI | FR-09, AC-07 | Requester navigation | Requester sees only requester navigation | `client/tests/lab-03/RoleNavigation.test.tsx` |
| UI-AUTHZ-02 | UI | FR-09, AC-08 | IT Staff navigation | IT Staff sees staff workflow and not admin-only navigation | `client/tests/lab-03/RoleNavigation.test.tsx` |
| UI-AUTHZ-03 | UI | FR-09, AC-09 | Admin navigation | Administrator sees user-management navigation | `client/tests/lab-03/RoleNavigation.test.tsx` |
| UI-AUTHZ-04 | UI | AC-28 | Forbidden state | Non-admin route access shows safe forbidden screen | `client/tests/lab-03/Forbidden.test.tsx` |

### 2.3 Requester Regression Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Planned Test File |
|---|---|---|---|---|---|
| API-REQREG-01 | API | FR-12, AC-10 | Authenticated Ticket creation | Ticket requester is current signed-in Requester | `server/tests/lab-03/requester-regression.api.test.ts` |
| API-REQREG-02 | API | FR-13, AC-11 | Authenticated My Tickets | Only signed-in Requester's Tickets are returned | `server/tests/lab-03/requester-regression.api.test.ts` |
| API-REQREG-03 | API | FR-14, AC-12 | Cross-requester Ticket access | Other Requester's Ticket is rejected | `server/tests/lab-03/requester-regression.api.test.ts` |
| API-REQREG-04 | API | FR-15, AC-12, AC-13 | Attachment ownership and lifecycle | Lab 2 Attachment rules work with authenticated user | `server/tests/lab-03/requester-attachments.api.test.ts` |
| API-REQREG-05 | API | FR-16, AC-13 | Lab 2 list behavior | Search, filters, sorting, pagination still work | `server/tests/lab-03/requester-regression.api.test.ts` |
| UI-REQREG-01 | UI | AC-10 | No requester selector | Create Ticket uses current user and selector is absent | `client/tests/lab-03/RequesterRegression.test.tsx` |
| UI-REQREG-02 | UI | AC-13 | Requester screens | Create, My Tickets, Detail, Attachment UI still behave | `client/tests/lab-03/RequesterRegression.test.tsx` |
| E2E-REQ-01 | E2E | AC-10, AC-11, AC-13 | Main requester flow | Login -> create -> find -> open detail -> manage attachment | `e2e/lab-03/requester-regression.spec.ts` |

### 2.4 IT Staff Workflow Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Planned Test File |
|---|---|---|---|---|---|
| API-STAFF-01 | API | FR-17, AC-14 | Staff queue access | IT Staff can retrieve Tickets across Requesters | `server/tests/lab-03/staff-tickets.api.test.ts` |
| API-STAFF-02 | API | FR-18, AC-15 | Queue query behavior | Search, filters, sorting, pagination follow contract | `server/tests/lab-03/staff-tickets.api.test.ts` |
| API-STAFF-03 | API | FR-19, AC-16 | Staff Ticket Detail | Staff detail returns staff fields and histories | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| API-STAFF-04 | API | FR-20, AC-17 | Assignment | Assignment to active IT Staff is saved and recorded | `server/tests/lab-03/staff-ticket-actions.api.test.ts` |
| API-STAFF-05 | API | BR-18, AC-17 | Invalid assignment | Assignment to inactive or non-staff user is rejected | `server/tests/lab-03/staff-ticket-actions.api.test.ts` |
| API-STAFF-06 | API | FR-21, AC-18 | IT Priority | IT Priority updates separately from Requested Priority | `server/tests/lab-03/staff-ticket-actions.api.test.ts` |
| API-STAFF-07 | API | FR-22, AC-19 | Valid status transition | Status updates and actor/timestamp are recorded | `server/tests/lab-03/staff-ticket-actions.api.test.ts` |
| API-STAFF-08 | API | BR-22, AC-20 | Invalid status transition | Invalid transition is rejected safely | `server/tests/lab-03/staff-ticket-actions.api.test.ts` |
| API-STAFF-09 | API | FR-23, AC-21 | Public comments | Authorized public comment is saved and visible | `server/tests/lab-03/comments.api.test.ts` |
| API-STAFF-10 | API | FR-24, AC-22 | Internal notes | Internal note is hidden from Requester | `server/tests/lab-03/internal-notes.api.test.ts` |
| API-STAFF-11 | API | FR-25, AC-23 | Actions Taken | Action is saved with actor and timestamp | `server/tests/lab-03/staff-ticket-actions.api.test.ts` |
| UI-STAFF-01 | UI | AC-14, AC-15 | Staff queue UI | Queue renders filters, results, pagination, states | `client/tests/lab-03/StaffQueue.test.tsx` |
| UI-STAFF-02 | UI | AC-16 | Staff detail UI | Staff controls appear for IT Staff | `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| UI-STAFF-03 | UI | AC-17, AC-18, AC-19 | Staff edit controls | Assignment, IT Priority, and status controls save states | `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| UI-STAFF-04 | UI | AC-21, AC-22, AC-23 | Staff notes and actions | Public comments, internal notes, and actions render correctly | `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| E2E-STAFF-01 | E2E | AC-14, AC-17, AC-18, AC-19, AC-23 | Staff workflow | Login as staff -> queue -> assign -> prioritize -> transition -> action | `e2e/lab-03/staff-workflow.spec.ts` |

### 2.5 Administrator User Management Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Planned Test File |
|---|---|---|---|---|---|
| API-ADMIN-01 | API | FR-26, AC-24 | User list | Admin can list active and inactive users with roles | `server/tests/lab-03/admin-users.api.test.ts` |
| API-ADMIN-02 | API | FR-27, AC-25 | Create user | Valid user is created with roles and active state | `server/tests/lab-03/admin-users.api.test.ts` |
| API-ADMIN-03 | API | BR-04, AC-25 | Duplicate email | Duplicate email is rejected | `server/tests/lab-03/admin-users.api.test.ts` |
| API-ADMIN-04 | API | FR-28, FR-29, FR-30, AC-26 | Update user | Profile, roles, and active state are updated | `server/tests/lab-03/admin-users.api.test.ts` |
| API-ADMIN-05 | API | FR-31, BR-06, AC-27 | Last admin protection | Last usable Administrator cannot be deactivated or deroled | `server/tests/lab-03/admin-users.api.test.ts` |
| API-ADMIN-06 | API | FR-32, AC-26 | Historical records | Deactivation keeps historical Ticket references intact | `server/tests/lab-03/admin-users.api.test.ts` |
| API-ADMIN-07 | API | AC-28 | Non-admin API denial | Non-admin cannot access user management API | `server/tests/lab-03/admin-users.api.test.ts` |
| UI-ADMIN-01 | UI | AC-24 | User list UI | Admin list renders users, roles, filters, and states | `client/tests/lab-03/UserManagement.test.tsx` |
| UI-ADMIN-02 | UI | AC-25 | Create user UI | Admin can submit valid create user form | `client/tests/lab-03/UserForm.test.tsx` |
| UI-ADMIN-03 | UI | AC-26 | Edit user UI | Admin can edit supported fields and roles | `client/tests/lab-03/UserForm.test.tsx` |
| UI-ADMIN-04 | UI | AC-27 | Last admin warning | UI shows safe failure when last admin protection applies | `client/tests/lab-03/UserForm.test.tsx` |
| E2E-ADMIN-01 | E2E | AC-24, AC-25, AC-26, AC-27 | Admin workflow | Login as admin -> create user -> edit roles -> verify protection | `e2e/lab-03/admin-users.spec.ts` |

### 2.6 Responsive and Accessibility Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Planned Test File |
|---|---|---|---|---|---|
| E2E-RESP-01 | E2E | AC-29 | Desktop viewport | Lab 3 screens usable at `>= 992px` | `e2e/lab-03/responsive.spec.ts` |
| E2E-RESP-02 | E2E | AC-29 | Tablet viewport | Lab 3 screens usable at `768-991px` | `e2e/lab-03/responsive.spec.ts` |
| E2E-RESP-03 | E2E | AC-29 | Mobile viewport | Lab 3 screens usable below `768px` without horizontal scroll | `e2e/lab-03/responsive.spec.ts` |
| E2E-A11Y-01 | E2E | AC-30 | Keyboard login and navigation | Login, shell navigation, and sign out work by keyboard | `e2e/lab-03/accessibility.spec.ts` |
| E2E-A11Y-02 | E2E | AC-30 | Keyboard forms | Ticket, staff, and admin forms are keyboard operable | `e2e/lab-03/accessibility.spec.ts` |
| UI-STYLE-01 | UI | AC-29, AC-30 | Labels, focus, and states | Required labels, focus indicators, and disabled/busy states exist | `client/tests/lab-03/UiStyle.test.tsx` |

---

## 3. Acceptance-Criterion Traceability

| Acceptance Criterion | Planned Test Evidence |
|---|---|
| AC-01 | API-AUTH-01, API-AUTH-06, UI-AUTH-01 |
| AC-02 | API-AUTH-02, UI-AUTH-02 |
| AC-03 | API-AUTH-04, UI-AUTH-02 |
| AC-04 | API-AUTH-05, UI-AUTH-03 |
| AC-05 | API-AUTHZ-01 |
| AC-06 | API-AUTHZ-02 |
| AC-07 | UI-AUTHZ-01 |
| AC-08 | UI-AUTHZ-02 |
| AC-09 | UI-AUTHZ-03 |
| AC-10 | API-REQREG-01, UI-REQREG-01, E2E-REQ-01 |
| AC-11 | API-REQREG-02, E2E-REQ-01 |
| AC-12 | API-REQREG-03, API-REQREG-04 |
| AC-13 | API-REQREG-04, API-REQREG-05, UI-REQREG-02, E2E-REQ-01 |
| AC-14 | API-STAFF-01, UI-STAFF-01, E2E-STAFF-01 |
| AC-15 | API-STAFF-02, UI-STAFF-01 |
| AC-16 | API-STAFF-03, UI-STAFF-02 |
| AC-17 | API-STAFF-04, API-STAFF-05, UI-STAFF-03, E2E-STAFF-01 |
| AC-18 | API-STAFF-06, UI-STAFF-03, E2E-STAFF-01 |
| AC-19 | API-STAFF-07, UI-STAFF-03, E2E-STAFF-01 |
| AC-20 | API-STAFF-08 |
| AC-21 | API-STAFF-09, UI-STAFF-04 |
| AC-22 | API-STAFF-10, UI-STAFF-04 |
| AC-23 | API-STAFF-11, UI-STAFF-04, E2E-STAFF-01 |
| AC-24 | API-ADMIN-01, UI-ADMIN-01, E2E-ADMIN-01 |
| AC-25 | API-ADMIN-02, API-ADMIN-03, UI-ADMIN-02, E2E-ADMIN-01 |
| AC-26 | API-ADMIN-04, API-ADMIN-06, UI-ADMIN-03, E2E-ADMIN-01 |
| AC-27 | API-ADMIN-05, UI-ADMIN-04, E2E-ADMIN-01 |
| AC-28 | API-ADMIN-07, UI-AUTHZ-04 |
| AC-29 | E2E-RESP-01, E2E-RESP-02, E2E-RESP-03, UI-STYLE-01 |
| AC-30 | E2E-A11Y-01, E2E-A11Y-02, UI-STYLE-01 |

Every Acceptance Criterion has at least one planned test.

---

## 4. Regression Checklist

These Lab 2 behaviors must be checked during Lab 3 verification:

- [ ] Requester can create Ticket.
- [ ] Ticket Number remains backend-generated.
- [ ] Duplicate client request ID still prevents duplicate Ticket creation.
- [ ] My Tickets returns only authenticated Requester's Tickets.
- [ ] My Tickets search works.
- [ ] My Tickets filters work.
- [ ] My Tickets sorting works.
- [ ] My Tickets pagination works.
- [ ] Requester Ticket Detail is read-only for requester-entered Ticket fields.
- [ ] Cross-requester Ticket access is rejected.
- [ ] Attachment upload accepts permitted file types.
- [ ] Attachment upload rejects unsupported or oversized files.
- [ ] Sixth active Attachment is rejected.
- [ ] Attachment download works for active owned Attachments.
- [ ] Attachment soft removal retains metadata.
- [ ] Removed Attachment cannot be downloaded.
- [ ] Removed Attachment metadata remains visible without active download action.
- [ ] Responsive layouts still work on desktop, tablet, and mobile.

---

## 5. Test Commands

These commands are expected for final Lab 3 verification.

### Backend Tests

```bash
cd server
npm test
```

### Client Tests

```bash
cd client
npm test
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Production Builds

```bash
cd server
npm run build
```

```bash
cd client
npm run build
```

---

## 6. Documentation Review Checklist

- [ ] `specification.md` lists Lab 3 scope, business rules, acceptance criteria, and definition of done.
- [ ] `api-spec.md` defines authentication, authorization, requester, staff, and admin APIs.
- [ ] `ui-spec.md` defines required screens, states, responsive behavior, and accessibility expectations.
- [ ] `tests.md` maps every Acceptance Criterion to planned tests.
- [ ] Lab 2 preservation is explicitly documented.
- [ ] No Lab 3 implementation code is included in the documentation issue.
