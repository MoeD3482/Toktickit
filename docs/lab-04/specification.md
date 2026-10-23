# Lab 4 — TokTickIT Engineering Specification

## 1. Sprint Goal

Lab 4 completes the core TokTickIT service-desk workflow by adding
Actions Taken, enforcing Ticket lifecycle rules, providing dashboards
for Requesters and IT Staff, and completing regression testing and
final application hardening.

The existing functionality from Labs 1–3 must remain available and
continue to work.

## 2. Stakeholder Request

IT Staff need a reliable way to record work performed on a Ticket.
Each Ticket may have multiple Actions Taken, and the primary Ticket
Owner remains responsible for coordinating the Ticket.

Requesters need visibility into work performed on their own Tickets.
They may indicate that a problem appears resolved, but IT Staff must
review the work and formally update the Ticket status.

Requester and IT Staff dashboards must summarize operational
information and link to the relevant detailed screens.

## 3. Scope

### 3.1 Included

- Actions Taken database model, migration, API, authorization, and UI.
- Create and edit Actions Taken.
- Ticket Owner and action-performer responsibilities.
- Ticket status-transition rules and resolution requirements.
- Requester Dashboard API and UI.
- IT Staff Dashboard API and UI.
- Administrator access to approved IT Staff dashboard features.
- Migration preservation, repeatable seed data, and conflict handling.
- Automated tests for the new functionality.
- Full Labs 1–3 regression testing.
- Responsive design, accessibility, visual inspection, and release evidence.

### 3.2 Explicitly Excluded

- Automatic SLA clocks, escalations, and breach notifications.
- Email, SMS, LINE, push, or external notification services.
- Inventory, spare parts, purchasing, and service cost accounting.
- Payroll, time-sheet billing, and labor-cost calculations.
- Multi-level approval workflows and electronic signatures.
- Advanced business-intelligence tools and report builders.
- Multi-tenant organizations and production-scale cloud operations.
- Features not approved in the Sprint 4 engineering contract.

## 4. Functional Requirements

### FR-01 — Actions Taken

Each Ticket may contain zero or more Actions Taken.

Each Action Taken records:

- Action Date/Time.
- Action Description.
- Result.
- Performed by.
- Follow-Up Required.
- Follow-up Note.
- Attachment Notes.

IT Staff and Administrators may create and edit Actions Taken on
Tickets they are authorized to access.

The performer must be derived from the authenticated user.
The client must not be allowed to impersonate another performer.

### FR-02 — Actions Taken Validation

Action Description, Result, and Action Date/Time are required.

Follow-Up Note is required when Follow-Up Required is true.

Attachment Notes records information identifying relevant files
or images. It does not replace the existing attachment functionality.

Invalid requests must be rejected by the backend with safe,
field-appropriate validation errors.

### FR-03 — Ticket Ownership

A Ticket has at most one primary Ticket Owner.

The primary Ticket Owner coordinates the Ticket as a whole.
A different authorized IT Staff member may record an Action Taken
on that Ticket.

Assigning or changing the Ticket Owner must follow the existing
authorization rules and reject inactive assignees.

### FR-04 — Action Visibility

Requesters may view all Actions Taken belonging to their own Tickets.

Requesters must not create or edit Actions Taken.

IT Staff and Administrators may perform the approved write operations
on accessible Tickets.

Existing private Internal Notes must remain private and must not
be exposed as public comments or Actions Taken.

### FR-05 — Ticket Lifecycle

The supported Ticket statuses are:

New, Open, In Progress, Waiting for Requester, Resolved,
Closed, Reopened, and Cancelled.

The backend must enforce the approved transition matrix.
The UI must display only the transitions permitted for the
current user and Ticket status.

Requester resolution feedback is advisory and does not by itself
set a Ticket to Resolved.

### FR-06 — Requester Dashboard

Provide concise, backend-calculated information about the authenticated
Requester's own Tickets, including:

- Total open Tickets.
- Tickets waiting for the Requester.
- Recently updated Tickets.
- Recently resolved Tickets.

Each actionable metric should navigate to the appropriate detailed
Ticket list or Ticket Detail screen.

### FR-07 — IT Staff Dashboard

Provide concise, backend-calculated operational information, including:

- Unassigned Tickets.
- Tickets owned by the current user.
- Tickets grouped by status or IT Priority.
- Recently updated or urgent Tickets.

Administrators may reuse the approved IT Staff dashboard and may
have concise user-account counts if approved.

Dashboard metrics must link to the appropriate Queue, filtered list,
or Ticket Detail screen where practical.

### FR-08 — Final Hardening

Maintain existing authentication, authorization, requester ticket
workflows, attachments, public comments, internal notes, IT Staff
features, and administrator user management.

Provide consistent loading, validation, success, empty, no-results,
forbidden, conflict, not-found, and safe-failure feedback.

Prevent duplicate submissions or retries from creating unintended
duplicate actions.

Protect entered form data after recoverable failures.

### FR-09 — Responsive and Accessible UI

Preserve the Zen Green design language.

Support desktop, tablet, and mobile layouts. Provide accessible labels,
visible keyboard focus, keyboard operation, and clear status indicators.

Avoid clipped content, overlapping controls, broken links, placeholder
text, console errors, and horizontal page overflow.

## 5. Business Rules

### BR-01 — Ticket Relationship

Every Action Taken belongs to exactly one Ticket.

A Ticket may contain multiple Actions Taken.

### BR-02 — Ticket Owner and Performer

The Ticket Owner coordinates the Ticket. The performer of an
Action Taken may be a different authorized IT Staff member.

### BR-03 — Authenticated Performer

The backend determines the performer from the authenticated session.
Client-supplied performer identity must never override it.

### BR-04 — Role Permissions

Requesters can view Actions Taken on their own Tickets but cannot
create or edit them.

IT Staff and Administrators can create and edit Actions Taken only
on Tickets they are authorized to access.

Every write operation must be protected by backend authorization.

### BR-05 — Required Fields

Action Date/Time, Action Description, and Result are required.

Follow-up Note is required when Follow-Up Required is true.

All text fields must be subject to documented length and input
validation limits.

### BR-06 — Action History

Actions Taken are ordered consistently by Action Date/Time, with
creation time and record ID used to break ties.

An Action Taken cannot be deleted through the application.
Editing an existing action updates the same record; it must not
silently create a second copy.

### BR-07 — Time Handling

Action Date/Time is stored consistently by the backend in UTC.
The UI displays date/time in the Asia/Bangkok time zone.

Dashboard date boundaries must use the same documented time-zone
policy.

### BR-08 — Ticket Status Transitions

The permitted transition matrix is defined in Section 6.

Only authorized IT Staff and Administrators may formally change
Ticket status.

### BR-09 — Resolution Gate

A Requester's indication that a problem appears resolved does not
change Ticket status.

A Ticket may transition to Resolved only when it has at least one
Action Taken and its most recent Action Taken does not require
follow-up.

The backend must check this condition during the status update.

### BR-10 — Closure and Cancellation

Only a permitted transition may set a Ticket to Closed or Cancelled.

Cancelled Tickets are terminal in this sprint.

Resolved and Closed Tickets may be reopened only through the
specified transition rules.

### BR-11 — Dashboard Ownership

Requester dashboard queries must be scoped to the authenticated
Requester on the server.

Staff dashboard ownership and unassigned metrics must use
authoritative Ticket data and the authenticated user identity.

### BR-12 — Dashboard Calculations

An open Ticket is any Ticket whose status is New, Open, In Progress,
Waiting for Requester, or Reopened.

"Waiting for the Requester" counts only Tickets in that exact status.

"Recently updated" means the five most recently updated matching
Tickets, updated within the preceding 30 days.

"Recently resolved" means Tickets currently Resolved or Closed whose
last update occurred within the preceding 30 days.

Staff status and priority counts include non-terminal Tickets unless
a metric explicitly says otherwise.

### BR-13 — Migration Safety

The migration must preserve existing data from Labs 1–3.
Existing Tickets without Actions Taken remain valid and behave
according to the documented resolution rule.

### BR-14 — Safe Concurrency

Stale or conflicting Ticket updates must be detected or handled
safely. A user must not unknowingly overwrite a newer workflow change.

### BR-15 — Safe Failures

The application must not expose password hashes, secrets, private
Internal Notes, or unauthorized users' Ticket information.

## 6. Ticket Status Transition Matrix

All transitions must be checked by the backend.

| Current Status | Permitted Next Status |
|---|---|
| New | Open, Cancelled |
| Open | In Progress, Cancelled |
| In Progress | Waiting for Requester, Resolved, Cancelled |
| Waiting for Requester | Open, In Progress, Cancelled |
| Resolved | Closed, Reopened |
| Closed | Reopened |
| Reopened | Open, In Progress, Cancelled |
| Cancelled | None |

Only authorized IT Staff and Administrators may perform these
formal status changes.

Transition to Resolved additionally requires the resolution gate
defined in BR-09.

The Requester's "Problem Appears Resolved" feedback remains advisory.

## 7. UI Specification Summary

### 7.1 Actions Taken on Ticket Detail

The IT Staff Ticket Detail screen will include an Actions Taken list
and create/edit forms.

The list shows all required Action Taken fields. A performer is
displayed using safe user information.

Requesters see a read-only Actions Taken section for their own Tickets.

Forms must validate required fields, clearly identify errors, and
retain entered data after recoverable failures.

### 7.2 Requester Dashboard

Display concise metric cards and recent or attention-required Tickets.

Metrics must cover only the authenticated Requester's own Tickets.
Selecting a card or item should open the corresponding detailed view.

### 7.3 IT Staff Dashboard

Display unassigned Tickets, Tickets owned by the current user,
status/priority summaries, and recently updated or urgent Tickets.

Metric cards and actionable items must navigate to useful detailed
views or filtered lists.

### 7.4 Shared UI Behavior

Reuse the existing Zen Green conventions for cards, tables, badges,
forms, buttons, loading states, empty states, and errors.

Detailed screen behavior belongs in docs/lab-04/ui-spec.md.

## 8. Data Changes

Add an ActionTaken model related to Ticket and the authenticated User.

Proposed fields:

- id
- ticketId
- actionAt
- description
- result
- performedByUserId
- followUpRequired
- followUpNote
- attachmentNotes
- createdAt
- updatedAt

Use a migration that preserves existing data. Add indexes appropriate
for retrieving actions by Ticket and ordering action history.

Preserve all existing Users, Tickets, Attachments, Public Comments,
Internal Notes, and related records.

The detailed data design, migration/backfill approach, indexes,
seed behavior, and recovery strategy must be documented in
docs/lab-04/specification.md before implementation.

## 9. API Contract Summary

The API must support:

- Creating an Action Taken.
- Listing Actions Taken for an accessible Ticket.
- Updating an existing Action Taken.
- Retrieving Requester dashboard metrics.
- Retrieving IT Staff dashboard metrics.
- Continuing approved APIs from Labs 1–3.

Dashboard responses must contain concise metrics and recent Ticket
summaries rather than entire Ticket collections.

Exact paths, request/response schemas, authorization rules,
validation, HTTP status codes, concurrency, and safe errors belong
in docs/lab-04/api-spec.md.

## 10. Acceptance Criteria

### AC-01 — Create Action Taken
An authorized staff user can create an action under the correct Ticket.

### AC-02 — Performer Identity
The saved performer comes from the authenticated user.

### AC-03 — Follow-Up Validation
A required follow-up note cannot be omitted when follow-up is required.

### AC-04 — Action Visibility
Requesters can view actions on their own Tickets but cannot write actions.

### AC-05 — Multiple Actions
A Ticket can display multiple Actions Taken in stable order.

### AC-06 — Ticket Resolution
A Ticket cannot become Resolved unless the resolution gate passes.

### AC-07 — Status Authorization
Unauthorized or invalid status transitions are rejected by the backend.

### AC-08 — Requester Dashboard
Requester metrics and recent Tickets include only the authenticated
Requester's data.

### AC-09 — Staff Dashboard
Staff metrics match authoritative database queries.

### AC-10 — Drill-Down
Actionable dashboard cards and items open the correct detail or
filtered list.

### AC-11 — Migration Preservation
Migration and seed operations preserve existing project data and
remain safe to repeat.

### AC-12 — Regression
Approved Lab 1–3 functionality continues to pass regression tests.

### AC-13 — Responsive and Accessible UI
Major Lab 4 screens work on desktop, tablet, and mobile and meet
the approved accessibility requirements.

### AC-14 — Final Verification
All planned automated tests, builds, and required final evidence
are completed and recorded.

Every acceptance criterion must map to at least one planned test
in docs/lab-04/tests.md.

## 11. Definition of Done

- [ ] Engineering contract reviewed before implementation.
- [ ] Test plan and acceptance-criterion traceability are complete.
- [ ] Database migration and seed behavior are verified.
- [ ] Actions Taken APIs and authorization tests pass.
- [ ] Actions Taken UI and component tests pass.
- [ ] Ticket transition and resolution rules are enforced by the backend.
- [ ] Requester and IT Staff dashboards use accurate backend metrics.
- [ ] Labs 1–3 regression tests continue to pass.
- [ ] Responsive, accessibility, and failure-state checks are complete.
- [ ] Production builds and end-to-end tests pass.
- [ ] README, reviewer.md, ai-use.md, and screenshots are updated.
- [ ] Feature PRs are reviewed and merged through lab4-staging into main.
- [ ] Final submission PDF contains Answer Part 1 through Answer Part 9.

An issue must not be marked Done until its implementation is reviewed,
merged, and verified.

## 12. Assumptions and Decisions

1. Actions Taken are not hard-deleted; permitted edits update the same record.
2. Action timestamps are stored in UTC and displayed in Asia/Bangkok time.
3. The resolution gate requires at least one Action Taken and no follow-up
   requirement on the most recent action.
4. Cancelled Tickets cannot transition to another status.
5. Dashboard counts come from backend queries, not client-side calculations.
6. All database and API changes must preserve approved Labs 1–3 behavior.
7. The Lab 4 assignment PDF is the source of truth for scope and submission.