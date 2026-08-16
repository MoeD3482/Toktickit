# TokTickIT - IT Service Desk Application

TokTickIT is a full-stack IT service desk application for managing Account & Access, Hardware, Software, and Network service requests.

## 🏗️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Bootstrap 5
- **Backend:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Testing:** Vitest, Supertest, React Testing Library

---

## 📁 Repository Structure

```text
toktickit/
├── client/          # React + TypeScript + Vite frontend
├── server/          # Express + Node.js + TypeScript + Prisma backend
│   ├── prisma/      # Prisma schema, migrations, and seed scripts
│   ├── src/         # Express server source code
│   └── tests/       # API integration tests (Supertest + Vitest)
│       └── lab-01/
├── docs/            # Lab documentation & reports
│   └── lab-01/
│       ├── ai_use.md
│       ├── reviewer.md
│       └── tests.md
├── .gitignore       # Git ignore settings
└── README.md        # Project foundation setup guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18+ or v20+
- **PostgreSQL:** v14+ running locally
- **npm:** v9+

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

## 🧪 Testing & Verification

### Run Backend Tests (Server)

```bash
cd server
npm test
```

The backend tests verify:

- `GET /api/health`
- `GET /api/categories`

### Run Frontend Tests (Client)

```bash
cd client
npm test
```

The frontend tests verify:

- TokTickIT heading renders correctly
- Loading and success behavior
- Categories returned by the API are displayed
- A useful error message is displayed when the API is unavailable

### Build Verification

```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```
---
## ✅ Lab 1 Result

When the user clicks **Check System**:

1. The application shows a loading state.
2. The frontend calls `GET /api/health`.
3. The frontend calls `GET /api/categories`.
4. The application displays **System Status: Online** when successful.
5. The four IT request categories returned by the API are displayed.
6. A useful error message is displayed if the API or database is unavailable.