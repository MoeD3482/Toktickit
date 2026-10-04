# TokTickIT - IT Service Desk Application

TokTickIT is a full-stack IT service desk application for managing Account & Access, Hardware, Software, and Network service requests.

## 🏗️ Technology Stack

* **Frontend:** React, TypeScript, Vite, Bootstrap 5
* **Backend:** Node.js, Express, TypeScript
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Testing:** Vitest, Supertest, React Testing Library, Playwright

---

## 📁 Repository Structure

```text
toktickit/

├── client/                 # React + TypeScript + Vite frontend
│   ├── src/                # Frontend source code
│   └── tests/              # Client tests
│
├── server/                 # Express + Node.js + TypeScript + Prisma backend
│   ├── prisma/             # Prisma schema, migrations, and seed scripts
│   ├── src/                # Express server source code
│   └── tests/              # API integration tests
│       ├── lab-01/         # Lab 1 tests
│       ├── lab-02/         # Lab 2 tests
│       └── lab-03/         # Lab 3 API tests
│
├── e2e/                    # Playwright end-to-end tests
│   └── lab-03/             # Lab 3 E2E tests
│
├── docs/                   # Lab documentation
│   ├── lab-01/
│   ├── lab-02/
│   └── lab-03/
│       ├── specification.md
│       ├── tests.md
│       ├── ui-spec.md
│       ├── api-spec.md
│       ├── reviewer.md
│       └── ai-use.md
│
├── artifacts/              # Verification and screenshot evidence
│   └── lab-03/
│       └── screenshots/
│
├── .gitignore              # Git ignore settings
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js:** v18+ or v20+
* **PostgreSQL:** v14+ running locally
* **npm:** v9+

### Environment Setup

1. Create the local `.env` files from the provided `.env.example` files.

2. Configure `DATABASE_URL` in `server/.env` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/toktickit?schema=public"

PORT=3000
```

3. Configure the frontend API URL if required:

```env
VITE_API_URL=http://localhost:3000
```

> Do not commit `.env` files because they may contain database credentials or other secrets.

---

## 🗄️ Database Setup

TokTickIT uses **PostgreSQL** as the database and **Prisma ORM** for database access and schema management.

Go to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply the database migration:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npx prisma db seed
```

The database is seeded with four IT request categories:

1. Account and Access
2. Hardware
3. Software
4. Network

---

## 📦 Installation & Setup

### 1. Backend Setup (`/server`)

```bash
cd server
npm install
npx prisma generate
```

To run the backend development server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

### 2. Frontend Setup (`/client`)

```bash
cd client
npm install
```

To run the frontend development server:

```bash
npm run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

---

## 🔌 API Endpoints

### Health Check

```text
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "TokTickIT API"
}
```

### Category List

```text
GET /api/categories
```

Expected response:

```json
[
  { "id": 1, "name": "Account and Access" },
  { "id": 2, "name": "Hardware" },
  { "id": 3, "name": "Software" },
  { "id": 4, "name": "Network" }
]
```

---

# 🧪 Testing & Verification

## Backend Tests

From the `server` directory:

```bash
cd server
npm test
```

The backend test suite covers Lab 1, Lab 2, and Lab 3 functionality, including:

* Health check
* Categories
* Ticket creation
* Ticket details
* My Tickets
* Requesters
* Attachments
* Authentication
* Authorization
* Comments and internal notes
* IT Staff ticket queue
* IT Staff ticket actions
* IT Staff ticket details
* Administrator user management

### Final Backend Verification

```text
15 test files passed
57 tests passed
```

---

## Frontend Tests

From the `client` directory:

```bash
cd client
npm test
```

The frontend tests verify application behavior including authentication, password change, IT Staff workflows, Administrator user management, and other Lab 3 UI functionality.

### Final Frontend Verification

```text
12 test files passed
38 tests passed
```

---

## End-to-End Tests

From the project root:

```bash
npm run test:e2e
```

The Playwright end-to-end tests verify complete user workflows including:

* Authentication login/logout
* Invalid login handling
* Attachment lifecycle
* Requester ticket creation and My Tickets
* IT Staff queue and filtering
* IT Staff ticket controls
* Administrator user management
* Administrator user creation

### Final E2E Verification

```text
8/8 tests passed
```

---

## Build Verification

### Build Server

```bash
cd server
npm run build
```

### Build Client

```bash
cd client
npm run build
```

Both server and client production builds passed during final Lab 3 verification.

---

# 🔐 Lab 3 Features

Lab 3 extends TokTickIT with authentication, authorization, IT Staff workflows, Administrator management, automated verification, and responsive UI improvements.

## Authentication

The application supports:

* User login
* Invalid login handling
* Inactive account protection
* Logout
* Session protection
* First-login password change
* Safe authentication failure messages

Users with an initial password are required to change their password before accessing protected application features.

---

## Authorization

TokTickIT uses role-based access control with the following application roles:

* **Requester**
* **IT Staff**
* **Administrator**

Protected API routes and UI workflows verify the user's role before allowing restricted operations.

Authorization is enforced at the API level as well as through the frontend UI.

---

## Requester Features

Requesters can:

* Create tickets
* View their tickets
* Open ticket details
* Add public comments
* Upload and manage supported attachments
* Use the requester ticket workflow
* Indicate when a problem appears resolved where permitted

Existing requester functionality was also regression-tested during Lab 3 verification.

---

## IT Staff Features

IT Staff can access the staff ticket queue and ticket details.

The IT Staff workflow supports:

* Ticket queue viewing
* Search and filtering
* Ticket ownership
* Claiming tickets
* Reassigning tickets
* IT priority management
* Permitted status changes
* Public comments
* Internal notes
* Attachment handling
* Ticket detail viewing

Role-based authorization prevents users without the required permissions from performing restricted IT Staff actions.

---

## Administrator Features

Administrators can manage application users.

Administrator user management supports:

* User listing
* Name and email search
* Role filtering
* User creation
* Duplicate email validation
* User editing
* Role management
* Active/inactive state management
* Initial password assignment

Security rules also protect administrator accounts:

* Users have exactly one application role.
* Non-Administrators cannot access administrator user management.
* An Administrator cannot deactivate their own account.
* The last active Administrator cannot be removed or deactivated.
* Users with an initial password must change it during their next login.

---

# 🎨 UI and Responsive Design

Lab 3 uses a consistent **Zen Green** visual design across the main application workflows.

The UI includes responsive behavior for:

* Desktop screens
* Tablet screens
* Mobile screens

The main Lab 3 interfaces include:

* Login
* Change Password
* IT Staff Ticket Queue
* IT Staff Ticket Detail
* Administrator User Management

The UI specification is documented in:

```text
docs/lab-03/ui-spec.md
```

---

# 📚 Lab 3 Documentation

The Lab 3 documentation is stored in:

```text
docs/lab-03/
```

The documentation includes:

* `specification.md` - Functional requirements, business rules, authorization matrix, acceptance criteria, migration decisions, and Definition of Done
* `tests.md` - Planned tests, acceptance-criteria traceability, test paths, and final verification status
* `ui-spec.md` - UI and responsive design specification
* `api-spec.md` - API and authorization contracts
* `reviewer.md` - Pull request and peer review record
* `ai-use.md` - AI tool usage and reflection

---

# 🌿 Git Engineering Workflow

Lab 3 was developed using feature branches and pull requests.

The work was organized through:

```text
Feature Branches
      ↓
lab3-staging
      ↓
main
```

The Lab 3 implementation was completed through Issues #1-#9 and the corresponding merged pull requests:

```text
PR #48  - Engineering Contract
PR #49  - User Model and Database Migration
PR #50  - Authentication
PR #51  - Authorization-Security
PR #52  - Requester-Regression
PR #54  - IT Staff Ticket Management
PR #55  - Administrator User Management
PR #56  - Automated Verification
PR #57  - Final Verification
```

The final Lab 3 documentation was committed to `main` after verification.

---

# 🤖 AI Use

ChatGPT was used during development as a supporting tool for:

* Understanding requirements
* Reviewing existing code
* Debugging TypeScript, Prisma, API, and Playwright issues
* Reviewing authorization behavior
* Improving automated test coverage
* Git workflow guidance
* Documentation review
* Final verification analysis

AI suggestions were checked against the existing project architecture, assignment requirements, test results, and Git history before being accepted.

The detailed AI use record is available at:

```text
docs/lab-03/ai-use.md
```

---

# 📊 Final Lab 3 Verification Result

| Verification         |          Result |
| -------------------- | --------------: |
| Backend test files   |    15/15 passed |
| Backend tests        |    57/57 passed |
| Client test files    |    12/12 passed |
| Client tests         |    38/38 passed |
| Playwright E2E tests |      8/8 passed |
| Server build         |          Passed |
| Client build         |          Passed |
| Lab 3 Issues         | #1-#9 completed |
| Lab 3 PRs            |  #48-#57 merged |

The final verification confirms that the Lab 3 implementation, automated tests, and production builds completed successfully.

---

## ✅ Lab 1 Result

When the user clicks **Check System**:

1. The application shows a loading state.
2. The frontend calls `GET /api/health`.
3. The frontend calls `GET /api/categories`.
4. The application displays **System Status: Online** when successful.
5. The four IT request categories returned by the API are displayed.
6. A useful error message is displayed if the API or database is unavailable.

## ✅ Lab 2 Result

When the user creates and manages a ticket:

1. The application allows the user to create a new service request.
2. The user can select a request category and provide the required ticket information.
3. The application validates required ticket fields before submission.
4. The created ticket is stored in the database and can be viewed from My Tickets.
5. The user can open a ticket to view its details.
6. The application supports ticket comments and attachment handling.
7. Useful error messages are displayed when a request fails.

## ✅ Lab 3 Result

When the user uses the Lab 3 features:

1. The application supports login, logout, inactive-account protection, and first-login password change.
2. Role-based authorization controls access for Requesters, IT Staff, and Administrators.
3. IT Staff can view, search, filter, manage, and open ticket details from the staff queue.
4. IT Staff can claim or reassign tickets, manage priority and permitted status changes, and use public comments and internal notes.
5. Administrators can search, filter, create, edit, activate, and deactivate users.
6. Administrator security rules prevent self-deactivation and removal or deactivation of the last active Administrator.
7. Non-Administrators cannot access Administrator user management.
8. The application provides responsive Zen Green UI for the main Lab 3 workflows.
9. Backend tests, client tests, and Playwright end-to-end tests passed successfully.
10. Server and client production builds completed successfully.

---


## 📝 Project Status

TokTickIT has progressed from the initial Lab 1 project foundation to the completed Lab 3 implementation.

The repository now contains the authentication, authorization, requester regression, IT Staff workflows, Administrator user management, automated verification, UI specifications, API specifications, review documentation, and AI-use documentation required for Lab 3.
