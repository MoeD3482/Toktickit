# Lab 3 REST API Specification

## 1. Purpose

This document defines the REST API contract for the TokTickIT Lab 3 authenticated service-desk sprint.

Lab 3 supports:

- authentication;
- current-user session retrieval;
- role-based authorization;
- authenticated Requester ticket workflows;
- IT Staff queues and ticket operations;
- public comments;
- internal notes;
- Actions Taken;
- Administrator user management;
- Lab 2 Requester and Attachment regression; and
- safe validation, authentication, and authorization responses.

---

## 2. API Base Path

Lab 3 endpoints use:

```text
/api/v1
```

Protected endpoints require an authenticated session unless explicitly documented as public.

---

## 3. Authentication Contract

### Session Transport

The preferred session transport is a secure HTTP-only cookie set by the backend after successful login.

Client code must not store password hashes, session secrets, or long-lived credentials in browser-accessible storage.

### Current User Shape

```json
{
  "id": "usr_123",
  "displayName": "Anan Chaiyasit",
  "email": "anan.chaiyasit@example.com",
  "roles": ["Requester"],
  "isActive": true
}
```

### Error Shape

All error responses use this shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Safe message for the user.",
    "fieldErrors": [
      {
        "field": "email",
        "message": "Email is required."
      }
    ]
  }
}
```

Authentication errors must not reveal whether an email address exists.

---

## 4. Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful retrieval or update |
| 201 | Successful creation |
| 204 | Successful operation with no body |
| 400 | Malformed request |
| 401 | Authentication required or invalid session |
| 403 | Authenticated but not authorized |
| 404 | Missing resource or intentionally hidden inaccessible resource |
| 409 | Conflict such as duplicate email or protected last Administrator |
| 422 | Structured validation failure |
| 500 | Safe unexpected server failure |

---

## 5. Authentication Endpoints

### POST /api/v1/auth/login

Public endpoint.

Request:

```json
{
  "email": "anan.chaiyasit@example.com",
  "password": "example-password"
}
```

Success response: `200`

```json
{
  "data": {
    "user": {
      "id": "usr_123",
      "displayName": "Anan Chaiyasit",
      "email": "anan.chaiyasit@example.com",
      "roles": ["Requester"],
      "isActive": true
    }
  }
}
```

Failure responses:

- `401 INVALID_CREDENTIALS`
- `422 VALIDATION_ERROR`
- `500 AUTHENTICATION_FAILED`

### POST /api/v1/auth/logout

Protected endpoint.

Success response: `204`

The server invalidates the current session.

### GET /api/v1/auth/me

Protected endpoint.

Success response: `200`

```json
{
  "data": {
    "user": {
      "id": "usr_123",
      "displayName": "Anan Chaiyasit",
      "email": "anan.chaiyasit@example.com",
      "roles": ["Requester"],
      "isActive": true
    }
  }
}
```

Failure response:

- `401 AUTHENTICATION_REQUIRED`

---

## 6. Reference Data Endpoints

### GET /api/v1/categories

Protected endpoint. Roles: Requester, IT Staff, Administrator.

Returns active Ticket Categories using the Lab 2 response shape:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Hardware"
    }
  ]
}
```

### GET /api/v1/related-systems

Protected endpoint. Roles: Requester, IT Staff, Administrator.

Returns active Related Systems using the Lab 2 response shape.

---

## 7. Requester Ticket Endpoints

Requester endpoints use the authenticated user as the Requester identity.

The Lab 2 `X-Development-Requester-Id` testing header is not accepted as authentication for Lab 3 user workflows.

### POST /api/v1/tickets

Protected endpoint. Roles: Requester.

Creates a Ticket for the authenticated Requester.

Request:

```json
{
  "categoryId": 1,
  "relatedSystemId": "rel_123",
  "summary": "Cannot access VPN",
  "description": "VPN sign-in fails after password change.",
  "requestedPriority": "High",
  "clientRequestId": "client-generated-id"
}
```

Success response: `201`

The response includes the Lab 2 created Ticket shape plus Lab 3 fields when available:

```json
{
  "data": {
    "id": "tkt_123",
    "ticketNo": "TKT-2026-00001",
    "requester": {
      "id": "usr_123",
      "displayName": "Anan Chaiyasit"
    },
    "category": {
      "id": 1,
      "name": "Account and Access"
    },
    "relatedSystem": {
      "id": "rel_123",
      "name": "VPN"
    },
    "summary": "Cannot access VPN",
    "description": "VPN sign-in fails after password change.",
    "requestedPriority": "High",
    "itPriority": null,
    "status": "New",
    "assignedTo": null,
    "createdAt": "2026-09-18T00:00:00.000Z",
    "updatedAt": "2026-09-18T00:00:00.000Z"
  }
}
```

### GET /api/v1/tickets

Protected endpoint. Roles: Requester.

Returns only Tickets owned by the authenticated Requester.

Query parameters:

- `search`
- `categoryId`
- `relatedSystemId`
- `requestedPriority`
- `status`
- `sort`
- `order`
- `page`
- `pageSize`

Success response: `200`

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

### GET /api/v1/tickets/:ticketId

Protected endpoint. Roles: Requester.

Returns one authenticated Requester-owned Ticket. Inaccessible Tickets return `404 TICKET_NOT_FOUND`.

### Attachment Endpoints

Lab 3 preserves the Lab 2 Attachment endpoint family, but the authenticated session replaces the Lab 2 requester header:

- `POST /api/v1/tickets/:ticketId/attachments`
- `GET /api/v1/tickets/:ticketId/attachments`
- `GET /api/v1/tickets/:ticketId/attachments/:attachmentId/download`
- `DELETE /api/v1/tickets/:ticketId/attachments/:attachmentId`

Requester ownership, file type, file size, maximum active Attachment count, soft removal, and removed-download blocking remain unchanged.

---

## 8. Staff Ticket Endpoints

### GET /api/v1/staff/tickets

Protected endpoint. Roles: IT Staff, Administrator when authorized for staff operations.

Returns the IT Staff queue.

Query parameters:

- `search`
- `categoryId`
- `relatedSystemId`
- `requestedPriority`
- `itPriority`
- `status`
- `assignedToUserId`
- `requesterUserId`
- `sort`
- `order`
- `page`
- `pageSize`

Supported sort fields:

- `ticketNo`
- `createdAt`
- `updatedAt`
- `requestedPriority`
- `itPriority`
- `status`

Success response:

```json
{
  "data": [
    {
      "id": "tkt_123",
      "ticketNo": "TKT-2026-00001",
      "summary": "Cannot access VPN",
      "requester": {
        "id": "usr_123",
        "displayName": "Anan Chaiyasit"
      },
      "category": {
        "id": 1,
        "name": "Account and Access"
      },
      "relatedSystem": {
        "id": "rel_123",
        "name": "VPN"
      },
      "requestedPriority": "High",
      "itPriority": "High",
      "status": "In Progress",
      "assignedTo": {
        "id": "usr_staff",
        "displayName": "IT Staff User"
      },
      "createdAt": "2026-09-18T00:00:00.000Z",
      "updatedAt": "2026-09-18T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### GET /api/v1/staff/tickets/:ticketId

Protected endpoint. Roles: IT Staff, Administrator when authorized for staff operations.

Returns staff Ticket Detail including requester information, assignment, IT Priority, status history, public comments, internal notes, Actions Taken, and Attachment metadata.

### PATCH /api/v1/staff/tickets/:ticketId/assignment

Protected endpoint. Roles: IT Staff, Administrator when authorized for staff operations.

Request:

```json
{
  "assignedToUserId": "usr_staff"
}
```

Rules:

- `assignedToUserId` must reference an active IT Staff user.
- The change is recorded with actor and timestamp.

### PATCH /api/v1/staff/tickets/:ticketId/it-priority

Protected endpoint. Roles: IT Staff, Administrator when authorized for staff operations.

Request:

```json
{
  "itPriority": "High"
}
```

Allowed values:

- Low
- Medium
- High
- Urgent

### PATCH /api/v1/staff/tickets/:ticketId/status

Protected endpoint. Roles: IT Staff, Administrator when authorized for staff operations.

Request:

```json
{
  "status": "In Progress",
  "reason": "Started investigation."
}
```

The backend validates the transition using the approved workflow in `docs/lab-03/specification.md`.

### POST /api/v1/staff/tickets/:ticketId/actions

Protected endpoint. Roles: IT Staff, Administrator when authorized for staff operations.

Request:

```json
{
  "body": "Reset VPN profile and verified the requester can connect."
}
```

Creates an Actions Taken entry with actor and timestamp.

---

## 9. Comment and Note Endpoints

### GET /api/v1/tickets/:ticketId/comments

Protected endpoint. Roles: Requester, IT Staff, Administrator.

Requester access is limited to owned Tickets and public comments.

IT Staff and authorized Administrators may see public comments. Internal notes are retrieved through the staff detail contract, not this requester-facing endpoint.

### POST /api/v1/tickets/:ticketId/comments

Protected endpoint. Roles: Requester, IT Staff, Administrator.

Request:

```json
{
  "body": "I can provide a screenshot if needed."
}
```

Creates a public comment when the actor is authorized for the Ticket.

### POST /api/v1/staff/tickets/:ticketId/internal-notes

Protected endpoint. Roles: IT Staff, Administrator when authorized for staff operations.

Request:

```json
{
  "body": "Likely account sync issue. Do not expose internal diagnosis yet."
}
```

Creates an internal note visible only to IT Staff and authorized Administrators.

---

## 10. Administrator User Management Endpoints

### GET /api/v1/admin/users

Protected endpoint. Roles: Administrator.

Query parameters:

- `search`
- `role`
- `isActive`
- `sort`
- `order`
- `page`
- `pageSize`

Success response:

```json
{
  "data": [
    {
      "id": "usr_123",
      "displayName": "Anan Chaiyasit",
      "email": "anan.chaiyasit@example.com",
      "roles": ["Requester"],
      "isActive": true,
      "createdAt": "2026-09-18T00:00:00.000Z",
      "updatedAt": "2026-09-18T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### POST /api/v1/admin/users

Protected endpoint. Roles: Administrator.

Request:

```json
{
  "displayName": "IT Staff User",
  "email": "staff@example.com",
  "password": "temporary-password",
  "roles": ["ITStaff"],
  "isActive": true
}
```

Rules:

- email is required and unique;
- display name is required;
- password is required for new local accounts;
- at least one role is required;
- unsupported roles are rejected; and
- password is stored only as a one-way hash.

### GET /api/v1/admin/users/:userId

Protected endpoint. Roles: Administrator.

Returns one user.

### PATCH /api/v1/admin/users/:userId

Protected endpoint. Roles: Administrator.

Request:

```json
{
  "displayName": "Updated Name",
  "email": "updated@example.com",
  "roles": ["Requester", "ITStaff"],
  "isActive": true
}
```

Rules:

- duplicate email is rejected;
- unsupported role is rejected;
- deactivating or deroling the last usable Administrator is rejected; and
- historical records are not deleted when a user is deactivated.

### PATCH /api/v1/admin/users/:userId/password

Protected endpoint. Roles: Administrator.

Request:

```json
{
  "password": "new-temporary-password"
}
```

Sets a new one-way password hash. Plain-text passwords must not be returned.

---

## 11. Authorization Matrix

| Capability | Requester | IT Staff | Administrator |
|---|---:|---:|---:|
| Login / logout | Yes | Yes | Yes |
| Current user | Yes | Yes | Yes |
| Create own Ticket | Yes | No | No |
| View own Tickets | Yes | No | No |
| Manage own Attachments | Yes | No | No |
| Staff queue | No | Yes | Conditional |
| Staff Ticket Detail | No | Yes | Conditional |
| Assign Tickets | No | Yes | Conditional |
| Set IT Priority | No | Yes | Conditional |
| Change Ticket status | Limited reopen only | Yes | Conditional |
| Public comments | Own Tickets | All staff-authorized Tickets | Conditional |
| Internal notes | No | Yes | Conditional |
| Actions Taken | No | Yes | Conditional |
| User management | No | No | Yes |

Conditional Administrator staff access must be decided consistently during implementation and reflected in tests.

---

## 12. Lab 2 Compatibility Notes

The following Lab 2 endpoint semantics must be preserved for authenticated Requesters:

- Ticket Number format and uniqueness;
- Requested Priority values;
- initial Ticket status `New`;
- Ticket ownership isolation;
- My Tickets search, filters, sorting, and pagination;
- Ticket Detail read-only requester view;
- Attachment type and size validation;
- Attachment maximum active count;
- Attachment soft removal; and
- removed Attachment download blocking.

The Lab 2 `/api/health` endpoint may remain public for operational checks.
