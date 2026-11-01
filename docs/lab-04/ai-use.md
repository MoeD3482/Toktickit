# Lab 4 — AI Use and Reflection

## 1. Purpose

This document explains how ChatGPT supported the specification, planning, implementation guidance, debugging, documentation, and verification activities for Lab 4.

The student remained responsible for understanding the project, making implementation decisions, reviewing changes, running commands, and checking actual application behavior.

## 2. AI Tools Used

### Conversational AI

- **Tool:** ChatGPT
- **Role:** Specification assistant, technical explainer, implementation guide, debugging assistant, documentation assistant, and test-result reviewer.
- **Usage:** Helped interpret the Lab 4 assignment, organize requirements, review API and UI specifications, explain implementation steps, and assess verification evidence.

### Development Environment

- **Tool:** Visual Studio Code (VS Code)
- **Role:** Main code editor and development environment.
- **Usage:** Used to inspect and edit project files, work with Git, run terminal commands, execute tests, build the application, and inspect implementation changes.

VS Code was used as the development environment, not as an AI model. TypeScript, Vite, Node.js, Prisma, Vitest, and Playwright tools performed the relevant compilation, build, database, and test operations.

### Other AI Tools

No other AI tools are recorded for this project.

## 3. Selected Key Prompts

The following are reconstructed summaries of the main prompts and requests used during the project. They describe the actual categories of assistance requested and are not presented as verbatim transcripts.

### Prompt 1 — Engineering Contract

**Prompt summary:**

"Review the Lab 4 assignment PDF and help define the implementation scope, functional requirements, business rules, acceptance criteria, and Definition of Done. Keep the requirements aligned with the existing TokTickIT application."

**Purpose:**

Translate the assignment into an understandable engineering contract before implementation.

### Prompt 2 — Test Planning and Traceability

**Prompt summary:**

"Help map Lab 4 requirements and acceptance criteria to backend, frontend, database, workflow, authorization, responsive, accessibility, and end-to-end tests."

**Purpose:**

Connect requirements to verifiable tests and organize the test documentation.

### Prompt 3 — Database Design

**Prompt summary:**

"Review the Actions Taken data model and explain the relationships between Tickets and Users, required constraints, migration safety, and data preservation."

**Purpose:**

Understand database design decisions and identify risks before changing the schema.

### Prompt 4 — REST API Specification

**Prompt summary:**

"Review the proposed Actions Taken, Ticket workflow, Requester Dashboard, and IT Staff Dashboard APIs. Check authentication, authorization, validation, safe errors, and concurrency behavior."

**Purpose:**

Make API responsibilities and expected behavior clear before relying on the implementation.

### Prompt 5 — Ticket Workflow

**Prompt summary:**

"Check the approved Ticket status transition matrix, resolution requirements, requester feedback behavior, and stale-update handling. Do not introduce unapproved workflow transitions."

**Purpose:**

Keep workflow behavior consistent with the documented business rules.

### Prompt 6 — Dashboard Design

**Prompt summary:**

"Help define Requester and IT Staff Dashboard metrics, database-based calculations, ownership restrictions, empty states, and drill-down behavior."

**Purpose:**

Ensure dashboards show useful information without bypassing backend authorization.

### Prompt 7 — Implementation Review

**Prompt summary:**

"Inspect the current implementation and proposed code changes against the Lab 4 specification. Identify missing behavior and avoid unrelated modifications to existing Labs 1–3 functionality."

**Purpose:**

Review code changes in small steps and keep implementation within scope.

### Prompt 8 — Debugging

**Prompt summary:**

"Help diagnose the issue using the actual error output and relevant source code. Explain the cause and suggest the smallest safe correction."

**Purpose:**

Use evidence from the application and terminal rather than guessing at the cause of a problem.

### Prompt 9 — Regression and Final Verification

**Prompt summary:**

"Review the actual test, build, migration, and Playwright output. Compare the results with the Lab 4 acceptance criteria and identify any remaining verification gaps."

**Purpose:**

Distinguish successful feature-branch tests from final integrated-branch verification.

### Prompt 10 — Documentation and Reflection

**Prompt summary:**

"Review the README, API specification, UI specification, test plan, peer review record, and AI-use record. Make the documents consistent with actual implementation and verified evidence."

**Purpose:**

Improve documentation accuracy and prepare evidence for the official Lab 4 report.

## 4. My Reflection

### 4.1 Specification Assistant

ChatGPT helped me break down the Lab 4 assignment into smaller requirements. It helped organize the Actions Taken feature, Ticket workflow, dashboard calculations, authorization rules, test planning, and UI requirements.

It was useful for explaining technical concepts and identifying requirements that could easily be missed, such as requester ownership checks, follow-up validation, resolution gates, and stale-update conflicts.

However, AI suggestions still needed to be compared with the actual assignment PDF and existing project behavior. I had to make sure that proposed API routes, status rules, and dashboard calculations did not conflict with the project's established implementation.

### 4.2 Coding and Development Assistance

I used ChatGPT to understand implementation steps, inspect code changes, review errors, and plan focused fixes. I used Visual Studio Code as my main development environment to edit files, inspect diffs, run terminal commands, and test the application.

I did not treat VS Code as an AI coding agent. ChatGPT provided conversational guidance, while I used the development environment and project tools to work with the actual source code.

For Issue #9, I reviewed the Create User and Edit User workflows, checked the UI behavior, and tested user creation, duplicate-email rejection, editing, role changes, deactivation, and reactivation.

I also used Playwright to capture screenshots at desktop, tablet, and mobile viewport sizes.

### 4.3 Verification and Student Responsibility

I remained responsible for checking the implementation and deciding whether changes were acceptable.

My verification included:

- Comparing implementation scope with the Lab 4 assignment and specifications.
- Reviewing source-code changes and Git diffs.
- Checking database migration status.
- Running backend and frontend automated tests.
- Running Playwright end-to-end tests.
- Running production builds and TypeScript checks.
- Testing actual application behavior in the browser.
- Checking responsive screenshots.
- Reviewing authorization and ownership behavior.
- Keeping unverified peer-review and final integration claims out of the documentation.

The recorded feature-branch verification results were:

| Verification | Recorded Result |
|---|---:|
| Backend tests | 97/97 passed |
| Frontend tests | 61/61 passed |
| Playwright E2E tests | 14/14 passed |
| Root TypeScript check | Passed |
| Server production build | Passed |
| Client production build | Passed |
| Prisma migrations | 10 migrations; schema up to date |
| Responsive screenshots | 33 generated |

These results describe the recorded feature-branch verification. They do not claim that final integrated `main` verification or peer-review approval has already occurred.

### 4.4 Lessons Learned

**Lesson 1 — AI suggestions need independent verification.**

An AI-generated implementation suggestion may look correct but still fail because of existing project conventions, missing authorization, incorrect API behavior, or integration problems. Reading the actual code and running tests are necessary before accepting a change.

**Lesson 2 — Clear specifications reduce implementation mistakes.**

Writing down API contracts, workflow rules, dashboard calculations, and acceptance criteria makes it easier to review implementation decisions and identify missing behavior.

**Lesson 3 — Small changes are easier to debug.**

Implementing and checking one focused feature at a time makes it easier to understand failures, review diffs, and avoid breaking existing functionality.

**Lesson 4 — Passing tests do not prove every requirement is complete.**

Automated tests provide important evidence, but manual UI inspection, accessibility checks, Git integration review, and accurate documentation are also necessary.

## 5. Verification Statement

ChatGPT was used as a conversational AI assistant. Visual Studio Code was used as the development environment.

AI-generated suggestions were not treated as proof of correctness. The student remained responsible for reviewing the source code, making implementation decisions, running verification commands, checking actual application behavior, and documenting limitations honestly.

All implementation, test, review, and merge claims in the final submission must be supported by actual source code, command output, repository history, or verified review evidence.