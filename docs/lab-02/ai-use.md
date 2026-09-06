# Lab 2 — AI Use Record

## 1. AI Tool Used

I used ChatGPT as an engineering assistant during Lab 2.

AI was used to help:

- interpret the Lab 2 requirements;
- identify missing business rules;
- structure the engineering specification;
- design the test plan;
- define the UI specification;
- define the REST API contract;
- plan GitHub Issues and feature branches;
- review implementation steps;
- help diagnose errors during development and testing.

---

## 2. How AI Was Used

AI was used mainly for planning, clarification, drafting, and technical guidance.

Examples include:

- turning the stakeholder request into numbered Functional Requirements;
- identifying Business Rules that needed to be decided before coding;
- preparing Acceptance Criteria in testable form;
- mapping Acceptance Criteria to planned tests;
- defining responsive Zen Green UI behavior;
- defining API request and response contracts;
- planning validation, ownership, pagination, and attachment behavior;
- preparing implementation steps for each GitHub Issue.

---

## 3. Human Decisions

AI suggestions were not accepted automatically.

I reviewed the generated material against:

- the Lab 2 handout;
- the approved TokTickIT System-Level SDS;
- the existing TokTickIT repository;
- the required Lab 2 scope.

Important design decisions were treated as student decisions, including:

- Development Requester context behavior;
- search fields;
- filter fields;
- sort fields;
- page sizes;
- validation limits;
- duplicate-submission prevention;
- attachment upload failure behavior;
- API parameter names.

These decisions were documented before implementation.

---

## 4. Verification

AI-generated suggestions were verified before being treated as complete.

Verification included:

- comparing requirements with the Lab 2 handout;
- checking consistency with the approved System-Level SDS;
- running automated tests;
- checking API behavior;
- checking database behavior;
- visually inspecting required UI states;
- performing peer review through GitHub Pull Requests.

An AI response claiming that work was complete was not treated as sufficient evidence.

Completion required actual implementation, passing tests, review, and required evidence.

---

## 5. Corrections and Refinements

AI output was corrected or refined when necessary.

Examples:

- Lab 2 uses Zen Green styling for the Requester-facing screens even though the System-Level SDS contains broader system UI guidance.
- The Development Requester selector is only a temporary testing mechanism and is not authentication.
- Production implementation was not started during the initial engineering-contract work.
- Test commands were documented before all related tools, such as Playwright, were configured.
- API and business-rule decisions were recorded explicitly rather than silently assumed.

---

## 6. Reflection

Using AI helped organize the Lab 2 requirements and made it easier to identify missing decisions before coding.

The main benefit was that AI could quickly propose structured specifications, tests, and implementation plans.

The main risk was accepting generated details without checking whether they were actually required or whether they matched the current project.

For this reason, I used the Lab 2 handout, the approved System-Level SDS, repository behavior, automated tests, and peer review as the final sources of truth.

AI was used as an engineering assistant, not as a replacement for engineering judgment or verification.