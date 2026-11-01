# TokTickIT — IT Service Desk Application

TokTickIT is a full-stack IT service desk application developed for the CPE 334 Software Engineering course. It manages IT service requests across Account & Access, Hardware, Software, and Network categories.

The application supports Requesters, IT Staff, and Administrators through role-based workflows for ticket creation, ticket management, Actions Taken, dashboards, and user administration.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Bootstrap 5
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 5.22.0
- **Testing:** Vitest, Supertest, React Testing Library, Playwright
- **Accessibility:** axe-core with Playwright

## Repository Structure

```text
toktickit/
├── client/
│   ├── src/
│   │   ├── components/
│   │   └── ...
│   └── tests/
│       └── lab-04/
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   ├── seed-lab4.ts
│   │   └── verify-lab4-integrity.ts
│   ├── src/
│   └── tests/
│       └── lab-04/
├── e2e/
│   └── lab-04/
├── docs/
│   ├── lab-01/
│   ├── lab-02/
│   ├── lab-03/
│   └── lab-04/
│       ├── specification.md
│       ├── api-spec.md
│       ├── tests.md
│       ├── ui-spec.md
│       ├── reviewer.md
│       └── ai-use.md
├── artifacts/
│   └── lab-04/
│       └── screenshots/
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- PostgreSQL 14 or later
- Git

## Installation and Environment Setup

Clone the repository and enter the project directory:

```bash
git clone https://github.com/MoeD3482/Toktickit.git
cd Toktickit
```

Install root dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
cd ..
```

### Backend Environment

Create `server/.env` using `server/.env.example` as a template:

```env
DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
PORT=3000
```

Update the database connection string to match your local PostgreSQL configuration.

### Frontend Environment

Create `client/.env` using `client/.env.example`:

```env
VITE_API_URL="http://localhost:3000"
```

Do not commit real `.env` files or credentials.

## Database Setup

Create the PostgreSQL database before running the migrations.

From the `server` directory:

```bash
cd server
npx prisma generate
npx prisma migrate dev --schema prisma/schema.prisma
```

Run the standard seed command:

```bash
npm run prisma:seed
```

The standard seed script is `prisma/seed.ts`.

The Lab 4 seed fixture is maintained separately in:

```text
server/prisma/seed-lab4.ts
```

The read-only Lab 4 database integrity verification script is:

```text
server/prisma/verify-lab4-integrity.ts
```

To check migration status:

```bash
npx prisma migrate status --schema prisma/schema.prisma
```

## Running the Application

Open two terminals from the project root.

### Backend

```bash
cd server
npm run dev
```

Backend development URL:

```text
http://localhost:3000
```

### Frontend

```bash
cd client
npm run dev
```

Frontend development URL:

```text
http://localhost:5173
```

Open the frontend URL in a browser to use the application.

## Application Features

### Lab 1 — Project Foundation

- System health check.
- API connectivity verification.
- IT service request category retrieval.
- Loading and safe error feedback.

### Lab 2 — Ticket Management

- Ticket creation and validation.
- Requester ticket listing.
- Ticket detail viewing.
- Public comments.
- Attachment upload and management.
- Safe handling of failed requests.

### Lab 3 — Authentication, Authorization, and Administration

- Login and logout.
- Inactive account protection.
- First-login password change.
- Role-based access control.
- Requester ticket workflows.
- IT Staff ticket queue and ticket management.
- Public comments and private internal notes.
- Administrator user listing, creation, editing, activation, and deactivation.
- Protection against self-deactivation and removal of the last active Administrator.

Application roles:

- Requester
- IT Staff
- Administrator

### Lab 4 — Actions Taken, Ticket Workflow, and Dashboards

**Actions Taken**

- Record multiple Actions Taken for a Ticket.
- Derive the performer from the authenticated user.
- Validate action details and follow-up requirements.
- Display Actions Taken to Requesters as read-only information.
- Support permitted editing without hard deletion.

**Ticket Workflow**

- Enforce permitted status transitions.
- Reject invalid transitions.
- Apply resolution requirements before resolving Tickets.
- Handle stale updates and conflicts safely.
- Keep Requester feedback separate from automatic Ticket status changes.

**Requester Dashboard**

- Display open Tickets.
- Display Tickets waiting for the Requester.
- Display recently updated and recently resolved Tickets.
- Provide navigation from dashboard metrics and Ticket summaries to Ticket details.
- Restrict dashboard information to the authenticated Requester.

**IT Staff Dashboard**

- Display unassigned Tickets.
- Display Tickets owned by the current Staff user.
- Summarize Ticket status and IT Priority.
- Show recent and urgent Tickets.
- Provide navigation to Ticket details and relevant queue views.

## UI and Responsive Design

The application follows the existing **Zen Green** design language.

The UI supports desktop, tablet, and mobile layouts. Lab 4 verification includes screenshots at:

- Desktop: 1440 × 900
- Tablet: 768 × 1024
- Mobile: 375 × 812

Screenshots are stored under:

```text
artifacts/lab-04/screenshots/
```

The UI specification is documented in:

```text
docs/lab-04/ui-spec.md
```

Automated accessibility checks use axe-core and Playwright. These checks cover selected pages and do not represent a complete manual WCAG audit of every screen.

## Testing and Verification

Run commands from the appropriate directory.

### Backend Tests

```bash
cd server
npm test
```

Latest recorded result:

- 20 test files passed.
- 97 tests passed.
- 0 failures.

### Frontend Tests

```bash
cd client
npm test
```

Latest recorded result:

- 16 test files passed.
- 61 tests passed.
- 0 failures.

### End-to-End Tests

From the project root:

```bash
npm run test:e2e
```

Latest recorded result:

- 14 Playwright tests passed.
- 0 failures.

To run the E2E tests with a visible browser:

```bash
npm run test:e2e:headed
```

### Production Builds

Backend:

```bash
cd server
npm run build
```

Frontend:

```bash
cd client
npm run build
```

### Additional Verification

From the project root:

```bash
npx tsc --noEmit
git diff --check
```

From the `server` directory:

```bash
npx prisma migrate status --schema prisma/schema.prisma
npx tsx prisma/verify-lab4-integrity.ts
```

Refer to `docs/lab-04/tests.md` for the detailed test plan, test file paths, acceptance-criterion traceability, verification results, and known limitations.

## Git Engineering Workflow

The intended integration workflow is:

```text
Feature Branches
       |
       v
  lab4-staging
       |
       v
      main
```

Work is organized through GitHub Issues and feature branches. Changes are reviewed through Pull Requests before integration into the staging branch and final `main` branch.

The final repository history, reviewer records, and merge evidence should be verified against the actual GitHub repository before submission.

## Documentation

Project documentation is maintained under `docs/`.

Lab 4 documents include:

- `specification.md` — Functional requirements, business rules, acceptance criteria, and Definition of Done.
- `api-spec.md` — API contracts and authorization requirements.
- `tests.md` — Test strategy, test paths, acceptance-criterion traceability, and actual verification results.
- `ui-spec.md` — Zen Green UI, responsive, and accessibility requirements.
- `reviewer.md` — Peer review and Pull Request records.
- `ai-use.md` — AI tools, actual usage, and student reflection.

## AI Use

AI tools were used as supporting tools during the project for requirements analysis, code understanding, debugging, test review, and documentation assistance.

The student remains responsible for reviewing suggestions, understanding implementation decisions, checking the assignment requirements, and verifying actual application behavior.

The detailed record and reflection are maintained in:

```text
docs/lab-04/ai-use.md
```

## Latest Recorded Lab 4 Verification

| Verification | Result |
|---|---:|
| Backend test files | 20/20 passed |
| Backend tests | 97/97 passed |
| Frontend test files | 16/16 passed |
| Frontend tests | 61/61 passed |
| Playwright E2E tests | 14/14 passed |
| Root TypeScript check | Passed |
| Server production build | Passed |
| Client production build | Passed |
| Prisma migrations | 10 applied; schema up to date |
| Lab 4 screenshots | 33 generated |

The automated test total is **172 tests**: 97 backend, 61 frontend, and 14 E2E.

The latest recorded verification is not a substitute for final verification on the integrated `main` branch. Historical before-and-after database comparison, a complete manual accessibility audit, and production-scale load testing have not been claimed.

## Project Status

TokTickIT has progressed through Labs 1–4, covering the initial application foundation, ticket management, authentication and authorization, administration, Actions Taken, Ticket workflow, dashboards, and final regression verification.

The final submission should be based on the verified integrated `main` branch and the official Lab 4 Answer Part 1–9 report requirements.