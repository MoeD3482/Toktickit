# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal

Lab 2 extends TokTickIT from the Lab 1 vertical slice into a Requester-facing ticketing MVP. A Development Requester can be selected for testing, create IT support tickets, view only their own tickets, search and filter their ticket list, open Ticket Detail, and manage permitted attachments. The sprint also establishes the reusable Zen Green UI foundation and automated test coverage for the Requester workflow.

---

## 2. Stakeholder Request Interpretation

The IT department requires a professional and responsive Requester-facing ticketing experience.

A Requester must be able to:

- select a temporary Development Requester identity for Lab 2 testing;
- create a support Ticket;
- select a Category and Related System;
- choose a Requested Priority;
- enter a Ticket Summary and Description;
- attach permitted supporting files;
- receive an official system-generated Ticket Number;
- view only Tickets belonging to the selected Requester;
- search, filter, sort, and paginate through their Tickets;
- open an owned Ticket Detail screen;
- upload and download permitted Attachments; and
- soft-remove their own permitted Attachments.

The Development Requester selector is only a temporary testing mechanism. It is not authentication.

---

## 3. Scope

### Included

- Development Requester Selection
- Development Requester switching
- Active Requester seed data
- Related System reference data
- Ticket creation
- Backend-generated Ticket Number
- Ticket ownership
- Requested Priority
- Initial Ticket status
- My Tickets
- Search
- Filtering
- Sorting
- Pagination
- Requester Ticket Detail
- Attachment upload
- Attachment metadata
- Attachment download
- Attachment soft removal
- Loading states
- Empty states
- No-results states
- Validation states
- API failure states
- Zen Green UI
- Responsive desktop, tablet, and mobile layouts
- Unit tests
- API/integration tests
- UI tests
- Responsive and visual checks
- Playwright E2E tests

### Excluded

The following are explicitly outside Lab 2:

- real login and logout;
- passwords and password hashing;
- sessions and authentication tokens;
- real role-based authentication;
- IT Staff dashboard and queues;
- Ticket assignment;
- IT Priority changes;
- Public Comments;
- Internal Notes;
- Actions Taken;
- status transitions after the initial New status;
- resolving, closing, reopening, or cancelling Tickets;
- Administrator functions; and
- other Lab 3 functionality.

---

## 4. Functional Requirements

### Development Requester

**FR-01** The system shall retrieve active Development Requesters from the backend database.

**FR-02** The system shall allow the user to select one active Development Requester before entering requester-specific Ticket screens.

**FR-03** The system shall display the currently selected Development Requester in the application shell.

**FR-04** The system shall allow the user to change the selected Development Requester and reload requester-specific data.

### Reference Data

**FR-05** The system shall retrieve active Ticket Categories from the backend database.

**FR-06** The system shall retrieve active Related Systems from the backend database.

### Create Ticket

**FR-07** The system shall allow the selected Development Requester to create a Ticket containing the required Ticket information.

**FR-08** The backend shall generate a unique official Ticket Number after a Ticket is successfully created.

**FR-09** The system shall associate every created Ticket with the selected Development Requester.

**FR-10** The system shall validate required Ticket fields in both the frontend and backend.

**FR-11** The system shall preserve entered Ticket form values after a recoverable API failure.

**FR-12** The system shall prevent duplicate Ticket creation caused by repeated submission of the same request.

### My Tickets

**FR-13** The system shall retrieve only Tickets belonging to the currently selected Development Requester.

**FR-14** The system shall allow the Requester to search their Tickets.

**FR-15** The system shall allow the Requester to filter their Tickets using the filters defined in the API contract.

**FR-16** The system shall allow the Requester to sort their Tickets using approved sortable fields.

**FR-17** The system shall paginate the Requester Ticket list and return pagination metadata.

### Ticket Detail

**FR-18** The system shall allow the selected Requester to open one of their own Tickets in read-only Ticket Detail view.

**FR-19** The backend shall prevent one Development Requester from retrieving another Requester's Ticket.

### Attachments

**FR-20** The system shall allow permitted Attachments to be uploaded to a Requester-owned Ticket.

**FR-21** The system shall display Attachment metadata for a Requester-owned Ticket.

**FR-22** The system shall allow an active permitted Attachment to be downloaded by the Requester who owns the Ticket.

**FR-23** The system shall allow a Requester to soft-remove one of their permitted Attachments.

**FR-24** The system shall prevent removed Attachments from being downloaded or previewed.

---

## 5. Business Rules

**BR-01** The official Ticket Number is generated by the backend and must be unique.

**BR-02** A newly created Ticket has Current Status `New`.

**BR-03** Lab 2 uses a Development Requester selector instead of real authentication.

**BR-04** Only active Development Requesters appear in the Development Requester selector.

**BR-05** At least four active Development Requesters and at least one inactive Development Requester shall exist in seed data.

**BR-06** Changing the Development Requester changes the current testing context and requester-specific data must be reloaded.

**BR-07** One Development Requester may own many Tickets, but every Ticket belongs to exactly one Requester.

**BR-08** A Requester may retrieve only Tickets associated with their selected Development Requester identity.

**BR-09** Direct backend requests for another Requester's Ticket must be rejected even if the frontend normally hides that Ticket.

**BR-10** The four Ticket Categories remain:

1. Account and Access
2. Hardware
3. Software
4. Network

**BR-11** At least six active realistic Related Systems shall be seeded idempotently.

**BR-12** Requested Priority uses the values:

- Low
- Medium
- High
- Urgent

**BR-13** Ticket Number, Ticket Date, Requester, and Current Status are system-generated or read-only values after creation.

**BR-14** Ticket Summary is required, trimmed before validation, and must contain between 5 and 120 characters.

**BR-15** Description is required, trimmed before validation, and must contain between 10 and 2000 characters.

**BR-16** Category is required and must reference an active Category.

**BR-17** Related System is required and must reference an active Related System.

**BR-18** Requested Priority is required and must contain one permitted priority value.

**BR-19** Frontend validation improves usability, but backend validation remains authoritative.

**BR-20** A Ticket creation submission uses a unique client request identifier so retrying the same submission does not create duplicate Tickets.

**BR-21** Search is case-insensitive and searches the approved Ticket Number, Summary, and Description fields.

**BR-22** My Tickets supports filtering by Category, Requested Priority, and Current Status.

**BR-23** My Tickets supports sorting by Ticket Date, Last Updated, Ticket Number, and Requested Priority.

**BR-24** The default Ticket-list sort is Last Updated descending, with Ticket Number descending as the secondary deterministic sort.

**BR-25** Ticket-list page numbering begins at page 1.

**BR-26** Permitted page sizes are 10, 20, and 50. The default page size is 10.

**BR-27** Invalid search, filter, sort, or pagination parameters must return a safe validation response and must not expose implementation details.

### Attachment Rules

**BR-28** Allowed Attachment types are JPG/JPEG, PNG, WEBP, and PDF.

**BR-29** The maximum Attachment size is 5 MB per file.

**BR-30** A Ticket may contain no more than five active Attachments.

**BR-31** Attachment removal is soft removal. Attachment metadata remains in the database.

**BR-32** A removed Attachment must not be downloadable or previewable.

**BR-33** Attachment removal requires user confirmation and a non-empty removal reason.

**BR-34** A Requester may manage Attachments only for Tickets belonging to the selected Requester.

**BR-35** Attachment filenames shown to the user preserve the original safe display name, while stored objects use generated storage identifiers.

**BR-36** Attachment validation must check allowed type, file size, active Attachment count, and Ticket ownership.

**BR-37** If the Ticket is created successfully but a later Attachment upload fails, the Ticket remains created. The UI reports the failed upload and allows the Requester to retry from the Ticket Detail screen.

**BR-38** Removed Attachment metadata remains visible as removed metadata but without an active download or preview action.

### Failure and State Rules

**BR-39** Recoverable API failure during Ticket creation must not clear valid user-entered form values.

**BR-40** The UI must distinguish loading, validation failure, submitting, success, empty, no-results, and API-failure states where applicable.

**BR-41** Unexpected backend errors return safe messages and must not expose stack traces, database credentials, storage keys, or other secrets.

**BR-42** Real authentication will replace the Development Requester selector in Lab 3 without changing Ticket ownership semantics.

---

## 6. UI Specification Summary

Lab 2 uses the instructor-required Zen Green visual language.

Primary UI tokens:

- Primary green: `#006B3C`
- Secondary green: `#0B7A46`
- Pale green: `#EAF6EF`
- Page background: `#F5F7F6`
- Surface/card background: white
- Error: dark red with text and border
- Warning: amber
- Success: green with readable text and non-color indication

The detailed UI contract is defined in:

`docs/lab-02/ui-spec.md`

Required screens:

1. Development Requester Selection
2. Create Ticket
3. My Tickets
4. Requester Ticket Detail

Required shared UI behavior includes:

- application shell;
- selected Requester display;
- Change Requester action;
- active navigation;
- reusable form controls;
- consistent labels;
- visible required-field markers;
- validation messages near associated fields;
- read-only field styling;
- loading indicators;
- busy buttons;
- success feedback;
- failure feedback;
- empty and no-results states;
- priority and status badges;
- desktop Ticket table or equivalent;
- responsive mobile Ticket representation; and
- responsive Attachment controls.

Responsive targets:

- Desktop: `>= 992px`
- Tablet: `768px - 991px`
- Mobile: `< 768px`

No supported viewport may contain unintended horizontal page scrolling, clipped labels, overlapping messages, hidden actions, or unreadable Attachment names.

---

## 7. Data Changes

Lab 2 extends the PostgreSQL and Prisma data model.

### Development Requester

Suggested model name: `RequesterUser`

Required information:

- `id`
- `displayName`
- `email`
- `isActive`
- `createdAt`
- `updatedAt`

Email must be unique.

### Related System

Suggested model name: `RelatedSystem`

Required information:

- `id`
- `name`
- `isActive`
- `createdAt`
- `updatedAt`

Name must be unique.

### Ticket

Required information:

- internal `id`
- unique `ticketNo`
- `requesterId`
- `categoryId`
- `relatedSystemId`
- `summary`
- `description`
- `requestedPriority`
- `status`
- unique `clientRequestId`
- `createdAt`
- `updatedAt`

The official Ticket Number follows the approved system-level format:

`TKT-YYYY-NNNNN`

Ticket numbers are generated transactionally so concurrent creation cannot produce duplicates.

### Attachment

Required information:

- `id`
- `ticketId`
- uploader/requester information
- `originalFilename`
- `mimeType`
- `sizeBytes`
- generated `storageKey`
- `createdAt`
- `removedAt`
- remover information
- `removalReason`

Attachment binaries are stored using the approved attachment-storage adapter. PostgreSQL stores Attachment metadata.

### Required Relationships

- one Requester may own many Tickets;
- one Ticket belongs to one Requester;
- one Category may be used by many Tickets;
- one Related System may be used by many Tickets; and
- one Ticket may have many Attachments.

### Index Decisions

Indexes should support frequently used My Tickets operations, including:

- `requesterId`
- `categoryId`
- `relatedSystemId`
- `status`
- `requestedPriority`
- `createdAt`
- `updatedAt`

A composite index beginning with `requesterId` should be used for requester-owned Ticket-list queries because all My Tickets retrieval is scoped by Requester.

All schema changes must use committed Prisma migrations.

---

## 8. API Contract

The detailed endpoint and DTO contract is defined in:

`docs/lab-02/api-spec.md`

Lab 2 application endpoints follow the approved system-level `/api/v1` API convention.

Required capabilities include:

- retrieve active Categories;
- retrieve active Related Systems;
- retrieve active Development Requesters;
- create a Ticket;
- retrieve the selected Requester's Tickets;
- retrieve one owned Ticket;
- upload an Attachment;
- retrieve Attachment metadata;
- download an active Attachment; and
- soft-remove an Attachment.

Proposed endpoint family:

- `GET /api/v1/categories`
- `GET /api/v1/related-systems`
- `GET /api/v1/development-requesters`
- `POST /api/v1/tickets`
- `GET /api/v1/tickets`
- `GET /api/v1/tickets/:ticketId`
- `POST /api/v1/tickets/:ticketId/attachments`
- `GET /api/v1/tickets/:ticketId/attachments`
- `GET /api/v1/tickets/:ticketId/attachments/:attachmentId/download`
- `DELETE /api/v1/tickets/:ticketId/attachments/:attachmentId`

The Development Requester context will be sent to Requester-specific API operations using the testing-context mechanism defined in `api-spec.md`.

Expected status families include:

- `200` successful retrieval;
- `201` successful resource creation;
- `403` ownership/access rejection;
- `404` missing resource;
- `409` duplicate or conflicting operation where applicable;
- `422` validation failure; and
- `500` safe unexpected server failure.

The API must never depend on frontend hiding for ownership protection.

---

## 9. Acceptance Criteria

**AC-01** Given active Development Requesters exist, when the selection screen loads, then only active Requesters are displayed.

**AC-02** Given no Development Requester has been selected, when requester-specific functionality is opened, then the Development Requester Selection screen is shown.

**AC-03** Given a Development Requester is selected, when the application shell loads, then the selected Requester's identity is displayed.

**AC-04** Given Requester A is selected, when the user changes to Requester B, then requester-specific data is reloaded for Requester B.

**AC-05** Given valid Ticket data, when the Requester submits Create Ticket, then exactly one Ticket is saved and an official Ticket Number is returned.

**AC-06** Given a successful Ticket creation, when the Ticket is stored, then its requesterId matches the currently selected Development Requester and its Current Status is New.

**AC-07** Given invalid required Ticket data, when the Requester submits the form, then field-level validation messages are shown and an invalid Ticket is not created.

**AC-08** Given the Ticket API is unavailable, when submission fails recoverably, then a safe failure message is displayed and valid form values remain available.

**AC-09** Given the same Ticket submission is retried using the same client request identifier, when the backend receives it again, then a duplicate Ticket is not created.

**AC-10** Given Requester A owns Tickets, when Requester A opens My Tickets, then only Requester A's Tickets are returned.

**AC-11** Given Requester A's Ticket list is displayed, when the Requester searches, filters, sorts, or changes page, then the list and pagination metadata reflect the documented query contract.

**AC-12** Given a Requester owns no Tickets, when My Tickets loads without filters, then the empty state is displayed.

**AC-13** Given a Requester owns Tickets but the current search or filters match none, when My Tickets loads, then a no-results state distinct from the empty state is displayed.

**AC-14** Given Requester B is selected, when a Ticket belonging to Requester A is requested directly, then the backend does not return Requester A's Ticket data.

**AC-15** Given a Requester opens one of their own Tickets, when Ticket Detail loads, then Ticket information is shown as read-only.

**AC-16** Given a permitted valid file of at most 5 MB is selected and the Ticket has fewer than five active Attachments, when upload succeeds, then Attachment metadata is displayed.

**AC-17** Given an unsupported or oversized file is selected, when validation occurs, then the file is rejected with a clear message and is not stored.

**AC-18** Given a Ticket already has five active Attachments, when another Attachment is submitted, then the upload is rejected safely.

**AC-19** Given an active Attachment belongs to a Requester-owned Ticket, when the Requester downloads it, then the file is returned successfully.

**AC-20** Given the Requester confirms Attachment removal and provides a valid reason, when removal succeeds, then the Attachment is soft-removed and its metadata is retained.

**AC-21** Given an Attachment has been soft-removed, when its download or preview is requested, then the binary content is not returned.

**AC-22** Given Requester B is selected, when an Attachment belonging to Requester A's Ticket is requested directly, then access is rejected.

**AC-23** Given a Ticket was created successfully but an Attachment upload fails afterward, when the failure is reported, then the Ticket remains created and the Attachment can be retried later.

**AC-24** Given desktop, tablet, and mobile supported viewports, when the required screens are displayed, then controls remain usable without clipped content, overlap, hidden actions, or unintended horizontal page scrolling.

**AC-25** Given a keyboard user interacts with the required screens, when controls receive focus, then visible focus indicators, programmatic labels, and usable keyboard interaction are available.

---

## 10. Definition of Done

Lab 2 product work is complete only when all of the following are true:

- [ ] All approved Lab 2 scope is implemented.
- [ ] All Functional Requirements are satisfied.
- [ ] All Business Rules are implemented.
- [ ] Every Acceptance Criterion maps to at least one planned test.
- [ ] All required Prisma migrations are committed.
- [ ] Seed data is idempotent.
- [ ] At least four active and one inactive Development Requesters exist.
- [ ] At least six Related Systems exist.
- [ ] Development Requester switching works.
- [ ] Ticket ownership is enforced by the backend.
- [ ] Create Ticket works from UI through API to PostgreSQL.
- [ ] Official Ticket Numbers are backend-generated and unique.
- [ ] My Tickets search, filtering, sorting, and pagination work.
- [ ] Ticket Detail ownership protection works.
- [ ] Attachment upload, download, validation, and soft removal work.
- [ ] Removed Attachments cannot be downloaded or previewed.
- [ ] Unit tests pass.
- [ ] API/integration tests pass.
- [ ] UI component tests pass.
- [ ] UI style tests pass.
- [ ] Responsive checks pass.
- [ ] Playwright E2E tests pass.
- [ ] No required automated test is skipped, disabled, or commented out.
- [ ] Desktop visual inspection is complete.
- [ ] Tablet visual inspection is complete.
- [ ] Mobile visual inspection is complete.
- [ ] The implemented UI conforms to `ui-spec.md`.
- [ ] The implemented APIs conform to `api-spec.md`.
- [ ] The final test evidence is recorded in `tests.md`.
- [ ] `reviewer.md` contains required peer-review evidence.
- [ ] `ai-use.md` contains the required AI-use record and reflection.
- [ ] README setup and testing instructions are current.
- [ ] Each Issue uses its own feature branch.
- [ ] Each implementation Issue enters `lab2-staging` through a peer-reviewed Pull Request.
- [ ] Review comments are addressed.
- [ ] All Lab 2 Issues reach Done in the GitHub Kanban board.
- [ ] Full tests pass on the final `main` branch.
- [ ] Final required submission evidence has been captured.

---

## 11. Assumptions and Decisions

### AD-01 — API Versioning

New Lab 2 endpoints use the approved System-Level SDS `/api/v1` convention. Existing Lab 1 endpoints do not need to be rewritten solely for this sprint unless required for compatibility.

### AD-02 — Development Requester Context

Because authentication is explicitly excluded from Lab 2, Requester identity is a testing context only. The exact transport mechanism is documented in `api-spec.md` and must not be described as secure authentication.

### AD-03 — Ticket Number

The approved system-wide Ticket Number format `TKT-YYYY-NNNNN` is used.

### AD-04 — Zen Green UI

The Lab 2 handout explicitly requires the Zen Green Theme for Requester-facing Lab 2 screens. Therefore the Lab 2 UI specification uses the instructor-provided Zen Green tokens for this sprint.

### AD-05 — Duplicate Submission Prevention

Ticket creation uses a client-generated request identifier stored under a unique database constraint. Repeating the same creation request does not create another Ticket.

### AD-06 — Attachment Creation Sequence

Ticket creation and Attachment upload are separate operations. The Ticket is created first. Selected Attachments are uploaded afterward. If an upload fails, the Ticket remains valid and the failed Attachment can be retried from Ticket Detail.

### AD-07 — Attachment Storage

Attachment metadata is stored in PostgreSQL. Attachment binary storage is accessed through the approved storage adapter rather than storing file contents directly in relational database fields.

### AD-08 — Ownership Enforcement

Ownership is enforced in backend services and queries. Client-side hiding is for usability only and is never treated as access control.

### AD-09 — Time Handling

Dates and timestamps are stored and transported in UTC and formatted for display by the client.

### AD-10 — Validation Status

Lab 2 endpoints use HTTP `422 Unprocessable Entity` for structured input-validation failures, consistent with the approved System-Level SDS.