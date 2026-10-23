# Lab 4 — UI Specification

## 1. Purpose

Define the UI structure, role behavior, interaction states, responsive
layout, and accessibility requirements for Lab 4.

The existing Zen Green design language from Labs 2–3 must be preserved.

## 2. Shared Application Shell

- Keep the existing authenticated application shell.
- Display navigation appropriate to the authenticated role.
- Show an active-page indicator.
- Reuse existing buttons, cards, forms, tables, badges and feedback components.
- Display Ticket status and IT Priority using visible labels and non-color cues.
- Keep private Internal Notes visually distinct from shared content.
- Do not display controls that the current role is not allowed to use.
- Continue enforcing all permissions on the backend.

## 3. Actions Taken — IT Staff Ticket Detail

### 3.1 Actions Taken List

Display the Actions Taken associated with the current Ticket.

Each row/card shows:
- Action Date/Time
- Action Description
- Result
- Performed by
- Follow-Up Required
- Follow-up Note when applicable
- Attachment Notes when present

Order the list chronologically and handle matching timestamps consistently.

Provide an empty state when a Ticket has no Actions Taken.

### 3.2 Create Mode

Authorized staff can create an Action Taken.

Fields:
- Action Date/Time
- Action Description
- Result
- Follow-Up Required
- Follow-up Note
- Attachment Notes

Performed by is displayed automatically from authenticated identity
and cannot be selected or edited by the client.

Validation:
- Required fields must be identified.
- Follow-up Note is required when Follow-Up Required is enabled.
- Errors appear near the relevant field.
- Preserve entered values after recoverable failures.
- Prevent repeated submissions while a request is in progress.

### 3.3 View/Edit Mode

Display an existing Action Taken and provide permitted editing controls.

Save changes only after successful API validation.
Retain the existing record identity during updates.
Do not provide hard-delete controls.

Show a clear success message or safe error.

## 4. Requester Ticket Detail

Requesters can see Actions Taken information for their own Tickets.

The list is read-only:
- No create control.
- No edit control.
- No delete control.

Ownership is checked by the backend even if a client request bypasses
the normal page.

Requester resolution feedback must not directly change Ticket status.

## 5. Ticket Workflow Controls

Display the current Ticket status prominently.

Offer only transitions that are permitted for the current user and
Ticket status. Explain validation or resolution requirements before
submission where practical.

On success:
- Refresh the Ticket summary.
- Display the updated status.
- Keep relevant Ticket context visible.

On conflict:
- Explain that the Ticket has changed.
- Refresh authoritative Ticket data.
- Do not silently overwrite the newer state.

## 6. Requester Dashboard

### 6.1 Metric Cards

Display concise cards for:
- Total open Tickets.
- Tickets waiting for the Requester.
- Recently updated Tickets.
- Recently resolved Tickets.

Each card must have an accessible label and a useful destination.

### 6.2 Recent and Attention-Required Tickets

Show a concise list of recent or attention-required Tickets.
Include enough information to identify each Ticket and its current status.

Selecting an item opens the appropriate Ticket Detail screen.

All information must belong to the authenticated Requester.

## 7. IT Staff Dashboard

### 7.1 Metric Cards

Display:
- Unassigned Tickets.
- Tickets owned by the current user.
- Tickets grouped by status or IT Priority.
- Recently updated or urgent Tickets.

Dashboard metrics must be returned by the backend.

### 7.2 Recent/Urgent Ticket List

Display concise Ticket summaries with status, IT Priority, ownership,
and relevant update information.

Each actionable item links to Ticket Detail or a filtered Queue view.

Administrators may reuse the approved Staff Dashboard.

## 8. Shared UI States

All major screens must support:

- Loading state.
- Normal content state.
- Empty state.
- No search results state where applicable.
- Field validation errors.
- Successful save/update feedback.
- Forbidden access feedback.
- Not-found feedback.
- Conflict or stale-update feedback.
- Safe API failure feedback.

Do not expose stack traces, secrets or private data in user-facing errors.

## 9. Responsive Requirements

### Desktop
- Use clear cards and appropriately sized tables.
- Keep forms and Ticket information readable.
- Avoid unnecessary whitespace and horizontal overflow.

### Tablet
- Reflow metric cards.
- Allow tables or action lists to adapt without overlapping controls.

### Mobile
- Stack metric cards and form fields.
- Keep buttons easy to operate.
- Avoid page-level horizontal scrolling.
- Preserve labels, current status and important actions.

## 10. Accessibility Requirements

- Use semantic headings, labels and buttons.
- Support keyboard navigation.
- Display visible focus indicators.
- Associate validation messages with the corresponding fields.
- Do not communicate status or priority by color alone.
- Ensure modal/dialog behavior, if used, is keyboard accessible.
- Respect readable contrast and text sizing.
- Prevent clipped content and overlapping interactive controls.

## 11. UI Acceptance Checklist

- [ ] Actions Taken list supports zero, one and multiple records.
- [ ] Authorized staff can create and edit actions.
- [ ] Requesters see a read-only list for their own Tickets.
- [ ] Follow-up validation is clear.
- [ ] Ticket workflow controls reflect approved transitions.
- [ ] Requester Dashboard displays the approved metrics.
- [ ] IT Staff Dashboard displays the approved operational metrics.
- [ ] Metric cards navigate to the correct detailed view.
- [ ] Loading, empty, success and error states are consistent.
- [ ] Desktop, tablet and mobile are usable.
- [ ] Keyboard focus and field labels are accessible.
- [ ] Zen Green design consistency is maintained.