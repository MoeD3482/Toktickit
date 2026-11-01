# Lab 4 — REST API Specification

## 1. Purpose

Define the REST API contract for Actions Taken, Ticket workflow, Requester Dashboard, and IT Staff Dashboard.

All endpoints must follow existing server conventions. Before implementation, inspect existing routes and reuse them where appropriate rather than creating duplicate endpoints.

**API Prefix:** `/api/v1`

This document defines the intended API contract. Actual implementation and test results must be verified against the source code and `docs/lab-04/tests.md`.

## 2. Authentication and Authorization

- All protected endpoints require an authenticated session.
- Backend authorization is mandatory for every read and write operation.
- Requesters may access their own Tickets only.
- Requesters cannot create or update Actions Taken.
- IT Staff may access permitted Staff Ticket operations.
- Administrators may perform approved administrative and staff operations.
- The performer of an Action Taken is derived from the authenticated session.
- Client-supplied role or performer identity must never grant permission.
- Internal Notes must not be exposed through public responses.

## 3. Actions Taken

### 3.1 List Actions Taken

**Endpoint**

`GET /api/v1/tickets/:ticketId/actions-taken`

**Permissions**

- Requester: may read Actions Taken for an owned Ticket only.
- IT Staff / Administrator: may read Actions Taken for an accessible Ticket.

**Response**

```json
{
  "data": [
    {
      "id": "action-id",
      "ticketId": "ticket-id",
      "actionAt": "2026-10-23T08:30:00.000Z",
      "description": "Inspected the reported issue",
      "result": "Issue identified",
      "performedBy": {
        "id": "user-id",
        "displayName": "IT Staff"
      },
      "followUpRequired": true,
      "followUpNote": "Verify after the next restart",
      "attachmentNotes": null,
      "createdAt": "2026-10-23T08:35:00.000Z",
      "updatedAt": "2026-10-23T08:35:00.000Z"
    }
  ]
}
```

Return an empty `data` array when the Ticket has no Actions Taken.

### 3.2 Create Action Taken

**Endpoint**

`POST /api/v1/tickets/:ticketId/actions-taken`

**Authentication:** Required
**Allowed roles:** IT Staff, Administrator

**Required header**

`Idempotency-Key: <unique-request-key>`

The key must contain 1–128 characters.

**Request body**

```json
{
  "actionAt": "2026-10-23T08:30:00.000Z",
  "description": "Inspected the reported issue",
  "result": "Issue identified",
  "followUpRequired": true,
  "followUpNote": "Verify after the next restart",
  "attachmentNotes": null
}
```

**Field rules**

- `actionAt`: valid date/time string.
- `description`: required, 1–4000 characters.
- `result`: required, 1–4000 characters.
- `followUpRequired`: boolean; defaults to `false` if omitted.
- `followUpNote`: nullable, maximum 2000 characters; required when `followUpRequired` is `true`.
- `attachmentNotes`: nullable, maximum 2000 characters.

The server sets the performer identity from the authenticated session. Client-supplied `performedByUserId` must be ignored and must not override the authenticated identity.

**Responses**

- `201 Created`: Action Taken created.
- `200 OK`: Existing Action Taken returned for an identical idempotent retry. Include `Idempotency-Replayed: true`.
- `401 Unauthorized`: Authentication required.
- `403 Forbidden`: Insufficient role or permission.
- `404 Not Found`: Ticket not found or inaccessible according to the project's resource-disclosure policy.
- `409 Conflict`: Idempotency key reused with a different payload.
- `422 Unprocessable Entity`: Validation error.
- `500 Internal Server Error`: Unexpected failure with a safe response.

**Idempotency rules**

- The key is scoped to the Ticket and authenticated performer.
- Repeating the same key with the same payload returns the existing Action Taken.
- Reusing the same key with a different payload returns `409 Conflict`.
- A retry must not create a duplicate Action Taken.

### 3.3 Update Action Taken

**Endpoint**

`PATCH /api/v1/tickets/:ticketId/actions-taken/:actionId`

**Permissions**

Only authorized IT Staff and Administrators may update an Action Taken.

**Allowed fields**

- `actionAt`
- `description`
- `result`
- `followUpRequired`
- `followUpNote`
- `attachmentNotes`

The performer identity is not client-editable. Updates must preserve the existing record identity.

For stale-update protection, use the project's established optimistic concurrency mechanism. If no mechanism exists, use an approved version or expected-updated-time check and return `409 Conflict` when the submitted version is stale.

**Responses**

- `200 OK`: Update successful.
- `400 Bad Request`: Invalid request format.
- `401 Unauthorized`: Authentication required.
- `403 Forbidden`: Insufficient permission.
- `404 Not Found`: Action Taken or Ticket not found or inaccessible.
- `409 Conflict`: Stale update detected.
- `422 Unprocessable Entity`: Validation failure.
- `500 Internal Server Error`: Unexpected failure with a safe message.

Do not expose internal exceptions, SQL details, stack traces, or secrets.

## 4. Ticket Workflow

### 4.1 Endpoint

`PATCH /api/v1/staff/tickets/:ticketId/status`

Only authenticated IT Staff and Administrators may perform formal Ticket status changes.

### 4.2 Request Body

```json
{
  "status": "InProgress",
  "reason": "Ticket accepted for investigation.",
  "expectedUpdatedAt": "2026-10-31T10:00:00.000Z"
}
```

Fields:

- `status`: required permitted target status.
- `reason`: optional explanation, maximum 500 characters.
- `expectedUpdatedAt`: required latest Ticket timestamp in ISO 8601 format.

### 4.3 Approved Ticket Status Transition Matrix

| Current Status | Permitted Next Status |
|---|---|
| New | Open, Cancelled |
| Open | InProgress, Cancelled |
| InProgress | WaitingForRequester, Resolved, Cancelled |
| WaitingForRequester | Open, InProgress, Cancelled |
| Resolved | Closed, Reopened |
| Closed | Reopened |
| Reopened | Open, InProgress, Cancelled |
| Cancelled | None |

The backend must reject transitions that are not listed in this matrix.

### 4.4 Resolution Requirements

A Ticket may transition to `Resolved` only when:

1. At least one Action Taken exists.
2. The latest Action Taken does not require follow-up.

Requester resolution feedback is advisory. It must not directly change Ticket status.

### 4.5 Concurrency and Conflict Handling

The backend must perform an atomic conditional update using:

- Ticket ID.
- Current Ticket status.
- Expected `updatedAt` value.

The status update and TicketAction history record must be saved in one transaction.

A stale or concurrent update returns:

- HTTP `409 Conflict`.
- Error code: `TICKET_STATUS_CONFLICT`.

The client must reload authoritative Ticket details before retrying.

Invalid transitions and failed resolution requirements return HTTP `422`.

Successful updates return HTTP `200` with the updated `id`, `status`, and `updatedAt`.

## 5. Requester Dashboard

### 5.1 Endpoint

`GET /api/v1/requester/dashboard`

The authenticated Requester's identity determines the query scope. Never accept a Requester ID from the client as an authorization substitute.

### 5.2 Response

```json
{
  "data": {
    "openTicketCount": 0,
    "waitingForRequesterCount": 0,
    "recentlyUpdatedCount": 0,
    "recentlyResolvedCount": 0,
    "recentTickets": [
      {
        "id": "ticket-id",
        "ticketNo": "TKT-2026-00001",
        "summary": "Cannot access the VPN",
        "requestedPriority": "High",
        "status": "WaitingForRequester",
        "updatedAt": "2026-10-30T08:30:00.000Z"
      }
    ],
    "attentionRequiredTickets": []
  }
}
```

### 5.3 Calculation Rules

- `recentTickets` contains at most five Tickets.
- Sort by `updatedAt` descending, then Ticket number descending.
- Include only Tickets updated within the preceding 30 rolling 24-hour periods.
- `recentlyUpdatedCount` equals the number of returned `recentTickets`; therefore it is at most five.
- `attentionRequiredTickets` contains at most five Tickets currently in `WaitingForRequester`.
- Use the same ordering for attention-required Tickets.
- `recentlyResolvedCount` counts all Tickets currently in `Resolved` or `Closed` whose `updatedAt` falls within the same preceding 30-day UTC window.

Timestamps are stored and queried in UTC. The UI displays timestamps in `Asia/Bangkok` time.

### 5.4 Ticket List Drill-Down

The Requester Ticket list accepts one or more comma-separated supported `status` values and an optional `updatedWithinDays` value from 1 to 365.

Dashboard cards must use the existing ownership-scoped Ticket list semantics for drill-down.

## 6. IT Staff Dashboard

### 6.1 Endpoint

`GET /api/v1/staff/dashboard`

**Permissions:** IT Staff and approved Administrator access.

### 6.2 Response

```json
{
  "data": {
    "unassignedTicketCount": 0,
    "ownedByCurrentUserCount": 0,
    "statusCounts": {},
    "priorityCounts": {},
    "recentTickets": [],
    "urgentTickets": []
  }
}
```

### 6.3 Calculation and Data Rules

- All metrics must be calculated from authoritative database data.
- Unassigned counts use the authoritative Ticket ownership field.
- Owned Ticket counts use the current authenticated user's identity.
- Status and priority summaries follow the approved specification.
- Recent and urgent Ticket lists must use documented filtering and ordering rules.
- Do not return entire Ticket collections or unauthorized private information.
- Drill-down links must use existing Queue and Ticket Detail routes or query parameters.

Administrators may reuse the approved Staff Dashboard where permitted.

## 7. Dashboard Calculation Rules

The final API implementation must follow the calculations approved in `specification.md`.

- Open statuses are `New`, `Open`, `InProgress`, `WaitingForRequester`, and `Reopened`.
- Waiting-for-Requester metrics count the exact `WaitingForRequester` status.
- Recently updated metrics use the documented time window and limit.
- Recently resolved metrics count currently `Resolved` or `Closed` Tickets within the documented update window.
- Staff ownership and unassigned counts use authoritative ownership fields.
- IT Priority and status summaries use documented filtering rules.
- Time-based boundaries use UTC storage and `Asia/Bangkok` display.

## 8. Safe Errors and Validation

Follow existing API error conventions.

Errors must:

- Clearly identify validation, authorization, not-found, and conflict cases.
- Avoid exposing stack traces, SQL messages, or secrets.
- Avoid exposing password hashes.
- Avoid leaking another user's Ticket information.
- Avoid disclosing Internal Notes through public responses.
- Preserve user-entered values after recoverable client-side failures where applicable.

## 9. Compatibility and Regression

Preserve approved Labs 1–3 API behavior, including:

- Authentication and current-user behavior.
- Requester Tickets and attachments.
- Public Comments.
- IT Staff Queue and Ticket Detail.
- Internal Notes.
- Administrator User Management.

Do not change existing behavior unless required by an approved Lab 4 requirement.

## 10. API Acceptance Checklist

- [x] Actions Taken list, create, and update contracts are implemented.
- [x] Authenticated performer identity is enforced by the server.
- [x] Requester read-only permissions are enforced.
- [x] Required fields and follow-up rules are validated.
- [x] Idempotency prevents duplicate Action Taken creation on retry.
- [x] Ticket workflow and resolution checks are server-enforced.
- [x] Stale updates are detected or safely handled.
- [x] Requester Dashboard metrics are ownership-scoped.
- [x] Staff Dashboard metrics match database queries.
- [x] Error responses are safe and consistent.
- [x] API and regression tests pass.



**Implementation note:** This specification is a contract, not proof that every proposed behavior has been implemented. Confirm actual routes, response shapes, status codes, concurrency behavior, and tests against the source code before marking an item complete.