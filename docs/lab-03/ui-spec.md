# Lab 3 UI Specification

## 1. Purpose

This document defines the approved user-interface contract for the TokTickIT Lab 3 authenticated service-desk sprint.

The Lab 3 UI provides:

- Login
- Authenticated application shell
- Role-aware navigation
- Requester ticket workflow preserved from Lab 2
- IT Staff queue and Ticket Detail workflow
- Administrator user management
- Authentication and authorization states
- Responsive desktop, tablet, and mobile behavior
- Lab 2 Zen Green visual continuity

---

## 2. Design Principles

The Lab 3 interface shall follow these principles:

1. Keep the Zen Green visual language established in Lab 2.
2. Make the current signed-in user and role context clear.
3. Show only navigation and actions the current user can use.
4. Treat backend authorization as authoritative.
5. Keep Requester screens familiar after the Lab 2 migration.
6. Make Staff workflow screens efficient for repeated operational use.
7. Make Administrator screens precise, auditable, and difficult to misuse.
8. Place validation messages near the related fields.
9. Preserve visible keyboard focus.
10. Avoid unintended horizontal scrolling, clipping, and overlapping content.

---

## 3. Visual Tokens

Lab 3 keeps the Lab 2 Zen Green tokens.

| Token | Value | Use |
|---|---|---|
| Primary Green | `#006B3C` | Header, primary actions, strong emphasis |
| Secondary Green | `#0B7A46` | Active navigation, links, focus accents, hover states |
| Pale Green | `#EAF6EF` | Success surfaces, selected states, subtle emphasis |
| Page Background | `#F5F7F6` | Main application background |
| Surface | `#FFFFFF` | Forms, tables, panels, modals |
| Primary Text | `#1F332A` | Main readable text |
| Muted Text | `#5F6F67` | Secondary labels and metadata |
| Neutral Border | `#CED8D2` | Form and panel borders |
| Read-only Background | `#F1F4F2` | Read-only and generated fields |
| Error | `#B3261E` | Validation and destructive feedback |
| Warning | `#A66500` | Warning callouts |
| Success | `#006B3C` | Successful states and confirmations |

Color must not be the only way to communicate priority, status, errors, or success.

---

## 4. Typography and Layout

TokTickIT uses the standard Bootstrap/system font stack.

Layout requirements:

- Main content uses a readable maximum width.
- Operational tables may use wider layouts than forms.
- Labels appear above controls.
- Field help and validation text appear close to the field.
- Button groups wrap on narrow screens.
- Status, priority, role, and activity indicators include readable text.
- Long names, emails, summaries, and filenames wrap without breaking the layout.

---

## 5. Login Screen

### Required Elements

- TokTickIT application identity
- Email field
- Password field
- Sign In button
- Safe authentication failure message
- Loading state during submission

### Behavior

- Empty email or password shows field-level validation.
- Invalid credentials show one generic failure message.
- The UI must not reveal whether the email exists.
- Successful sign-in routes the user to the default screen for their role.
- Keyboard users can complete sign-in without a mouse.

---

## 6. Authenticated Application Shell

### Required Elements

- TokTickIT application identity
- Current user display
- Current role or role context display
- Role-aware navigation
- Sign Out action
- Active-page indication

### Navigation by Role

Requester navigation:

- My Tickets
- Create Ticket

IT Staff navigation:

- Staff Queue

Administrator navigation:

- User Management

Users with multiple roles may see multiple navigation groups.

### Forbidden State

When the frontend reaches a route the user cannot access, show a clear forbidden-state screen with:

- safe message;
- no technical details;
- navigation back to an allowed area; and
- no restricted data.

---

## 7. Requester Screens

Requester screens preserve the Lab 2 user experience except that the Development Requester selector is removed.

### Create Ticket

Required behavior:

- current authenticated Requester is shown as read-only context;
- Category and Related System load from the API;
- Summary, Description, and Requested Priority follow Lab 2 validation;
- successful creation shows official Ticket Number;
- recoverable failures preserve valid entered values; and
- no requester selector appears.

### My Tickets

Required behavior:

- only authenticated Requester's Tickets appear;
- search, filtering, sorting, and pagination remain available;
- empty and no-results states are distinct;
- Ticket rows or cards show Ticket Number, Summary, Category, Related System, Requested Priority, IT Priority when available, Status, and updated date; and
- opening a Ticket leads to Requester Ticket Detail.

### Requester Ticket Detail

Required behavior:

- Ticket system fields remain read-only;
- public comments are visible;
- requester-visible Actions Taken are shown where allowed;
- internal notes are never visible;
- Attachment behavior follows Lab 2;
- staff-only controls do not appear; and
- owned inaccessible or missing Tickets show safe failure states.

---

## 8. IT Staff Screens

### Staff Queue

Required elements:

- search input;
- filters for Category, Related System, Requested Priority, IT Priority, Status, Assignee, and Requester;
- sorting controls;
- pagination controls;
- loading state;
- empty state;
- no-results state;
- Ticket list or table; and
- clear link/action to open Ticket Detail.

Ticket list entries must show:

- Ticket Number;
- Summary;
- Requester;
- Category;
- Related System;
- Requested Priority;
- IT Priority;
- Status;
- Assignee;
- Created date; and
- Last Updated date.

### Staff Ticket Detail

Required elements:

- Ticket identity and requester information;
- read-only requester-entered fields;
- editable Assignment control;
- editable IT Priority control;
- allowed Status transition control;
- public comment composer;
- internal note composer;
- Actions Taken composer;
- public comment history;
- internal note history;
- action/status history;
- Attachment metadata and permitted download controls;
- loading, saving, success, validation, and failure states.

### Staff Workflow Behavior

- Staff-only controls are visually separated from requester-entered information.
- Invalid status transitions are not offered when possible.
- Backend validation errors are still displayed safely.
- Saving one staff control must not silently discard another unsaved edit.
- Internal notes must be labeled as internal and not requester-visible.

---

## 9. Administrator Screens

### User Management List

Required elements:

- search input;
- role filter;
- active-state filter;
- sorting controls;
- pagination controls;
- Create User action;
- user rows showing display name, email, roles, active state, created date, and updated date;
- Edit action for each user;
- loading, empty, no-results, and failure states.

### User Form

Required fields:

- Display Name
- Email
- Roles
- Active State
- Password for new users
- Password reset control for existing users

Required behavior:

- email format validation;
- duplicate email feedback;
- at least one role required;
- unsupported roles rejected;
- inactive state warning;
- last Administrator protection feedback;
- success confirmation; and
- safe API failure state.

Destructive or high-impact actions such as deactivation must require clear confirmation.

---

## 10. Status and Priority Display

### Requested Priority

Allowed values:

- Low
- Medium
- High
- Urgent

Requested Priority is requester-entered and must be distinguishable from IT Priority.

### IT Priority

Allowed values:

- Low
- Medium
- High
- Urgent

IT Priority is staff-owned and appears on staff screens and requester screens where the product contract permits it.

### Ticket Status

Allowed values:

- New
- In Progress
- Waiting for Requester
- Resolved
- Closed
- Reopened
- Cancelled

Status badges must include text. They must not rely only on color.

---

## 11. Responsive Requirements

Supported viewports:

- Desktop: `>= 992px`
- Tablet: `768px - 991px`
- Mobile: `< 768px`

### Desktop

- Staff and Admin lists may use dense tables.
- Filters may sit in a horizontal toolbar.
- Ticket Detail may use multi-column sections.

### Tablet

- Filters wrap into two-column layouts where practical.
- Tables may simplify less important metadata.
- Forms remain readable without horizontal scrolling.

### Mobile

- Fields stack vertically.
- Lists may become cards.
- Button groups wrap.
- Long summaries, names, emails, and filenames wrap.
- No required action is hidden off-screen.
- No unintended horizontal page scrolling occurs.

---

## 12. Accessibility Requirements

- All inputs have programmatic labels.
- Required fields are communicated by text, not only color.
- Error messages are associated with relevant fields.
- Focus indicators are visible.
- Modal or confirmation flows return focus predictably.
- Buttons communicate busy and disabled states.
- Tables or card lists retain readable headings or labels.
- Keyboard users can sign in, navigate, create Tickets, update staff fields, and manage users.

---

## 13. UI Regression Requirements

Lab 3 must preserve these Lab 2 UI behaviors:

- Create Ticket validation and success feedback;
- My Tickets loading, empty, no-results, failure, filtering, sorting, and pagination states;
- Requester Ticket Detail read-only fields;
- Attachment upload validation;
- Attachment removal confirmation and reason;
- removed Attachment metadata without active download;
- responsive behavior at desktop, tablet, and mobile sizes; and
- Zen Green visual consistency.
