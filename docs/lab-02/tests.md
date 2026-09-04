# Lab 2 Test Plan and Results

## 1. Test Strategy

Lab 2 uses Test-Driven Development (TDD) and traceable automated testing to verify the Requester-facing TokTickIT sprint.

Testing is planned before implementation and is derived from the approved Functional Requirements, Business Rules, and Acceptance Criteria in:

`docs/lab-02/specification.md`

The test strategy includes:

- Unit tests for isolated business rules and utilities
- API/integration tests for REST endpoints, validation, ownership, database behavior, and attachments
- UI component tests for screen behavior and user feedback
- UI style checks for required Zen Green states and controls
- Responsive checks at desktop, tablet, and mobile viewports
- End-to-end tests for complete Requester workflows
- Manual visual inspection against `docs/lab-02/ui-spec.md`

No Acceptance Criterion is considered complete without test evidence.

---

## 2. Planned Tests

### 2.1 Development Requester Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-REQ-01 | API | FR-01, AC-01 | Retrieve Development Requesters | Only active Requesters are returned | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| API-REQ-02 | API | BR-04, BR-05, AC-01 | Inactive Requester exclusion | Inactive Requester is not returned by active Requester endpoint | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| UI-REQ-01 | UI | FR-02, AC-02 | Requester selection is required | User is shown Requester Selection before requester-specific screens | `client/tests/lab-02/RequesterSelection.test.tsx` | Planned |
| UI-REQ-02 | UI | FR-03, AC-03 | Selected Requester display | Selected Requester name appears in application shell | `client/tests/lab-02/RequesterSelection.test.tsx` | Planned |
| UI-REQ-03 | UI | FR-04, AC-04 | Change Requester | Current Requester changes and requester-specific data reloads | `client/tests/lab-02/RequesterSelection.test.tsx` | Planned |
| UI-REQ-04 | UI | AC-01 | Requester loading state | Loading feedback appears while Requesters are requested | `client/tests/lab-02/RequesterSelection.test.tsx` | Planned |
| UI-REQ-05 | UI | BR-40 | No active Requesters | Safe empty state is shown | `client/tests/lab-02/RequesterSelection.test.tsx` | Planned |
| UI-REQ-06 | UI | BR-40, BR-41 | Requester API failure | Safe failure message is shown without technical details | `client/tests/lab-02/RequesterSelection.test.tsx` | Planned |

---

### 2.2 Reference Data Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-REF-01 | API | FR-05, BR-10 | Active Categories | Four required active Categories are returned | `server/tests/lab-02/reference-data.api.test.ts` | Planned |
| API-REF-02 | API | FR-06, BR-11 | Active Related Systems | At least six active Related Systems are returned | `server/tests/lab-02/reference-data.api.test.ts` | Planned |
| UNIT-SEED-01 | Unit / DB | BR-05, BR-10, BR-11 | Seed idempotency | Running seed repeatedly does not create duplicate reference records | `server/tests/lab-02/seed.test.ts` | Planned |

---

### 2.3 Create Ticket Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UNIT-TKT-01 | Unit | BR-01 | Ticket Number format | Generated Ticket Number matches `TKT-YYYY-NNNNN` | `server/tests/lab-02/ticket-number.test.ts` | Planned |
| UNIT-TKT-02 | Unit | BR-14 | Summary validation | Too-short, too-long, and blank Summary values are rejected | `server/tests/lab-02/ticket-validation.test.ts` | Planned |
| UNIT-TKT-03 | Unit | BR-15 | Description validation | Too-short, too-long, and blank Description values are rejected | `server/tests/lab-02/ticket-validation.test.ts` | Planned |
| API-TKT-01 | API | FR-07, FR-08, AC-05 | Valid Ticket creation | Returns 201, saves one Ticket, and returns official Ticket Number | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-TKT-02 | API | FR-09, AC-06 | Requester ownership on create | Saved `requesterId` matches selected Requester | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-TKT-03 | API | BR-02, AC-06 | Initial Ticket status | Newly created Ticket has status `New` | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-TKT-04 | API | FR-10, AC-07 | Missing required fields | Returns validation response and no Ticket is created | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-TKT-05 | API | BR-16, BR-17 | Invalid Category / Related System | Invalid reference IDs are rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-TKT-06 | API | BR-18 | Invalid Requested Priority | Unsupported priority is rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-TKT-07 | API | FR-12, BR-20, AC-09 | Duplicate submission prevention | Reusing the same request identifier does not create a second Ticket | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| UI-TKT-01 | UI | FR-07 | Create Ticket required fields | Required fields and read-only fields render correctly | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| UI-TKT-02 | UI | FR-10, AC-07 | Frontend validation | Field-level validation appears and API is not called for invalid form | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| UI-TKT-03 | UI | BR-40 | Submitting state | Submit button is disabled and shows busy state | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| UI-TKT-04 | UI | AC-05 | Successful creation | Official Ticket Number is shown after successful submission | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| UI-TKT-05 | UI | FR-11, AC-08 | API failure preserves values | Safe error is shown and valid entered values remain | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |

---

### 2.4 My Tickets Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-LIST-01 | API | FR-13, AC-10 | Requester-owned list | Only selected Requester's Tickets are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-LIST-02 | API | FR-14, BR-21, AC-11 | Search | Search returns matching owned Tickets only | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-LIST-03 | API | FR-15, BR-22, AC-11 | Filters | Category, Priority, and Status filters behave as documented | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-LIST-04 | API | FR-16, BR-23, BR-24, AC-11 | Sorting | Supported sort fields and default ordering work | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-LIST-05 | API | FR-17, BR-25, BR-26, AC-11 | Pagination | Correct page data and pagination metadata are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-LIST-06 | API | BR-27 | Invalid query parameters | Invalid parameters return safe validation response | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| UI-LIST-01 | UI | FR-13 | Ticket list rendering | Returned owned Tickets render correctly | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-LIST-02 | UI | AC-12 | Empty state | Empty state is shown when Requester owns no Tickets | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-LIST-03 | UI | AC-13 | No-results state | No-results state is shown when filters/search match none | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-LIST-04 | UI | BR-40 | Loading state | Loading feedback is shown while list is requested | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-LIST-05 | UI | BR-41 | API failure | Safe list failure feedback is shown | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| UI-LIST-06 | UI | AC-04, AC-10 | Requester switching | Requester A's Tickets disappear after switching to Requester B | `client/tests/lab-02/MyTickets.test.tsx` | Planned |

---

### 2.5 Ticket Detail Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-DETAIL-01 | API | FR-18, AC-15 | Owned Ticket Detail | Selected Requester can retrieve an owned Ticket | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| API-DETAIL-02 | API | FR-19, BR-08, BR-09, AC-14 | Cross-Requester Ticket access | Requester B cannot retrieve Requester A's Ticket | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| API-DETAIL-03 | API | AC-15 | Missing Ticket | Missing Ticket returns safe missing-resource response | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| UI-DETAIL-01 | UI | FR-18, AC-15 | Read-only Ticket fields | Ticket Detail information is displayed read-only | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Planned |
| UI-DETAIL-02 | UI | BR-40 | Loading / failure states | Detail loading and safe failure feedback work | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Planned |

---

### 2.6 Attachment Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-ATT-01 | API | FR-20, BR-28, BR-29, AC-16 | Valid upload | Valid permitted file is accepted and metadata is returned | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-02 | API | BR-28, AC-17 | Unsupported type | Unsupported file type is rejected | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-03 | API | BR-29, AC-17 | Oversized file | File larger than 5 MB is rejected | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-04 | API | BR-30, AC-18 | Maximum active Attachments | Sixth active Attachment is rejected | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-05 | API | FR-21 | Metadata retrieval | Attachment metadata is returned for owned Ticket | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-06 | API | FR-22, AC-19 | Active Attachment download | Active owned Attachment downloads successfully | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-07 | API | FR-23, BR-31, BR-33, AC-20 | Soft removal | Removal marks metadata removed and retains row | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-08 | API | FR-24, BR-32, AC-21 | Removed Attachment download | Removed Attachment binary is not returned | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-09 | API | BR-34, AC-22 | Cross-Requester Attachment access | Requester B cannot access Requester A's Attachment | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-ATT-10 | API | BR-33 | Missing removal reason | Removal without valid reason is rejected | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| UI-ATT-01 | UI | AC-16 | Valid Attachment selection | Valid file appears in Attachment UI | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| UI-ATT-02 | UI | AC-17 | Invalid Attachment feedback | Invalid type or size shows clear message | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| UI-ATT-03 | UI | AC-20 | Removal confirmation | Confirmation and reason are required before remove request | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| UI-ATT-04 | UI | AC-21 | Removed Attachment state | Removed metadata remains visible without download action | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| UI-ATT-05 | UI | AC-23 | Upload failure after Ticket creation | Ticket remains successful and failed Attachment can be retried | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |

---

### 2.7 Responsive, Accessibility, and Style Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UI-STYLE-01 | UI Style | AC-24 | Zen Green classes/tokens | Required visual states use approved classes/tokens | `client/tests/lab-02/UiStyle.test.tsx` | Planned |
| UI-STYLE-02 | UI Style | AC-25 | Labels and required markers | Inputs have labels and required fields show marker + message | `client/tests/lab-02/UiStyle.test.tsx` | Planned |
| UI-STYLE-03 | UI Style | AC-25 | Busy and disabled controls | Disabled/busy controls are visibly and functionally disabled | `client/tests/lab-02/UiStyle.test.tsx` | Planned |
| E2E-RESP-01 | E2E | AC-24 | Desktop viewport | Required screens work at >= 992 px | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-RESP-02 | E2E | AC-24 | Tablet viewport | Required screens work at 768-991 px | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-RESP-03 | E2E | AC-24 | Mobile viewport | Fields stack and no horizontal page scrolling occurs | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-A11Y-01 | E2E | AC-25 | Keyboard navigation | Required controls are keyboard accessible with visible focus | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

---

### 2.8 End-to-End Workflow Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| E2E-01 | E2E | AC-01, AC-03, AC-05, AC-10, AC-15 | Main Requester flow | Select Requester -> Create Ticket -> find in My Tickets -> open Ticket Detail | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-02 | E2E | AC-04, AC-10, AC-14 | Multi-Requester ownership | Switching Requester changes list and blocks cross-owner Ticket access | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-03 | E2E | AC-16, AC-19, AC-20, AC-21 | Attachment lifecycle | Upload -> download -> soft remove -> removed download blocked | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-04 | E2E | AC-07, AC-08 | Create Ticket failures | Validation and backend failure states behave correctly | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-05 | E2E | AC-11, AC-12, AC-13 | My Tickets states | Search/filter/sort/page plus empty and no-results states work | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability

| Acceptance Criterion | Planned Test Evidence |
|---|---|
| AC-01 | API-REQ-01, API-REQ-02, E2E-01 |
| AC-02 | UI-REQ-01 |
| AC-03 | UI-REQ-02, E2E-01 |
| AC-04 | UI-REQ-03, UI-LIST-06, E2E-02 |
| AC-05 | API-TKT-01, UI-TKT-04, E2E-01 |
| AC-06 | API-TKT-02, API-TKT-03 |
| AC-07 | API-TKT-04, UI-TKT-02, E2E-04 |
| AC-08 | UI-TKT-05, E2E-04 |
| AC-09 | API-TKT-07 |
| AC-10 | API-LIST-01, UI-LIST-06, E2E-01, E2E-02 |
| AC-11 | API-LIST-02, API-LIST-03, API-LIST-04, API-LIST-05, E2E-05 |
| AC-12 | UI-LIST-02, E2E-05 |
| AC-13 | UI-LIST-03, E2E-05 |
| AC-14 | API-DETAIL-02, E2E-02 |
| AC-15 | API-DETAIL-01, UI-DETAIL-01, E2E-01 |
| AC-16 | API-ATT-01, UI-ATT-01, E2E-03 |
| AC-17 | API-ATT-02, API-ATT-03, UI-ATT-02 |
| AC-18 | API-ATT-04 |
| AC-19 | API-ATT-06, E2E-03 |
| AC-20 | API-ATT-07, UI-ATT-03, E2E-03 |
| AC-21 | API-ATT-08, UI-ATT-04, E2E-03 |
| AC-22 | API-ATT-09 |
| AC-23 | UI-ATT-05 |
| AC-24 | E2E-RESP-01, E2E-RESP-02, E2E-RESP-03 |
| AC-25 | UI-STYLE-02, UI-STYLE-03, E2E-A11Y-01 |

Every Acceptance Criterion has at least one planned test.

---

## 4. Responsive and Visual Checklist

The following checks will be completed against `docs/lab-02/ui-spec.md`.

### Application Shell

- [ ] TokTickIT identity is visible.
- [ ] My Tickets navigation is visible.
- [ ] Create Ticket navigation is visible.
- [ ] Selected Development Requester is visible.
- [ ] Change Requester action is usable.
- [ ] Active page is clearly indicated.
- [ ] Mobile navigation remains usable.

### Forms

- [ ] Labels appear above controls.
- [ ] Required fields show a red asterisk.
- [ ] Required fields also show validation text when invalid.
- [ ] Editable fields are visually distinct from read-only fields.
- [ ] Focus indicators remain visible.
- [ ] Description has sufficient space.
- [ ] Submit button has normal, disabled, and busy states.
- [ ] Error messages appear near relevant fields.

### My Tickets

- [ ] Desktop list/table is readable.
- [ ] Mobile Ticket representation is readable.
- [ ] Search remains usable.
- [ ] Filters remain usable.
- [ ] Sorting remains usable.
- [ ] Pagination remains usable.
- [ ] Empty state is clear.
- [ ] No-results state is clear and different from empty state.
- [ ] Create Ticket action remains visible.

### Ticket Detail

- [ ] Ticket information is clearly read-only.
- [ ] Ticket fields do not look editable.
- [ ] Attachment actions are visually separated from Ticket information.
- [ ] No Lab 3 controls appear.

### Attachments

- [ ] Long filenames do not break the layout.
- [ ] Active Attachment state is clear.
- [ ] Uploading state is clear.
- [ ] Invalid Attachment state is clear.
- [ ] Removed Attachment state is clear.
- [ ] Removed Attachment has no working download/preview control.

### Responsive Viewports

#### Desktop >= 992 px

- [ ] Multi-column layout is used where appropriate.
- [ ] Content uses a sensible maximum width.
- [ ] No clipped controls or labels.

#### Tablet 768-991 px

- [ ] Two-column layout is used where practical.
- [ ] Summary and Description retain sufficient width.
- [ ] Attachment controls remain readable.

#### Mobile < 768 px

- [ ] Fields stack vertically.
- [ ] Buttons remain touch-friendly.
- [ ] No horizontal page scrolling.
- [ ] Ticket list/card content is readable.
- [ ] Attachment names are readable.

### General Visual Inspection

- [ ] No unintended horizontal overflow.
- [ ] No overlapping components.
- [ ] No hidden buttons.
- [ ] No clipped validation messages.
- [ ] Zen Green palette is used consistently.
- [ ] Status and Priority are not communicated by color alone.
- [ ] Error and success states contain readable text.

---

## 5. Test Commands

These commands will be updated if the final implementation requires additional setup.

### Backend Tests

```bash
cd server
npm test