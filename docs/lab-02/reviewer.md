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
| #14 Engineering Contract and Test Plan | [PR #21](https://github.com/MoeD3482/Toktickit/pull/21) | `feature/lab2-specification` | Approved and Merged |
| #15 Development Requester Context | [PR #22](https://github.com/MoeD3482/Toktickit/pull/22) | `feature/requester-context` | Approved and Merged |
| #16 Create Ticket | [PR #23](https://github.com/MoeD3482/Toktickit/pull/23) | `feature/create-ticket` | Approved and Merged |
| #17 My Tickets | [PR #24](https://github.com/MoeD3482/Toktickit/pull/24) | `feature/my-tickets` | Approved and Merged |
| #18 Requester Ticket Detail | [PR #25](https://github.com/MoeD3482/Toktickit/pull/25) | `feature/ticket-detail` | Approved and Merged |
| #19 Attachment Lifecycle | [PR #26](https://github.com/MoeD3482/Toktickit/pull/26) | `feature/attachments` | Approved and Merged |
| #20 Integration, E2E and Responsive Verification | [PR #27](https://github.com/MoeD3482/Toktickit/pull/27) | `feature/lab2-verification` | Approved and Merged |

---

## Final Release Pull Request

| Pull Request | From | Into | Reviewer Verdict |
|---|---|---|---|
| [PR #28 — Lab 2: Requester Ticketing MVP Release](https://github.com/MoeD3482/Toktickit/pull/28) | `lab2-staging` | `main` | Approved and Merged |

PR #28 integrated all completed Lab 2 feature Pull Requests from `lab2-staging` into the final `main` branch.

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
Thanks for the review. The Requester context, reference APIs, UI flow, and tests were verified before merging into `lab2-staging`.

---

### PR #23 — Issue #16 Create Ticket

**Reviewer comment:**  
Reviewed the Create Ticket implementation, validation, Ticket Number generation, duplicate protection, and tests. Everything looks good. Approved.

**My response:**  
Thanks for the review. The Create Ticket workflow, validation, Ticket Number generation, duplicate submission protection, API tests, and UI tests were verified before merge.

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
The Ticket Detail workflow, requester ownership protection, navigation, detail display, error handling, API tests, and UI tests were verified before merge.

---

### PR #26 — Issue #19 Attachment Lifecycle

**Reviewer comment:**  
The Attachment lifecycle implementation looks good overall. Please make sure the upload validation checks the actual file content, not only the filename extension and declared MIME type, and confirm that removed Attachments cannot be downloaded.

**My response:**  
The Attachment validation was verified to check detected file content in addition to the filename extension and declared MIME type. Soft-removed Attachments retain their metadata but cannot be downloaded. The related API and UI tests were also verified.

---

### PR #27 — Issue #20 Integration, E2E and Responsive Verification

**Reviewer comment:**  
Reviewed the Lab 2 final integration and verification. The Zen Green UI, E2E flows, documentation updates, and final test results look good. Server, client, and Playwright tests are passing, and the implementation remains within Lab 2 scope. Approved.

**My response:**  
Thank you for the review. I verified the final Lab 2 integration, documentation, Zen Green UI, automated tests, E2E workflows, and manual API checks. The feature branch was then merged into `lab2-staging`.

---

### PR #28 — Final Lab 2 Release

**Reviewer comment:**  
Reviewed the Lab 2 release integration from `lab2-staging` to `main`. All completed Lab 2 features, documentation, and verification results are included. The release is ready for `main`. Approved.

**My response:**  
Thank you for the final review. I confirmed that all Lab 2 Issues, documentation, automated tests, E2E tests, and integration work were included in the release. PR #28 was merged into `main`.

---

## Pull Requests I Reviewed for My Partner

**Partner:** Lae Lae Kaung Nyunt  
**GitHub:** @LaeLaeKaungNyunt

This section records Pull Requests that I reviewed for my partner.

| Pull Request | My Review Result | My Comment | Partner Response |
|---|---|---|---|
| To be added after partner PR review | Pending | Pending | Pending |

---

## Final Verification on Main

After PR #28 was approved and merged, the final Lab 2 verification was executed from the `main` branch.

| Verification | Final Result |
|---|---|
| Server automated tests | 26/26 Passed |
| Server production build | Passed |
| Client automated tests | 22/22 Passed |
| Client production build | Passed |
| Playwright E2E tests | 2/2 Passed |
| Manual API verification | Completed |
| GitHub Issues #14–#20 | 7/7 Done |
| Release PR #28 | Approved and Merged |

The final `main` branch contains the complete Lab 2 Requester Ticketing MVP.

---

## Review Summary

Lab 2 was developed incrementally through seven GitHub Issues, #14 through #20.

Each Issue was implemented on its own feature branch and integrated through a peer-reviewed Pull Request into `lab2-staging`.

PRs #21, #22, #23, #24, #25, #26, and #27 were reviewed, approved, and merged into `lab2-staging`.

After final integration and verification, Release PR #28 was opened from `lab2-staging` to `main`. The release Pull Request received peer approval and was merged successfully.

The final `main` branch was verified after the release merge:

- Server tests: 26/26 passed
- Client tests: 22/22 passed
- Playwright E2E tests: 2/2 passed
- Server build: passed
- Client build: passed
- All seven Lab 2 Issues are in Done status

This completes the Lab 2 GitHub feature-branch, peer-review, staging, and release workflow.