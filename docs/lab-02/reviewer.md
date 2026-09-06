# Lab 2 — Peer Review Record

**Author:** Moe Htet Aung
**GitHub:** @MoeD3482

## Peer Reviewer

**Reviewer Name:** Lae Lae Kaung Nyunt
**Student ID:** 67070503481
**GitHub Username:** @LaeLaeKaungNyunt

---

## Pull Requests I Authored

| Issue | Pull Request | Branch | Reviewer Verdict |
|---|---|---|---|
| #14 Engineering Contract and Test Plan | PR #21 | `feature/lab2-specification` | Approved and Merged |
| #15 Development Requester Context | PR #22 | `feature/requester-context` | Approved and Merged |
| #16 Create Ticket | PR #23 | `feature/create-ticket` | Approved and Merged |
| #17 My Tickets | PR #24 | `feature/my-tickets` | Approved and Merged |
| #18 Requester Ticket Detail | PR #25 | `feature/ticket-detail` | Approved and Merged |
| #19 Attachment Lifecycle | PR #26 | `feature/attachments` | Approved and Merged |
| #20 Integration, E2E and Responsive Verification | Not opened yet | `feature/lab2-verification` | Pending |

---

## Review Comments I Received

### PR #21 — Issue #14 Engineering Contract and Test Plan

**Reviewer comment:**
Reviewed the Lab 2 engineering contract and test plan. Everything is clear, traceable, and within scope. Approved.

**My response:**
Thank you for the review. I checked the documents again and confirmed that Issue #14 contains the Lab 2 engineering contract and test planning documents. The review was approved and the Pull Request was merged into `lab2-staging`.

---

### PR #22 — Issue #15 Development Requester Context

**Reviewer comment:**
Reviewed the Development Requester context, APIs, UI, and tests. Everything works as expected and is within scope. Approved.

**My response:**
Thanks for the review. The Requester context, reference APIs, UI flow, and tests were verified and merged.

---

### PR #23 — Issue #16 Create Ticket

**Reviewer comment:**
Reviewed the Create Ticket implementation, validation, Ticket Number generation, duplicate protection, and tests. Everything looks good. Approved.

**My response:**
Thanks for the review. The Create Ticket workflow, validation, Ticket Number generation, duplicate submission protection, API tests, and UI tests were verified and merged.

---

### PR #24 — Issue #17 My Tickets

**Reviewer comment:**
Reviewed the My Tickets implementation and tests. Search, filtering, sorting, pagination, and requester ownership work as expected. Approved.

**My response:**
The My Tickets feature was verified with requester ownership, search, filtering, sorting, pagination, API tests, and UI tests before being merged.

---

### PR #25 — Issue #18 Requester Ticket Detail

**Reviewer comment:**
Reviewed the Requester Ticket Detail implementation and tests. Ownership protection, navigation, detail display, and error handling work as expected. Approved.

**My response:**
The Ticket Detail workflow, requester ownership protection, navigation, detail display, error handling, API tests, and UI tests were verified and merged.

---

### PR #26 — Issue #19 Attachment Lifecycle

**Reviewer comment:**
The Attachment lifecycle implementation looks good overall. Please make sure the upload validation checks the actual file content, not only the filename extension and declared MIME type, and confirm that removed Attachments cannot be downloaded.

**My response:**
The Attachment validation was verified to check detected file content in addition to the filename extension and declared MIME type. Soft-removed Attachments remain as metadata but cannot be downloaded. The implementation was approved and merged after verification.

---

### Issue #20 — Integration, E2E and Responsive Verification

**Reviewer comment:**
Pending because the Pull Request has not been opened yet.

**My response:**
Final integration and verification are in progress. Server, client, E2E, manual API, documentation, and responsive checks are being completed before opening the Pull Request.

---

## Pull Requests I Reviewed for My Partner

**Partner:** Lae Lae Kaung Nyunt
**GitHub:** @LaeLaeKaungNyunt

No partner Pull Request review evidence has been added yet.

| Pull Request | My Review Result | My Comment | Partner Response |
|---|---|---|---|
| To be added after partner review | Pending | Pending | Pending |

---

## Review Summary

Lab 2 development was completed incrementally through Issues #14–#20.

PRs #21, #22, #23, #24, #25, and #26 were reviewed, approved, and merged into `lab2-staging`.

For PR #26, the reviewer specifically requested verification that Attachment validation checks actual file content and that removed Attachments cannot be downloaded. These behaviors were verified during implementation and testing before the Pull Request was merged.

Current verification status:

- Server automated tests: 26/26 passed
- Client automated tests: 22/22 passed
- Playwright E2E tests: 2/2 passed
- Manual API verification: completed for the main Lab 2 Requester workflows
- Attachment upload, download, soft removal, and removed-download protection: verified

Issue #20 is the final integration, documentation, E2E, and responsive-verification task. Its Pull Request will be submitted for peer review before the Lab 2 sprint is considered complete.
