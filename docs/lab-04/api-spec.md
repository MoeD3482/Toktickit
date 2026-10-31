# Lab 4 â€” REST API Specification

## 1. Purpose

Define the proposed REST API contract for Actions Taken, Ticket workflow,
Requester Dashboard and IT Staff Dashboard.

All routes must follow existing server conventions. Before implementation,
check existing route names and avoid duplicating endpoints.

Prefix: `/api/v1`

## 2. Authentication and Authorization

- All protected endpoints require an authenticated session.
- Backend authorization is mandatory for every read and write operation.
- Requesters may access their own Tickets only.
- Requesters cannot create or update Actions Taken.
- IT Staff may access permitted Staff Ticket operations.
- Administrators may perform approved administrative and staff operations.
- The performer is always derived from authentication.
- Client-supplied role or performer identity must not grant permission.

## 3. Actions Taken

### 3.1 List Actions Taken

Proposed endpoint:

`GET /api/v1/tickets/:ticketId/actions-taken`

Permission:
- Requester: only an owned Ticket.
- IT Staff/Administrator: only an accessible Ticket.

Response:

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

Return an empty `data` array when the Ticket has no actions.

### 3.2 Create Action Taken

Proposed endpoint:

`POST /api/v1/tickets/:ticketId/actions-taken`

Required request fields:

    {
      "actionAt": "2026-10-23T08:30:00.000Z",
      "description": "Inspected the reported issue",
      "result": "Issue identified",
      "followUpRequired": true,
      "followUpNote": "Verify after the next restart",
      "attachmentNotes": null
    }

The server sets `performedByUserId` from the authenticated session.

Success:
- `201 Created`
- Return the created Action Taken using the documented response shape.

Validation:
- Action Date/Time, Action Description, and Result are required.
- Follow-up Note is required when Follow-Up Required is true.
- Reject invalid dates, invalid field types and excessive text lengths.
- Reject missing or inaccessible Tickets.
- Do not permit Requesters to create actions.

### 3.3 Update Action Taken

Proposed endpoint:

`PATCH /api/v1/tickets/:ticketId/actions-taken/:actionId`

Allowed fields:
- actionAt
- description
- result
- followUpRequired
- followUpNote
- attachmentNotes

The performer identity is not client-editable.

For stale-update protection, use the project's established optimistic
concurrency mechanism. If one does not exist, implement an approved
version or expected-updated-time check and return `409 Conflict` when
the submitted version is stale.

Return:
- `200 OK` on success.
- `400 Bad Request` for invalid input.
- `401 Unauthorized` when authentication is absent.
- `403 Forbidden` for an authenticated user without permission.
- `404 Not Found` for a nonexistent or inaccessible resource according
  to the project's safe resource-disclosure policy.
- `409 Conflict` for a detected stale update.
- `500 Internal Server Error` with a safe message for unexpected failure.

The project should not expose internal exceptions to clients.

## 4. Ticket Workflow

### Endpoint

`PATCH /api/v1/staff/tickets/:ticketId/status`

Only authenticated IT Staff and Administrators may perform formal
Ticket status changes.

### Request Body

```json
{
  "status": "Open",
  "reason": "Ticket accepted for investigation.",
  "expectedUpdatedAt": "2026-10-31T10:00:00.000Z"
}

### Approved Ticket Status Transition Matrix

Only authenticated IT Staff and Administrators may perform formal status changes.

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

### Status Update Request

Endpoint: `PATCH /api/v1/staff/tickets/:ticketId/status`

Required request fields:
- `status`: permitted target status.
- `reason`: optional explanation, maximum 500 characters.
- `expectedUpdatedAt`: required latest Ticket timestamp in ISO 8601 format.

### Resolution Requirements

A Ticket can transition to `Resolved` only when:
1. At least one Action Taken exists.
2. The latest Action Taken does not require follow-up.

Requester resolution feedback is advisory and does not directly change Ticket status.

### Concurrency and Conflict Handling

The backend performs an atomic conditional update using Ticket ID, current status, and `updatedAt`.

The status update and TicketAction history record are saved in one transaction.

A stale or concurrent update returns:
- HTTP `409 Conflict`
- Error code: `TICKET_STATUS_CONFLICT`
- The client must reload Ticket details before retrying.

Invalid transitions and failed resolution requirements return HTTP `422`.

Successful updates return HTTP `200` with `id`, `status`, and `updatedAt`.

## 5. Requester Dashboard

Proposed endpoint:

`GET /api/v1/requester/dashboard`

Return concise backend-calculated information:

    {
      "data": {
        "openTicketCount": 0,
        "waitingForRequesterCount": 0,
        "recentlyUpdatedCount": 0,
        "recentlyResolvedCount": 0,
        "recentTickets": [],
        "attentionRequiredTickets": []
      }
    }

The shape may be refined before implementation, but metric names,
calculations, time-zone policy and drill-down parameters must be
documented and tested.

The authenticated Requester's identity determines the query scope.
Never accept a Requester ID from the client as an authorization substitute.

## 6. IT Staff Dashboard

Proposed endpoint:

`GET /api/v1/staff/dashboard`

Permission:
- IT Staff and approved Administrator access.

Return concise operational information, such as:

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

Every metric must be calculated from authoritative database data.

The response must not return entire Ticket collections or unauthorized
private information. Drill-down links should use the existing Queue and
Ticket Detail routes/query parameters.

## 7. Dashboard Calculation Rules

The final API implementation must use the calculations approved in
specification.md.

- Open statuses are New, Open, In Progress, Waiting for Requester,
  and Reopened.
- Waiting-for-Requester metrics count the exact Waiting for Requester status.
- Recently updated metrics use the documented time window and limit.
- Recently resolved metrics count currently Resolved or Closed Tickets
  within the documented update window.
- Staff ownership and unassigned counts use authoritative ownership fields.
- IT Priority and status summaries use documented filtering rules.
- All time-based boundaries use the agreed UTC storage and
  Asia/Bangkok display policy.

## 8. Safe Errors and Validation

Follow existing API error conventions.

Errors must:
- Clearly identify validation, authorization, not-found and conflict cases.
- Avoid exposing stack traces, SQL messages or secrets.
- Avoid exposing password hashes.
- Avoid leaking another user's Ticket information.
- Avoid disclosing Internal Notes through public responses.

## 9. Compatibility and Regression

Preserve all approved Lab 1â€“3 API behavior, including:
- Authentication and current-user behavior.
- Requester Tickets and attachments.
- Public Comments.
- IT Staff Queue and Ticket Detail.
- Internal Notes.
- Administrator user management.

## 10. API Acceptance Checklist

- [ ] Actions Taken list/create/update contracts are implemented.
- [ ] Authenticated performer identity is enforced by the server.
- [ ] Requester read-only permissions are enforced.
- [ ] Required fields and follow-up rules are validated.
- [ ] Ticket workflow and resolution checks are server-enforced.
- [ ] Stale updates are detected or safely handled.
- [ ] Requester Dashboard metrics are ownership-scoped.
- [ ] Staff Dashboard metrics match database queries.
- [ ] Error responses are safe and consistent.
- [ ] API and regression tests pass.

### POST /api/v1/tickets/:ticketId/actions-taken

Authentication: Required
Allowed roles: ITStaff, Administrator

Required header:
- Idempotency-Key: unique request key (1â€“128 characters)

Request body:
- actionAt: valid date/time string
- description: required, 1â€“4000 characters
- result: required, 1â€“4000 characters
- followUpRequired: boolean (defaults to false)
- followUpNote: nullable, maximum 2000 characters
- attachmentNotes: nullable, maximum 2000 characters

The performer is always derived from the authenticated session.
Client-supplied performedByUserId is ignored.

Responses:
- 201: Action Taken created.
- 200: Existing Action Taken returned for an identical retry.
  Response header: Idempotency-Replayed: true
- 401: Authentication required.
- 403: Insufficient role.
- 404: Ticket not found.
- 409: Idempotency key reused with a different payload.
- 422: Validation error.
- 500: Internal server error.

Idempotency:
The key is scoped to the Ticket and authenticated performer.
Submitting the same key and same payload returns the existing Action Taken.
Submitting the same key with a different payload returns 409.