# Lab 2 REST API Specification

## 1. Purpose

This document defines the REST API contract for the TokTickIT Lab 2 Requester-facing sprint.

It covers:

- Development Requester retrieval
- Category retrieval
- Related System retrieval
- Ticket creation
- My Tickets retrieval
- Requester Ticket Detail
- Attachment upload
- Attachment metadata retrieval
- Attachment download
- Attachment soft removal
- validation
- ownership protection
- search, filtering, sorting, and pagination
- safe error responses

Lab 2 does not implement real authentication.

---

## 2. API Base Path

New Lab 2 endpoints use:

```text
/api/v1