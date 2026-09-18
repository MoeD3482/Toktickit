# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Lab 3 extends TokTickIT from the Lab 2 Requester-facing MVP into an authenticated service-desk workflow.

The sprint replaces the temporary Development Requester selector with real user authentication, adds role-based authorization, preserves all completed Requester behavior from Lab 2, introduces IT Staff ticket handling, and adds Administrator user management.

This document is the engineering contract for Lab 3. It is derived from the Lab 3 handout scope captured in GitHub Issue #32 and cross-checked against the Lab 2 specification, API contract, UI contract, and test plan.

---

## 2. Stakeholder Request Interpretation

The IT department needs TokTickIT to support real authenticated use instead of the Lab 2 testing selector.

Users must be able to:

- sign in and sign out using a real account;
- access only features allowed by their role;
- continue using the Lab 2 Requester ticket workflow after sign-in;
- allow IT Staff to view, prioritize, assign, update, and document ticket work;
- allow Administrators to manage user accounts and role assignments; and
- keep ticket ownership, attachment rules, and requester data isolation intact.

Lab 3 must not regress the Lab 2 Requester MVP.

---

## 3. Scope

### Included

- Authentication
- Login and logout
- Authenticated current-user session
- Password hashing and safe credential handling
- Role-based authorization
- User roles: Requester, IT Staff, Administrator
- Active and inactive user handling
- Requester workflow regression from Lab 2
- IT Staff ticket queue
- IT Staff ticket detail
- Ticket assignment
- IT Priority
- Ticket status workflow
- Public comments
- Internal notes
- Actions taken
- Administrator user management
- User creation
- User update
- User activation and deactivation
- Role assignment
- Backend authorization enforcement
- UI access control and navigation
- Database migrations and seed data
- API contract updates
- Automated tests and regression tests

### Excluded

The following are outside Lab 3 unless explicitly required later:

- external identity providers;
- email verification;
- password reset by email;
- multi-factor authentication;
- service-level agreement timers;
- notifications;
- file preview beyond the existing Lab 2 attachment behavior;
- advanced reporting dashboards;
- audit export;
- real-time collaboration;
- production deployment; and
- functionality for future labs not listed in this contract.

---

## 4. Roles and Permissions

### Requester

A Requester may:

- create Tickets for themselves;
- view only their own Tickets;
- view their own Ticket Detail;
- upload, download, and soft-remove permitted Attachments on their own Tickets under Lab 2 rules;
- add public comments to their own Tickets;
- view public comments and visible Actions Taken on their own Tickets; and
- reopen a resolved Ticket when the workflow permits it.

A Requester may not:

- impersonate another Requester;
- view another Requester's Tickets or Attachments;
- set IT Priority;
- assign Tickets;
- create internal notes;
- manage users; or
- access IT Staff or Administrator screens.

### IT Staff

IT Staff may:

- view the IT Staff ticket queue;
- view Ticket Detail for all Tickets;
- assign or reassign Tickets to IT Staff users;
- set IT Priority;
- update Ticket status according to the approved workflow;
- add public comments;
- add internal notes;
- record Actions Taken;
- view Attachments on Tickets they are authorized to handle; and
- search, filter, sort, and paginate the staff queue.

IT Staff may not:

- manage user accounts;
- change another user's password;
- deactivate users;
- bypass required workflow validation; or
- access Administrator-only screens.

### Administrator

Administrators may:

- manage user accounts;
- assign roles;
- activate or deactivate users;
- create initial credentials through an approved safe process;
- view user-management history where stored; and
- access Administrator screens.

Administrators may also access IT Staff capabilities when the account has the IT Staff role or when the approved authorization model grants Administrator operational access.

---

## 5. Functional Requirements

### Authentication

**FR-01** The system shall allow active users to sign in with valid credentials.

**FR-02** The system shall reject invalid credentials with a safe, generic message.

**FR-03** The system shall store passwords only as one-way password hashes.

**FR-04** The system shall establish an authenticated session after successful sign-in.

**FR-05** The system shall allow authenticated users to sign out.

**FR-06** The system shall expose a current-user endpoint for the frontend application shell.

**FR-07** The system shall prevent inactive users from signing in.

### Authorization

**FR-08** The system shall enforce role-based authorization in backend APIs.

**FR-09** The frontend shall hide navigation and actions unavailable to the current user's role.

**FR-10** Unauthorized API access shall return a safe authorization error.

**FR-11** Unauthenticated API access to protected resources shall return an authentication-required error.

### Requester Regression

**FR-12** The authenticated Requester shall be able to create a Ticket without using the Lab 2 Development Requester selector.

**FR-13** The authenticated Requester shall see only their own Tickets in My Tickets.

**FR-14** The authenticated Requester shall open only their own Ticket Detail.

**FR-15** Lab 2 Attachment upload, metadata, download, and soft-removal rules shall continue to work for authenticated Requesters.

**FR-16** Existing Lab 2 search, filtering, sorting, pagination, validation, and error states shall remain available.

### IT Staff Workflow

**FR-17** The system shall provide an IT Staff ticket queue.

**FR-18** The staff queue shall support search, filtering, sorting, and pagination.

**FR-19** IT Staff shall be able to open Ticket Detail for Tickets in the queue.

**FR-20** IT Staff shall be able to assign or reassign Tickets to IT Staff users.

**FR-21** IT Staff shall be able to set IT Priority.

**FR-22** IT Staff shall be able to update Ticket status according to the approved workflow.

**FR-23** IT Staff shall be able to add public comments.

**FR-24** IT Staff shall be able to add internal notes visible only to IT Staff and Administrators.

**FR-25** IT Staff shall be able to record Actions Taken.

### Administrator User Management

**FR-26** Administrators shall be able to view user accounts.

**FR-27** Administrators shall be able to create user accounts.

**FR-28** Administrators shall be able to edit supported user profile fields.

**FR-29** Administrators shall be able to assign and remove roles.

**FR-30** Administrators shall be able to activate and deactivate users.

**FR-31** The system shall prevent an Administrator from removing the last usable Administrator account.

**FR-32** Deactivated users shall retain historical ownership, comments, assignments, notes, and actions.

---

## 6. Business Rules

**BR-01** The Lab 2 Development Requester selector is removed from authenticated Lab 3 user workflows.

**BR-02** A signed-in Requester becomes the requester identity for Requester-owned Ticket operations.

**BR-03** Authentication does not replace ownership checks; ownership and role checks are both enforced by the backend.

**BR-04** User email must be unique.

**BR-05** A user may have one or more roles.

**BR-06** At least one active Administrator must always remain.

**BR-07** Inactive users cannot sign in.

**BR-08** Inactive users remain visible in historical Ticket data.

**BR-09** Passwords must never be stored or logged in plain text.

**BR-10** Authentication and authorization errors must not reveal whether an email exists.

**BR-11** Protected APIs must not trust frontend hiding for security.

**BR-12** Lab 2 Ticket Number generation remains backend-owned and unique.

**BR-13** Lab 2 client request ID duplicate protection remains in effect.

**BR-14** Lab 2 Attachment type, size, active-count, ownership, download, and soft-removal rules remain in effect.

**BR-15** IT Priority is separate from Requested Priority.

**BR-16** Requested Priority remains requester-entered and read-only after creation unless a later lab changes it.

**BR-17** IT Priority may be set only by IT Staff or authorized Administrators.

**BR-18** Ticket assignment may reference only active IT Staff users.

**BR-19** Internal notes are never visible to Requesters.

**BR-20** Public comments are visible to the Ticket Requester and authorized IT Staff or Administrators.

**BR-21** Actions Taken are visible to IT Staff and Administrators; requester visibility must follow the UI and API contract.

**BR-22** Status changes must follow the approved transition rules.

**BR-23** Status changes must record who made the change and when.

**BR-24** Assignment, IT Priority, comments, internal notes, and Actions Taken must be associated with the authenticated actor.

**BR-25** Safe validation responses must use structured field errors where applicable.

**BR-26** The UI must distinguish unauthenticated, unauthorized, loading, empty, no-results, validation, success, and API-failure states.

---

## 7. Ticket Status Workflow

Lab 3 uses the following Ticket statuses:

- New
- In Progress
- Waiting for Requester
- Resolved
- Closed
- Reopened
- Cancelled

Approved transitions:

| From | To | Actor |
|---|---|---|
| New | In Progress | IT Staff |
| New | Cancelled | IT Staff |
| In Progress | Waiting for Requester | IT Staff |
| In Progress | Resolved | IT Staff |
| In Progress | Cancelled | IT Staff |
| Waiting for Requester | In Progress | IT Staff |
| Waiting for Requester | Resolved | IT Staff |
| Resolved | Closed | IT Staff |
| Resolved | Reopened | Requester or IT Staff |
| Reopened | In Progress | IT Staff |

Invalid transitions must be rejected by the backend with a safe validation response.

---

## 8. UI Specification Summary

The detailed UI contract is defined in:

`docs/lab-03/ui-spec.md`

Required screens:

1. Login
2. Authenticated Application Shell
3. Requester Create Ticket
4. Requester My Tickets
5. Requester Ticket Detail
6. IT Staff Queue
7. IT Staff Ticket Detail
8. Administrator User Management
9. Administrator User Form

Required shared UI behavior includes:

- current-user display;
- role-aware navigation;
- sign-out action;
- forbidden-state screen;
- safe authentication failure state;
- loading and empty states;
- no-results states;
- validation messages near fields;
- visible keyboard focus;
- responsive desktop, tablet, and mobile layouts; and
- Lab 2 Zen Green visual continuity.

---

## 9. Data Changes

Lab 3 extends the PostgreSQL and Prisma data model.

### User

Required information:

- `id`
- `displayName`
- `email`
- `passwordHash`
- `isActive`
- `createdAt`
- `updatedAt`

Email must be unique.

### Role

Approved role values:

- `Requester`
- `ITStaff`
- `Administrator`

The implementation may use an enum or normalized role table, but the API and UI must expose the approved role semantics.

### Ticket

Lab 3 extends Ticket data with:

- authenticated requester user reference;
- assigned staff user reference;
- IT Priority;
- expanded Ticket status values; and
- status, priority, and assignment timestamps where needed.

Lab 2 Ticket ownership semantics must be preserved during migration.

### Ticket Comment

Required information:

- `id`
- `ticketId`
- `authorUserId`
- `body`
- `visibility`
- `createdAt`
- `updatedAt`

Visibility values:

- `Public`
- `Internal`

### Ticket Action

Required information:

- `id`
- `ticketId`
- `actorUserId`
- `actionType`
- `body`
- `createdAt`

Ticket Action records cover operational work such as Actions Taken, status changes, assignment changes, and IT Priority changes.

### Session

The application must persist enough session state to authenticate API requests securely. The approved implementation may use server-side sessions or another secure session strategy, but secrets must not be committed.

---

## 10. API Contract Summary

The detailed API contract is defined in:

`docs/lab-03/api-spec.md`

Lab 3 endpoints continue to use:

```text
/api/v1
```

Required endpoint families:

- authentication;
- current user;
- requester Ticket workflow;
- staff queue and staff Ticket workflow;
- comments, internal notes, and actions;
- Administrator user management; and
- authorization-safe error responses.

The Lab 2 testing header `X-Development-Requester-Id` must not be used as authentication in Lab 3 user workflows.

---

## 11. Acceptance Criteria

**AC-01** Given an active user with valid credentials, when the user signs in, then an authenticated session is established and the application shell shows the current user.

**AC-02** Given invalid credentials, when sign-in is attempted, then the user sees a safe generic failure message and no session is established.

**AC-03** Given an inactive user, when sign-in is attempted, then sign-in is rejected safely.

**AC-04** Given an authenticated user, when the user signs out, then protected screens are no longer accessible without signing in again.

**AC-05** Given a protected API endpoint, when no authenticated session is present, then the API returns an authentication-required response.

**AC-06** Given an authenticated user without the required role, when a restricted API endpoint is requested, then the API returns an authorization error.

**AC-07** Given a Requester signs in, when the application loads, then only Requester navigation and actions are available.

**AC-08** Given an IT Staff user signs in, when the application loads, then IT Staff workflow navigation is available and Administrator-only navigation is hidden.

**AC-09** Given an Administrator signs in, when the application loads, then Administrator user-management navigation is available.

**AC-10** Given a signed-in Requester, when they create a Ticket, then the Ticket is owned by that authenticated Requester and no Development Requester selector is used.

**AC-11** Given a signed-in Requester, when My Tickets loads, then only that Requester's Tickets are returned.

**AC-12** Given a signed-in Requester, when they directly request another Requester's Ticket or Attachment, then the backend rejects access.

**AC-13** Given existing Lab 2 Requester workflows, when Lab 3 is complete, then create Ticket, My Tickets, Ticket Detail, and Attachment lifecycle behavior still pass regression tests.

**AC-14** Given an IT Staff user, when the staff queue loads, then Tickets across Requesters are visible according to staff authorization.

**AC-15** Given an IT Staff user, when they search, filter, sort, or paginate the staff queue, then the results and metadata follow the API contract.

**AC-16** Given an IT Staff user, when they open a Ticket, then staff-only fields and actions are available.

**AC-17** Given an IT Staff user, when they assign or reassign a Ticket to an active IT Staff user, then the assignment is saved and recorded.

**AC-18** Given an IT Staff user, when they set IT Priority, then the IT Priority is saved separately from Requested Priority and recorded.

**AC-19** Given an IT Staff user, when they perform a valid status transition, then the status changes and the actor and timestamp are recorded.

**AC-20** Given an invalid status transition, when the transition is submitted, then the backend rejects it safely.

**AC-21** Given a Requester or IT Staff user, when a public comment is added to an authorized Ticket, then the public comment appears to authorized viewers.

**AC-22** Given an IT Staff user, when an internal note is added, then it is visible to IT Staff or Administrators and hidden from the Requester.

**AC-23** Given an IT Staff user, when Actions Taken are recorded, then the action history is saved with actor and timestamp.

**AC-24** Given an Administrator, when user management loads, then active and inactive users are visible with roles.

**AC-25** Given an Administrator, when a valid user account is created, then the user can be saved with approved roles and active status.

**AC-26** Given an Administrator, when a user is edited, then supported profile, role, and active-state changes are saved.

**AC-27** Given an Administrator attempts to deactivate or remove the last usable Administrator, then the system rejects the change.

**AC-28** Given a non-Administrator, when they attempt to access user-management screens or APIs, then access is denied.

**AC-29** Given desktop, tablet, and mobile viewports, when required Lab 3 screens are used, then controls remain readable and usable without unintended horizontal scrolling, clipping, or overlap.

**AC-30** Given a keyboard user, when they use Lab 3 screens, then interactive controls have visible focus and can be operated without a mouse.

---

## 12. Definition of Done

Lab 3 product work is complete only when all of the following are true:

- [ ] All approved Lab 3 scope is implemented.
- [ ] All Functional Requirements are satisfied.
- [ ] All Business Rules are implemented.
- [ ] Every Acceptance Criterion maps to at least one planned test.
- [ ] All required Prisma migrations are committed.
- [ ] Seed data includes safe Lab 3 test users and roles.
- [ ] Real authentication replaces the Lab 2 Development Requester selector.
- [ ] Backend authorization protects every restricted API.
- [ ] Requester Lab 2 regression tests pass.
- [ ] IT Staff workflow tests pass.
- [ ] Administrator user-management tests pass.
- [ ] API/integration tests pass.
- [ ] UI component tests pass.
- [ ] Playwright E2E tests pass.
- [ ] Responsive checks pass.
- [ ] Accessibility checks pass.
- [ ] No required automated test is skipped, disabled, or commented out.
- [ ] The implemented UI conforms to `docs/lab-03/ui-spec.md`.
- [ ] The implemented APIs conform to `docs/lab-03/api-spec.md`.
- [ ] Final test evidence is recorded in `docs/lab-03/tests.md`.
- [ ] Lab 2 functionality remains preserved.
- [ ] Peer review is completed before merge.

---

## 13. Assumptions and Decisions

### AD-01 - Source Priority

The Lab 3 handout is the source of truth. This contract uses the Lab 3 scope summarized in GitHub Issue #32 and the Lab 2 documentation where the handout text is not present in the repository.

### AD-02 - Authentication Model

Lab 3 uses application-managed accounts with email and password credentials unless the handout later requires an external provider.

### AD-03 - Session Strategy

The preferred web session strategy is a secure HTTP-only session cookie with server-side validation. Any equivalent secure strategy must keep secrets out of the client and out of source control.

### AD-04 - Authorization

Authorization is enforced server-side first. UI hiding improves usability but is not a security control.

### AD-05 - Lab 2 Migration

Lab 2 Development Requesters map to authenticated Requester users. Historical Tickets and Attachments must remain associated with the correct Requester after migration.

### AD-06 - API Versioning

Lab 3 continues the `/api/v1` path to avoid unnecessary version churn during the course project. Breaking response changes must be documented in `api-spec.md`.

### AD-07 - Visual Continuity

Lab 3 keeps the Zen Green visual language established in Lab 2 so Requester, Staff, and Administrator screens feel like one product.
